import mongoose from "mongoose";

const idempotencyKeySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    requestPath: {
      type: String,
      required: true
    },
    requestHash: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["PROCESSING", "COMPLETED", "FAILED"],
      default: "PROCESSING"
    },
    responseCode: {
      type: Number,
      default: null
    },
    responseBody: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      expires: 0 // MongoDB TTL index
    }
  },
  {
    timestamps: true
  }
);

export const IdempotencyKey = mongoose.model("IdempotencyKey", idempotencyKeySchema);
