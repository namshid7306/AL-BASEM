import path from "path";
import fs from "fs";
import { UploadedFile } from "../models/UploadedFile.js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";

export const uploadController = {
  uploadFile: async (req, res, next) => {
    try {
      if (!req.savedFile) {
        throw new AppError("No valid file provided or file inspection failed", 400);
      }

      const uploadedDoc = new UploadedFile({
        originalFilename: req.savedFile.originalFilename,
        storedFilename: req.savedFile.storedFilename,
        mimeType: req.savedFile.mimeType,
        size: req.savedFile.size,
        path: req.savedFile.path,
        uploadedBy: req.user?._id || null,
        isPublic: false
      });

      await uploadedDoc.save();

      res.status(201).json({
        success: true,
        url: req.savedFile.url,
        file: {
          id: uploadedDoc._id.toString(),
          originalName: uploadedDoc.originalFilename,
          mimeType: uploadedDoc.mimeType,
          size: uploadedDoc.size,
          url: req.savedFile.url
        }
      });
    } catch (err) {
      next(err);
    }
  },

  getFile: async (req, res, next) => {
    try {
      const filename = path.basename(req.params.fileId);
      const filePath = path.resolve(process.cwd(), env.UPLOAD_DIR, filename);

      if (!fs.existsSync(filePath)) {
        throw new AppError("File not found", 404);
      }

      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  }
};
