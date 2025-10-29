import { UserManager } from '../lib/auth/userManager.mjs';

const userManager = new UserManager();

export async function requireAuth(req, res, next) {
  try {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await userManager.validateSession(sessionId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
  }
}

export function requireRole(roles) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has required subscription tier or user role
    const hasAccess = roles.some(role => {
      if (['standard', 'premium', 'professional'].includes(role)) {
        return req.user.subscriptionTier === role;
      }
      if (['admin', 'searcher'].includes(role)) {
        return req.user.userRole === role;
      }
      return false;
    });

    if (!hasAccess) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}