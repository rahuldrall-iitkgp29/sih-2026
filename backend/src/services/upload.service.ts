import { ImageMetadata } from '../types';
import { extractImageMetadata } from '../utils/file.utils';
import { logger } from '../utils/logger';

// In-memory store for uploaded images (also persisted to DB when available)
const imageStore = new Map<string, ImageMetadata>();

export class UploadService {
  /**
   * Process uploaded files and extract metadata.
   */
  static async processUploads(files: Express.Multer.File[]): Promise<ImageMetadata[]> {
    const results: ImageMetadata[] = [];

    for (const file of files) {
      try {
        const metadata = await extractImageMetadata(file.path, file.originalname);
        imageStore.set(metadata.id, metadata);
        results.push(metadata);
        logger.info(`Processed upload: ${metadata.originalName} (${metadata.format}, ${metadata.width}x${metadata.height})`);
      } catch (error) {
        logger.error(`Failed to process upload ${file.originalname}: ${error}`);
        throw new Error(`Failed to process file: ${file.originalname}`);
      }
    }

    return results;
  }

  /**
   * Get image metadata by ID.
   */
  static getImage(id: string): ImageMetadata | undefined {
    return imageStore.get(id);
  }

  /**
   * Get multiple images by IDs.
   */
  static getImages(ids: string[]): ImageMetadata[] {
    const images: ImageMetadata[] = [];
    for (const id of ids) {
      const img = imageStore.get(id);
      if (img) images.push(img);
    }
    return images;
  }

  /**
   * List all uploaded images.
   */
  static listImages(): ImageMetadata[] {
    return Array.from(imageStore.values());
  }
}
