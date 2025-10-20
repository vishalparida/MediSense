import { User } from "../models/User.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listDoctors = asyncHandler(async (_req, res) => {
  const doctors = await User.find({ role: "doctor" }).select(
    "name specialty experience location avatar"
  );
  res.json(new ApiResponse({ doctors }));
});
