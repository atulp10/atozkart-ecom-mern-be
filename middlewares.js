import AppError from './utils/AppError.js';

export function isLoggedIn(req, res, next) {
  if (!req.isAuthenticated?.() || !req.user) {
    return next(new AppError('Please log in first', 401, 'AUTHENTICATION_REQUIRED'));
  }
  return next();
}

export function isAuthorized(req, res, next) {
  if (req.user?.role !== 'Admin') {
    return next(new AppError('You are not authorized to perform this action', 403, 'FORBIDDEN'));
  }
  return next();
}
