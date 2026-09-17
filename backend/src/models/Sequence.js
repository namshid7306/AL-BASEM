import mongoose from "mongoose";

const sequenceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    value: {
      type: Number,
      required: true,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

export const Sequence = mongoose.model("Sequence", sequenceSchema);
