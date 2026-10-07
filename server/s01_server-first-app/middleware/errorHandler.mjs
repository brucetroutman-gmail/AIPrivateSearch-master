 
 
import { secureLog } from '../../../shared/utils/logger.mjs';
import { ErrorLogger } from '../lib/utils/errorLogger.mjs';

// Common error handler middleware
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const errorHandler = (err, req, res, next) => {
  // secureLog sanitizes all inputs to prevent log injection
  secureLog.error('Route error:', err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Persist to central error log file for later diagnosis
  ErrorLogger.log(err, {
    source: 'route',
    method: req.method,
    url: req.originalUrl,
    statusCode,
    user: req.headers['x-user-email'] || req.body?.userEmail
  });

  res.status(statusCode).json({
    success: false,
    error: message
  });
};
