import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { config } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

export const register = asyncHandler(async (req, res) => {
  const exists = await User.findOne({ email: req.body.email });
  if (exists) throw new ApiError(409, "Email already registered");
  const user = await User.create(req.body);
  const token = signToken(user);
  res.status(201).json(new ApiResponse({ user, token }, "registered"));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password)))
    throw new ApiError(401, "Invalid credentials");
  const token = signToken(user);
  res.json(new ApiResponse({ user, token }, "logged_in"));
});

export const me = asyncHandler(async (req, res) => {
  res.json(new ApiResponse({ user: req.user }));
});
