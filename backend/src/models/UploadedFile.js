import mongoose from "mongoose";

const uploadedFileSchema = new mongoose.Schema(
  {
    originalFilename: {
      type: String,
      required: true
    },
    storedFilename: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    isPublic: {
      type: Boolean,
      default: false
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

export const UploadedFile = mongoose.model("UploadedFile", uploadedFileSchema);
