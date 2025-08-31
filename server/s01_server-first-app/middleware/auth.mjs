// Simple authorization middleware
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];
  
  // Allow requests with valid API key or from localhost
  if (apiKey === process.env.API_KEY || 
      req.ip === '127.0.0.1' || 
      req.ip === '::1' || 
      req.connection.remoteAddress === '127.0.0.1') {
    return next();
  }
  
  return res.status(401).json({ error: 'Unauthorized' });
}

export function requireAdminAuth(req, res, next) {
  const adminKey = req.headers['x-admin-key'];
  
  if (adminKey === process.env.ADMIN_KEY) {
    return next();
  }
  
  return res.status(403).json({ error: 'Admin access required' });
}