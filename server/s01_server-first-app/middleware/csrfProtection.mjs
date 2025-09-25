import crypto from 'crypto';

// Simple CSRF token store (use Redis in production)
const tokenStore = new Map();

export function generateCSRFToken(sessionId) {
    const token = crypto.randomBytes(32).toString('hex');
    tokenStore.set(sessionId, token);
    return token;
}

export function validateCSRFToken(sessionId, token) {
    const storedToken = tokenStore.get(sessionId);
    return storedToken && storedToken === token;
}

export function csrfProtection(req, res, next) {
    // Skip CSRF for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    
    const sessionId = req.headers['x-session-id'] || req.ip;
    const token = req.headers['x-csrf-token'] || req.body._csrf;
    
    if (!validateCSRFToken(sessionId, token)) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    
    next();
}

export function csrfTokenEndpoint(req, res) {
    const sessionId = req.headers['x-session-id'] || req.ip;
    const token = generateCSRFToken(sessionId);
    res.json({ csrfToken: token });
}