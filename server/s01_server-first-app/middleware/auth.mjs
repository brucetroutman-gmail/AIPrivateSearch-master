import { safeError } from '../lib/utils/safeLogger.mjs';

// Authorization middleware
export function requireAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  // Check for valid API key
  if (process.env.API_KEY && apiKey === process.env.API_KEY) {
    return next();
  }
  
  // Allow localhost in development only
  if (process.env.NODE_ENV === 'development') {
    const clientIP = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
    if (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1') {
      return next();
    }
  }
  
  safeError('Unauthorized access attempt from IP:', req.ip);
  return res.status(401).json({ error: 'Unauthorized' });
}

export function requireAdminAuth(req, res, next) {
  const adminKey = req.headers['x-admin-key'];
  
  if (process.env.ADMIN_KEY && adminKey === process.env.ADMIN_KEY) {
    return next();
  }
  
  safeError('Admin access denied for IP:', req.ip);
  return res.status(403).json({ error: 'Admin access required' });
}