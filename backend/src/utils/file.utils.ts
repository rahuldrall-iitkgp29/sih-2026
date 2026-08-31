import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { ImageMetadata } from '../types';
import { UPLOAD_PATH, SUPPORTED_EXTENSIONS } from '../config/env';
import { logger } from './logger';

/**
 * Ensure the upload directory exists.
 */
export function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_PATH)) {
    fs.mkdirSync(UPLOAD_PATH, { recursive: true });
    logger.info(`Created upload directory: ${UPLOAD_PATH}`);
  }
}

/**
 * Validate that a file extension is supported.
 */
export function isValidExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * Sanitize a filename to prevent path traversal.
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
}

/**
 * Detect the image format from extension.
 */
export function detectFormat(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const formatMap: Record<string, string> = {
    '.tif': 'GeoTIFF',
    '.tiff': 'GeoTIFF',
    '.geotiff': 'GeoTIFF',
    '.png': 'PNG',
    '.jpg': 'JPEG',
    '.jpeg': 'JPEG',
  };
  return formatMap[ext] || 'Unknown';
}

/**
 * Extract image metadata using sharp.
 * Gracefully returns null for fields that can't be extracted.
 */
export async function extractImageMetadata(
  filePath: string,
  originalName: string
): Promise<ImageMetadata> {
  const id = uuidv4();
  const format = detectFormat(originalName);
  const stats = fs.statSync(filePath);

  let width: number | null = null;
  let height: number | null = null;
  let bands: number | null = null;

  try {
    const metadata = await sharp(filePath).metadata();
    width = metadata.width || null;
    height = metadata.height || null;
    bands = metadata.channels || null;
  } catch (error) {
    logger.warn(`Could not extract metadata for ${originalName}: ${error}`);
  }

  return {
    id,
    filename: path.basename(filePath),
    originalName,
    format,
    mimetype: getMimeType(originalName),
    size: stats.size,
    width,
    height,
    bands,
    crs: null, // Requires rasterio (Python service) for GeoTIFF
    bbox: null,
    sensor: null,
    path: filePath,
    uploadedAt: new Date(),
  };
}

/**
 * Get MIME type from filename.
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.tif': 'image/tiff',
    '.tiff': 'image/tiff',
    '.geotiff': 'image/tiff',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

/**
 * Read image as base64 for sending to AI APIs.
 */
export function imageToBase64(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return buffer.toString('base64');
}

/**
 * Get the MIME type for base64 encoding.
 */
export function getBase64MimeType(filePath: string): string {
  return getMimeType(path.basename(filePath));
}

/**
 * Delete a file safely.
 */
export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    logger.warn(`Failed to delete file ${filePath}: ${error}`);
  }
}
