import mongoose from "mongoose";
import { INVOICE_STATUSES } from "../config/constants.js";

const lineItemSchema = new mongoose.Schema(
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

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
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
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      default: null,
      index: true
    },
    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
      default: null,
      index: true
    },
    // Customer Snapshot
    customerName: {
      type: String,
      required: true
    },
    customerPhone: {
      type: String,
      default: ""
    },
    customerTrn: {
      type: String,
      default: ""
    },
    customerAddress: {
      type: String,
      default: ""
    },
    invoiceDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      required: true,
      index: true
    },
    paymentTerms: {
      type: String,
      default: "Due on Receipt"
    },
    lineItems: {
      type: [lineItemSchema],
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
    totalAmount: {
      type: Number,
      required: true,
      default: 0
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    balanceAmount: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: INVOICE_STATUSES,
      default: "UNPAID",
      index: true
    },
    notes: {
      type: String,
      default: "Thanks for your business."
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

invoiceSchema.index({ invoiceNumber: "text", customerName: "text", customerTrn: "text" });
invoiceSchema.index({ customerId: 1, status: 1 });

export const Invoice = mongoose.model("Invoice", invoiceSchema);
