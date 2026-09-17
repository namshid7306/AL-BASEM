import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true
    },
    invoiceNumber: {
      type: String,
      required: true
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
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Payment amount must be greater than 0"]
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    paymentMethod: {
      type: String,
      required: true,
      default: "Cash"
    },
    referenceNumber: {
      type: String,
      default: "",
      index: true
    },
    status: {
      type: String,
      enum: ["COMPLETED", "VOIDED"],
      default: "COMPLETED",
      index: true
    },
    notes: {
      type: String,
      default: "Payment recorded"
    },
    idempotencyKey: {
      type: String,
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

paymentSchema.index({ paymentNumber: "text", invoiceNumber: "text", customerName: "text", referenceNumber: "text" });

export const Payment = mongoose.model("Payment", paymentSchema);
