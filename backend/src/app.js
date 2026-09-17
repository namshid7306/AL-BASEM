import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

import apiRouter from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { env } from "./config/env.js";

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
const allowedOrigins =
  env.CORS_ORIGIN === "*"
    ? ["*"]
    : env.CORS_ORIGIN.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Idempotency-Key",
      "X-Idempotency-Key",
    ],
  })
);

// Body Parsers & Sanitization
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(mongoSanitize());

// Rate Limiting on /api
app.use("/api", apiLimiter);

// Health Check
app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;

  const dbStatus =
    dbState === 1
      ? "connected"
      : dbState === 2
        ? "connecting"
        : "disconnected";

  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    service: "AL BASEM Backend API",
    database: dbStatus,
  });
});

// Main API Router
app.use("/api", apiRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;