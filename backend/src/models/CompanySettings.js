import mongoose from "mongoose";

const companySettingsSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: "AL BASEM PUBLIC HEALTH PESTS CONTROL SERVICES L.L.C"
    },
    location: {
      type: String,
      default: "Dubai"
    },
    country: {
      type: String,
      default: "United Arab Emirates"
    },
    phone: {
      type: String,
      default: "0566337123"
    },
    email: {
      type: String,
      default: "albasemofficial@gmail.com"
    },
    website: {
      type: String,
      default: "www.albasemservices.com"
    },
    trn: {
      type: String,
      default: "105363200400003"
    },
    logoUrl: {
      type: String,
      default: "/al-basem-logo.png"
    },
    vatRate: {
      type: Number,
      default: 0.05
    },
    invoicePrefix: {
      type: String,
      default: "INV-"
    },
    nextInvoiceNum: {
      type: Number,
      default: 1050
    },
    quotePrefix: {
      type: String,
      default: "QT-"
    },
    nextQuoteNum: {
      type: Number,
      default: 205
    },
    paymentTerms: {
      type: String,
      default: "Due on Receipt"
    },
    defaultNotes: {
      type: String,
      default: "Thanks for your business."
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

export const CompanySettings = mongoose.model("CompanySettings", companySettingsSchema);
