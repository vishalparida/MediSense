import pino from "pino";
import { config } from "../config/env.js";

export const logger = pino({
  level: config.isDev ? "debug" : "info",
  transport: config.isDev
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined,
});
