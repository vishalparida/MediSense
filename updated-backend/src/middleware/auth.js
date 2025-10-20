import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

export const authenticate = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer "))
      throw new ApiError(401, "Authentication required");
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError(401, "User not found");
    req.user = user;
    next();
  } catch (err) {
    next(new ApiError(401, "Invalid or expired token"));
  }
};

export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "Forbidden"));
    }
    next();
  };
