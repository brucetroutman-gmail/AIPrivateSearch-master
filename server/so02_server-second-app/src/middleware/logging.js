import { logger } from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log the incoming request
  logger.info(`${req.method} ${req.url} - ${req.ip}`);
  
  // Override res.end to log response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    originalEnd.apply(res, args);
  };
  
  next();
};

export const errorLogger = (err, req, res, next) => {
  logger.error(`Error in ${req.method} ${req.url}: ${err.message}`);
  logger.error(err.stack);
  next(err);
};
