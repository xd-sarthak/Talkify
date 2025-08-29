import { asyncHandler } from "../asyncHandler.js";
import { ApiError } from "../APIerror.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

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

  const newUser = await User.create({
    fullName,
    email,
    password,
    avatar: randomAvatar,
  });

  const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });

  res.cookie("token", token, {
    httpOnly: true, //prevents client-side scripts from accessing the cookie xxs
    secure: process.env.NODE_ENV === "production", //only send cookie over https in production
    sameSite: "strict", //prevents CSRF attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiration time
  });

  res
    .status(201)
    .json(new ApiResponse(201, newUser, "User created successfully"));
});

export const login = asyncHandler(async (req, res) => {
  res.send("login controller");
});

export const logout = asyncHandler(async (req, res) => {
  res.send("logout controller");
});
