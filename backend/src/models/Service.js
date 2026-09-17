import mongoose from "mongoose";
import { SERVICE_STATUSES } from "../config/constants.js";

const serviceSchema = new mongoose.Schema(
  {
    serviceNumber: {
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
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      default: null,
      index: true
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
      index: true
    },
    // Snapshot fields
    customerName: {
      type: String,
      default: ""
    },
    customerPhone: {
      type: String,
      default: ""
    },
    propertyAddress: {
      type: String,
      required: [true, "Property address is required"]
    },
    serviceType: {
      type: String,
      required: [true, "Service type is required"]
    },
    propertyType: {
      type: String,
      default: "1 BHK"
    },
    quantity: {
      type: Number,
      default: 1
    },
    rate: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    subtotal: {
      type: Number,
      default: 0
    },
    vatRate: {
      type: Number,
      default: 0.05
    },
    vatAmount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    balanceAmount: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PARTIAL", "PAID"],
      default: "UNPAID"
    },
    paymentMethod: {
      type: String,
      default: "Cash"
    },
    scheduledDate: {
      type: Date,
      required: [true, "Scheduled date is required"],
      index: true
    },
    status: {
      type: String,
      enum: SERVICE_STATUSES,
      default: "UPCOMING",
      index: true
    },
    technicianNotes: {
      type: String,
      default: ""
    },
    reminderSentAt: {
      type: Date,
      default: null,
      index: true
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

serviceSchema.index({ scheduledDate: 1, status: 1 });
serviceSchema.index({ serviceNumber: "text", customerName: "text", serviceType: "text", propertyAddress: "text" });

export const Service = mongoose.model("Service", serviceSchema);
