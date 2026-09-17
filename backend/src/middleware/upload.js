import multer from "multer";
import path from "path";
import fs from "fs";
import { fileTypeFromBuffer } from "file-type";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env.js";

const UPLOADS_PATH = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(UPLOADS_PATH)) {
  fs.mkdirSync(UPLOADS_PATH, { recursive: true });
}

// Memory storage so we can inspect file magic bytes before saving to disk
const storage = multer.memoryStorage();

const ALLOWED_MIMES = ["image/jpeg", "image/png", "application/pdf", "image/webp"];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WEBP, PDF`), false);
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB ceiling
  },
  fileFilter
});

export const validateMagicBytesAndSave = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const buffer = req.file.buffer;
    const detected = await fileTypeFromBuffer(buffer);

    if (!detected || !ALLOWED_MIMES.includes(detected.mime)) {
      return res.status(422).json({
        success: false,
        message: "File content inspection failed: invalid or corrupt file format"
      });
    }

    const ext = detected.ext || path.extname(req.file.originalname).replace(".", "") || "bin";
    const uniqueName = `${uuidv4()}.${ext}`;
    const destinationPath = path.join(UPLOADS_PATH, uniqueName);

    await fs.promises.writeFile(destinationPath, buffer);

    req.savedFile = {
      originalFilename: req.file.originalname,
      storedFilename: uniqueName,
      mimeType: detected.mime,
      size: req.file.size,
      path: destinationPath,
      url: `/api/uploads/${uniqueName}`
    };

    next();
  } catch (err) {
    next(err);
  }
};
