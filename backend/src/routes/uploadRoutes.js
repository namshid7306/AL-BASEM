import { Router } from "express";
import { uploadController } from "../controllers/uploadController.js";
import { authenticateToken } from "../middleware/auth.js";
import { uploadMiddleware, validateMagicBytesAndSave } from "../middleware/upload.js";

const router = Router();

router.post(
  "/upload",
  authenticateToken,
  uploadMiddleware.single("file"),
  validateMagicBytesAndSave,
  uploadController.uploadFile
);

router.get("/uploads/:fileId", authenticateToken, uploadController.getFile);

export default router;
