import { createApp } from "./app.js";
import connectDB from "./config/db.js";
import { config } from "./config/env.js";
import { logger } from "./utils/logger.js";

async function start() {
  await connectDB();
  const app = createApp();
  app.listen(config.port, () => {
    logger.info(`🚀 Server listening on port ${config.port}`);
  });
}

start();
