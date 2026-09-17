import mongoose from "mongoose";
import { EXPENSE_CATEGORIES } from "../config/constants.js";

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      required: [true, "Category is required"],
      index: true
    },
    categoryName: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"]
    },
    date: {
      type: Date,
      required: [true, "Expense date is required"],
      index: true
    },
    paymentMethod: {
      type: String,
      default: "Cash"
    },
    receiptUrl: {
      type: String,
      default: ""
    },
    notes: {
      type: String,
      default: ""
    },
    // VAT & Tax Compliance Fields (Strict UAE FTA Rules)
    isVatApplicable: {
      type: Boolean,
      default: false
    },
    vatRate: {
      type: Number,
      default: 0.00
    },
    vatAmount: {
      type: Number,
      default: 0.00
    },
    isVatRecoverable: {
      type: Boolean,
      default: false,
      index: true
    },
    supplierName: {
      type: String,
      default: ""
    },
    supplierTrn: {
      type: String,
      default: ""
    },
    taxInvoiceRef: {
      type: String,
      default: ""
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

expenseSchema.index({ description: "text", categoryName: "text", notes: "text" });

export const Expense = mongoose.model("Expense", expenseSchema);
