import mongoose from "mongoose";
import { CONTRACT_STATUSES, SERVICE_FREQUENCIES, PAYMENT_FREQUENCIES } from "../config/constants.js";

const contractSchema = new mongoose.Schema(
  {
    contractNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true
    },
    customerName: {
      type: String,
      default: ""
    },
    planName: {
      type: String,
      required: [true, "Plan name is required"]
    },
    serviceType: {
      type: String,
      required: [true, "Service type is required"]
    },
    propertyType: {
      type: String,
      default: "Villa"
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"]
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"]
    },
    serviceFrequency: {
      type: String,
      enum: SERVICE_FREQUENCIES,
      default: "monthly"
    },
    paymentFrequency: {
      type: String,
      enum: PAYMENT_FREQUENCIES,
      default: "quarterly"
    },
    totalVisits: {
      type: Number,
      required: true,
      default: 12
    },
    completedVisits: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: CONTRACT_STATUSES,
      default: "ACTIVE",
      index: true
    },
    notes: {
      type: String,
      default: ""
    },
    historicalVersion: {
      type: Number,
      default: 1
    },
    previousContractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      default: null
    },
    renewalReminderSentAt: {
      type: Date,
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false,
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

contractSchema.index({ contractNumber: "text", customerName: "text", planName: "text" });

export const Contract = mongoose.model("Contract", contractSchema);
