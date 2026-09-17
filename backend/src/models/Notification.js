import mongoose from "mongoose";
import { NOTIFICATION_TYPES } from "../config/constants.js";

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      default: "system",
      index: true
    },
    link: {
      type: String,
      default: ""
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    },
    entityId: {
      type: String,
      default: null,
      index: true
    },
    entityType: {
      type: String,
      default: null,
      index: true
    },
    businessKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const Notification = mongoose.model("Notification", notificationSchema);
