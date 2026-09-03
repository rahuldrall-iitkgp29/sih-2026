import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const envSchema = z.object({
  // Server
  PORT: z.string().default('5000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  MONGODB_URI: z.string().default('mongodb://localhost:27017/satquery'),

  // General AI (agent reasoning + fallback)
  AI_PROVIDER: z.enum(['gemini', 'openai', 'local', 'none']).default('local'),
  AI_API_KEY: z.string().default(''),
  VISION_MODEL: z.string().default(''),
  TEXT_MODEL: z.string().default(''),

  // Python ML Service
  PYTHON_ML_URL: z.string().default('http://localhost:8000'),

  // Task-specific ML Worker URLs (For Multi-Laptop GPU)
  VQA_ML_URL: z.string().optional(),
  CAPTION_ML_URL: z.string().optional(),
  GROUNDING_ML_URL: z.string().optional(),
  CHANGE_ML_URL: z.string().optional(),
  CHANGE_VQA_ML_URL: z.string().optional(),
  OPTICAL_SAR_ML_URL: z.string().optional(),

  // Specialist model configuration
  VQA_MODEL_ID: z.string().default(''),
  VQA_MODEL_PATH: z.string().default(''),
  CAPTION_MODEL_ID: z.string().default(''),
  CAPTION_MODEL_PATH: z.string().default(''),
  GROUNDING_MODEL_ID: z.string().default(''),
  GROUNDING_MODEL_PATH: z.string().default(''),
  CHANGE_MODEL_ID: z.string().default(''),
  CHANGE_MODEL_PATH: z.string().default(''),
  CHANGE_VQA_MODEL_ID: z.string().default(''),
  CHANGE_VQA_MODEL_PATH: z.string().default(''),
  OPTICAL_SAR_MODEL_ID: z.string().default(''),
  OPTICAL_SAR_MODEL_PATH: z.string().default(''),

  // File uploads
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_MB: z.string().default('50').transform(Number),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const UPLOAD_PATH = path.resolve(env.UPLOAD_DIR);
export const MAX_FILE_SIZE_BYTES = env.MAX_FILE_SIZE_MB * 1024 * 1024;

export const SUPPORTED_IMAGE_FORMATS = [
  'image/tiff',
  'image/geotiff',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/octet-stream', // GeoTIFF sometimes detected as this
];

export const SUPPORTED_EXTENSIONS = ['.tif', '.tiff', '.png', '.jpg', '.jpeg', '.geotiff'];

