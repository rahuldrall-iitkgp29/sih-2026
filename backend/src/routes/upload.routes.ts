import { Router } from 'express';
import { upload } from '../middleware/upload.middleware';
import { UploadController } from '../controllers/upload.controller';

const router = Router();

// Upload images (1 or 2)
router.post('/', upload.array('images', 2), UploadController.uploadImages);

// Get image metadata by ID
router.get('/:id', UploadController.getImage);

// List all uploaded images
router.get('/', UploadController.listImages);

export default router;
