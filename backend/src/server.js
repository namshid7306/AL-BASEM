import dotenv from "dotenv";
dotenv.config();

import { env } from "./config/env.js";
import connectDB from "./config/db.js";
import { authService } from "./services/authService.js";
import { initBackgroundJobs } from "./jobs/index.js";
import app from "./app.js";
import { logger } from "./utils/logger.js";

const startServer = async () => {
  try {
    await connectDB();
    await authService.syncDefaultAdmin();
    initBackgroundJobs();

    const Port = env.PORT || process.env.PORT || 5000;

    app.listen(Port, () => {
      logger.info(`Server is Running on Port ${Port}`);
    });
  } catch (error) {
    logger.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();