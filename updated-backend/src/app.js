import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.js";
import { config } from "./config/env.js";
import { notFound, errorHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || config.cors.includes(origin)) return cb(null, true);
        cb(new Error("CORS not allowed"));
      },
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
