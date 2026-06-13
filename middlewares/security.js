import rateLimit from 'express-rate-limit';
import AppError from '../utils/AppError.js';
import { getConfig } from '../config/env.js';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

export function requireTrustedOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  const { allowedOrigins } = getConfig();
  if (!origin || !allowedOrigins.includes(origin)) {
    return next(new AppError('Request origin is not allowed', 403, 'CSRF_CHECK_FAILED'));
  }
  return next();
}
