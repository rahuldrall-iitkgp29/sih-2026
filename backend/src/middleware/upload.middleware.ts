import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UPLOAD_PATH, MAX_FILE_SIZE_BYTES, SUPPORTED_EXTENSIONS } from '../config/env';
import { ensureUploadDir } from '../utils/file.utils';

// Ensure upload directory exists
ensureUploadDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_PATH);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (SUPPORTED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file format: ${ext}. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 2, // Maximum 2 images (for bi-temporal or optical+SAR)
  },
});
