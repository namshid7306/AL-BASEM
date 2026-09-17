import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true
    },
    tokenHash: {
      type: String,
      required: [true, "Token hash is required"]
    },
    tokenId: {
      type: String,
      required: [true, "Token ID is required"],
      unique: true,
      index: true
    },
    familyId: {
      type: String,
      required: [true, "Family ID is required"],
      index: true
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required"]
    },
    revokedAt: {
      type: Date,
      default: null
    },
    replacedByTokenId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// TTL index to automatically purge expired records from MongoDB
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
