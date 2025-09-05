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
      user._id
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

export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200, {}, "user logged out"));
});
