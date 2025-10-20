import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  const status = err.statusCode || 500;
  if (status >= 500) logger.error({ err }, "Server Error");
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
    details: err.details,
  });
};
