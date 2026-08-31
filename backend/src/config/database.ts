import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.error(`❌ MongoDB connection failed: ${error}`);
    // Don't crash — allow the app to run without DB for demo purposes
    logger.warn('⚠️  Running without database. History features will be unavailable.');
  }
}

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});
