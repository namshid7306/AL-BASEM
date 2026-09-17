import { env } from "../config/env.js";

const sanitizeData = (data) => {
  if (!data || typeof data !== "object") return data;
  const clone = Array.isArray(data) ? [...data] : { ...data };
  const sensitiveKeys = [
    "password",
    "passwordhash",
    "token",
    "jwt",
    "secret",
    "authorization",
    "refreshtoken",
    "refreshtokensecret",
    "refreshtokenhash",
    "cookie",
    "cookies",
    "set-cookie",
    "al_basem_refresh_token"
  ];
  for (const key of Object.keys(clone)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      clone[key] = "[REDACTED]";
    } else if (typeof clone[key] === "object") {
      clone[key] = sanitizeData(clone[key]);
    }
  }
  return clone;
};

export const logger = {
  info: (msg, meta = null) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${msg}`, meta ? sanitizeData(meta) : "");
  },
  warn: (msg, meta = null) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${msg}`, meta ? sanitizeData(meta) : "");
  },
  error: (msg, err = null) => {
    if (err instanceof Error) {
      console.error(`[ERROR] [${new Date().toISOString()}] ${msg}: ${err.message}`);
      if (env.NODE_ENV !== "production") {
        console.error(err.stack);
      }
    } else {
      console.error(`[ERROR] [${new Date().toISOString()}] ${msg}`, err ? sanitizeData(err) : "");
    }
  },
  debug: (msg, meta = null) => {
    if (env.NODE_ENV !== "production") {
      console.log(`[DEBUG] [${new Date().toISOString()}] ${msg}`, meta ? sanitizeData(meta) : "");
    }
  }
};
