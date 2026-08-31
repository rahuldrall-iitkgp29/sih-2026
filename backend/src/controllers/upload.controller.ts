import { Request, Response, NextFunction } from 'express';
import { UploadService } from '../services/upload.service';
import { sendSuccess, sendError } from '../utils/response.utils';

export class UploadController {
  static async uploadImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        sendError(res, 'No files uploaded. Please upload at least one image.', 400);
        return;
      }

      if (files.length > 2) {
        sendError(res, 'Maximum 2 images allowed (for bi-temporal or optical+SAR pair).', 400);
        return;
      }

      const metadata = await UploadService.processUploads(files);

      sendSuccess(res, {
        images: metadata,
        count: metadata.length,
      }, 'Images uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getImage(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const image = UploadService.getImage(id);

    if (!image) {
      sendError(res, 'Image not found', 404);
      return;
    }

    sendSuccess(res, image);
  }

  static async listImages(_req: Request, res: Response): Promise<void> {
    const images = UploadService.listImages();
    sendSuccess(res, { images, count: images.length });
  }
}
