import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGO_URL: z.string().optional().default(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/al_basem_db"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_SECRET: z.string().min(16, "REFRESH_TOKEN_SECRET must be at least 16 characters"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  UPLOAD_DIR: z.string().default("uploads"),
  TIMEZONE: z.string().default("Asia/Dubai"),
  CONTRACT_REMINDER_DAYS: z.coerce.number().default(30),
  CONTRACT_FINAL_REMINDER_DAYS: z.coerce.number().default(7),
  SERVICE_REMINDER_HOURS: z.coerce.number().default(24),
  PAYMENT_REMINDER_DAYS: z.coerce.number().default(3),
  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL must be a valid email address"),
  ADMIN_PASSWORD: z.string().min(6, "ADMIN_PASSWORD must be at least 6 characters")
}).refine((data) => data.JWT_SECRET !== data.REFRESH_TOKEN_SECRET, {
  message: "JWT_SECRET and REFRESH_TOKEN_SECRET must be different",
  path: ["REFRESH_TOKEN_SECRET"]
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Environment configuration validation failed:");
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
