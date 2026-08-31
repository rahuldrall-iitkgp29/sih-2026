import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response.utils';

/**
 * Global error handling middleware.
 * Catches all unhandled errors and returns sanitized responses.
 */
export function errorMiddleware(err: any, req: Request, res: Response, _next: NextFunction): void {
  // Log full error internally
  logger.error({
    err,
    method: req.method,
    url: req.url,
    body: req.body,
  }, 'Unhandled error');

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    sendError(res, 'File too large. Maximum size is 50MB.', 413);
    return;
  }

  // Multer unexpected field
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    sendError(res, 'Unexpected file field.', 400);
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    sendError(res, 'Invalid data provided.', 400);
    return;
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    sendError(res, 'Invalid request data.', 400);
    return;
  }

  // Default: sanitized internal error
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500
    ? 'An internal server error occurred. Please try again.'
    : err.message || 'An error occurred.';

  sendError(res, message, statusCode);
}
