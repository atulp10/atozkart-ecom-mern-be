import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
}

export function errorHandler(error, req, res, _next) {
  let err = error;
  if (err instanceof mongoose.Error.ValidationError) {
    err = new AppError('Validation failed', 400, 'VALIDATION_ERROR', err.errors);
  } else if (err instanceof mongoose.Error.CastError) {
    err = new AppError('Resource not found', 404, 'NOT_FOUND');
  } else if (err?.code === 11000) {
    err = new AppError('A record with that value already exists', 409, 'DUPLICATE_VALUE', err.keyValue);
  } else if (err?.name === 'UserExistsError') {
    err = new AppError('An account with that email already exists', 409, 'ACCOUNT_EXISTS');
  } else if (err?.name === 'MulterError') {
    err = new AppError('Image upload is invalid or exceeds the 2 MB limit', 400, 'INVALID_IMAGE_UPLOAD');
  }

  const statusCode = err.statusCode || 500;
  logger.error(err.message || 'Unhandled error', { statusCode, code: err.code, method: req.method, path: req.originalUrl });
  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: statusCode >= 500 ? 'Internal server error' : err.message,
      ...(err.details && statusCode < 500 ? { details: err.details } : {}),
    },
  });
}
