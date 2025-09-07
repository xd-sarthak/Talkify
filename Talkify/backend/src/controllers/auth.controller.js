import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/APIerror.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/APIresponse.js";
import mongoose from "mongoose";
import { upsertStreamUser } from "../lib/stream.js";

const generateAccessAndRefreshTokens = async (user) => {
  try {
    
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Check if JWT secrets are configured
    if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
      throw new ApiError(500, "JWT secrets not configured");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token generation error:", error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(500, "Invalid JWT configuration");
    }
    
    throw new ApiError(500, "Something went wrong while generating tokens", error);
  }
};

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         accessToken:
 *                           type: string
 *                           description: JWT access token
 *       400:
 *         description: Bad request - validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const signup = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if ([fullName, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email address");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  const idx = Math.floor(Math.random() * 100) + 1;
  const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

  // 🟢 Start transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Step 1: Create new user inside transaction
    const [newUser] = await User.create(
      [
        {
          fullName,
          email,
          password,
          profilePic: randomAvatar,
        },
      ],
      { session }
    );

    try {
      await upsertStreamUser({
        id: newUser._id,
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });

      console.log(`stream user created for ${newUser.fullName}`);
    } catch (error) {
      console.error("Error upserting stream user:", error);
      throw new ApiError(500, "Error upserting stream user");
    }

    // Step 2: Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      newUser
    );

    // Step 3: Save refreshToken in DB inside transaction
    newUser.refreshToken = refreshToken;
    await newUser.save({ validateBeforeSave: false, session });

    // Step 4: Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Step 5: Set cookie and respond
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const createdUser = await User.findById(newUser._id).select(
      "-password -refreshToken"
    );

    return res.status(201).json(
      new ApiResponse(
        201,
        { user: createdUser, accessToken },
        "User registered successfully"
      )
    );
  } catch (error) {
    // ❌ Rollback on failure
    await session.abortTransaction();
    session.endSession();
    console.error("Signup failed:", error);
    throw new ApiError(500, "Signup failed, rolled back changes");
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         accessToken:
 *                           type: string
 *                           description: JWT access token
 *         headers:
 *           Set-Cookie:
 *             description: Refresh token cookie
 *             schema:
 *               type: string
 *               example: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict
 *       400:
 *         description: Bad request - missing credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized - invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const login = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "All fields are required");
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(400, "Invalid credentials");
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      throw new ApiError(401, "invalid password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user: loggedInUser, accessToken },
          "User logged in successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Internal Server Error", error);
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *         headers:
 *           Set-Cookie:
 *             description: Clear refresh token cookie
 *             schema:
 *               type: string
 *               example: refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const logout = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - No user context" });
  }

  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },  // or $set: { refreshToken: null }
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200, {}, "User logged out"));
});


/**
 * @swagger
 * /api/auth/onboarding:
 *   post:
 *     summary: Complete user onboarding
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OnboardingRequest'
 *     responses:
 *       200:
 *         description: User onboarding completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const onboarding = asyncHandler(async (req, res) => {
  try {
    const { fullName, bio, nativeLanguage, learningLanguage, location } = req.body;
    const userId = req.user._id.toString();

    if (!fullName || !bio || !nativeLanguage || !learningLanguage || !location) {
      throw new ApiError(400, "All fields are required");
    }

    const updateFields = {
      fullName,
      bio,
      nativeLanguage,
      learningLanguage,
      location,
      isOnboarded: true
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      throw new ApiError(404, "User not found");
    }

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || ""
      });
      console.log(`stream user created for ${fullName}`);
    } catch (error) {
      console.error("Error upserting stream user:", error);
      throw new ApiError(500, "Error upserting stream user");
    }

    console.log("Updated User:", updatedUser);


    return res
      .status(200)
      .json(new ApiResponse(200, { user: updatedUser }, "User onboarded successfully"));
  } catch (error) {
    console.error("Error onboarding user:", error);
    throw new ApiError(500, "Error onboarding user");
  }
});
