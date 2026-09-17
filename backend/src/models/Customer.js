import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      index: true
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      index: true
    },
    email: {
      type: String,
      trim: true,
      default: ""
    },
    company: {
      type: String,
      trim: true,
      default: ""
    },
    trn: {
      type: String,
      trim: true,
      default: "",
      index: true
    },
    customerType: {
      type: String,
      default: "Villa",
      trim: true
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true
    },
    // Derived / Cached Financial & Operational Fields (Not authoritative)
    totalRevenue: {
      type: Number,
      default: 0
    },
    outstandingBalance: {
      type: Number,
      default: 0
    },
    paidTotal: {
      type: Number,
      default: 0
    },
    servicesCount: {
      type: Number,
      default: 0
    },
    lastServiceDate: {
      type: Date,
      default: null
    },
    nextServiceDate: {
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

customerSchema.index({ name: "text", company: "text", phone: "text", trn: "text" });

export const Customer = mongoose.model("Customer", customerSchema);
