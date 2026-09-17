import mongoose from "mongoose";
import { QUOTATION_STATUSES } from "../config/constants.js";

const quoteLineItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    rate: {
      type: Number,
      required: true,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      required: true,
      default: 0
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    vatRate: {
      type: Number,
      default: 0.05
    },
    taxRate: {
      type: Number,
      default: 5.0
    },
    vatAmount: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const quotationSchema = new mongoose.Schema(
  {
    quoteNumber: {
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
      required: true
    },
    customerEmail: {
      type: String,
      default: ""
    },
    customerPhone: {
      type: String,
      default: ""
    },
    address: {
      type: String,
      default: ""
    },
    subject: {
      type: String,
      default: "Pest Control Services Quotation"
    },
    date: {
      type: Date,
      default: Date.now
    },
    validUntil: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: QUOTATION_STATUSES,
      default: "SENT",
      index: true
    },
    lineItems: {
      type: [quoteLineItemSchema],
      required: true,
      validate: [(val) => val.length > 0, "At least one line item is required"]
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    vatRate: {
      type: Number,
      default: 0.05
    },
    vatAmount: {
      type: Number,
      required: true,
      default: 0
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0
    },
    notes: {
      type: String,
      default: "Thanks for your business."
    },
    convertedInvoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null
    },
    convertedAt: {
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

quotationSchema.index({ quoteNumber: "text", customerName: "text", subject: "text" });

export const Quotation = mongoose.model("Quotation", quotationSchema);
