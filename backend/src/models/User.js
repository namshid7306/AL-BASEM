import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { USER_ROLES_ARRAY, ROLES } from "../config/constants.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"]
    },
    role: {
      type: String,
      enum: USER_ROLES_ARRAY,
      default: ROLES.ADMIN
    },
    phone: {
      type: String,
      default: ""
    },
    avatar: {
      type: String,
      default: "AB"
    },
    isActive: {
      type: Boolean,
      default: true
    },
    credentialsVersion: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      }
    }
  }
);

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.model("User", userSchema);
