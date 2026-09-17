import crypto from "crypto";
import { IdempotencyKey } from "../models/IdempotencyKey.js";
import { logger } from "../utils/logger.js";

export const handleIdempotency = async (req, res, next) => {
  const idempotencyKey = req.headers["idempotency-key"] || req.headers["x-idempotency-key"];

  if (!idempotencyKey) {
    return next();
  }

  const keyString = String(idempotencyKey).trim();
  const requestPath = req.originalUrl || req.path;
  const requestHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(req.body || {}))
    .digest("hex");

  try {
    const existing = await IdempotencyKey.findOne({ key: keyString });

    if (existing) {
      if (existing.requestHash !== requestHash) {
        return res.status(422).json({
          success: false,
          message: "Idempotency key reused with different request payload"
        });
      }

      if (existing.status === "PROCESSING") {
        return res.status(409).json({
          success: false,
          message: "Concurrent request with the same idempotency key is already in progress"
        });
      }

      if (existing.status === "COMPLETED") {
        return res.status(existing.responseCode || 200).json(existing.responseBody);
      }
    }

    // Insert placeholder key with PROCESSING status
    await IdempotencyKey.create({
      key: keyString,
      requestPath,
      requestHash,
      status: "PROCESSING"
    });

    // Intercept res.json to capture response and update key to COMPLETED
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const statusCode = res.statusCode;
      const serialized =
        body && typeof body.toJSON === "function"
          ? body.toJSON()
          : JSON.parse(JSON.stringify(body || {}));

      IdempotencyKey.findOneAndUpdate(
        { key: keyString },
        {
          status: statusCode >= 400 ? "FAILED" : "COMPLETED",
          responseCode: statusCode,
          responseBody: serialized
        }
      )
        .then(() => originalJson(body))
        .catch((err) => {
          logger.error("Failed to update idempotency record", err);
          originalJson(body);
        });

      return res;
    };

    req.idempotencyKey = keyString;
    next();
  } catch (err) {
    if (err.code === 11000) {
      // Race condition duplicate key
      return res.status(409).json({
        success: false,
        message: "Concurrent request conflict"
      });
    }
    logger.error("Idempotency middleware error", err);
    next();
  }
};
