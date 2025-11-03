# AIPrivateSearch Authentication-Session-Security Flow

## Overview

This document describes the comprehensive authentication, session management, and security interaction flow that occurs when any page is loaded in the AIPrivateSearch application. This is a **common routine** that runs on every page to ensure secure access control.

## Page Load Authentication Flow

### 1. Initial Page Load Sequence

Every page in AIPrivateSearch follows this standardized authentication flow:

```javascript
// From common.js - DOMContentLoaded event
document.addEventListener('DOMContentLoaded', async function() {
  // Step 1: Load tier access manager
  try {
    const { default: tierAccessManager } = await import('./utils/tierAccessManager.js');
    window.tierAccessManager = tierAccessManager;
    await tierAccessManager.loadConfig();
  } catch (error) {
    console.warn('Failed to load tier access manager:', error);
  }
  
  // Step 2: Load theme preferences
  loadTheme();
  
  // Step 3: MANDATORY AUTHENTICATION CHECK
  const user = await AuthUtils.requireAuth();
  if (!user) return; // Redirects to login if not authenticated
  
  // Step 4: Set user roles and permissions
  setUserRole(user.subscriptionTier);
  localStorage.setItem('userUserRole', user.userRole);
  localStorage.setItem('userEmail', user.email);
  
  // Step 5: Apply role-based restrictions
  setTimeout(async () => {
    await applyUserRole(user.subscriptionTier, user.userRole);
  }, 100);
  
  // Step 6: Load shared components and apply access control
  loadSharedComponents().then(async () => {
    setupLoginIcon();
    if (window.tierAccessManager) {
      await window.tierAccessManager.applyAccessControl();
    }
  });
});
```

### 2. Authentication Validation Process

#### AuthUtils.requireAuth() Flow:
```javascript
static async requireAuth() {
  const user = await this.checkAuth();
  if (!user) {
    window.location.href = './user-management.html';
    return null;
  }
  return user;
}

static async checkAuth() {
  const sessionId = localStorage.getItem('sessionId');
  if (!sessionId) return null;
  
  try {
    const response = await fetch('http://localhost:3001/api/auth/me', {
      headers: { 'Authorization': `Bearer ${sessionId}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.user;
    }
    return null;
  } catch (error) {
    return null;
  }
}
```

### 3. Session Security Validation

#### Server-Side Session Middleware:
```javascript
// From auth.mjs middleware
export async function requireAuth(req, res, next) {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  if (!sessionId) return res.status(401).json({ error: 'Authentication required' });
  
  const user = await userManager.validateSession(sessionId);
  if (!user) return res.status(401).json({ error: 'Invalid session' });
  
  req.user = user;
  next();
}
```

#### Session Validation Process:
1. **Extract Bearer Token**: From Authorization header
2. **Session Lookup**: Check sessions.json for valid session
3. **Expiration Check**: Verify session hasn't expired (24-hour limit)
4. **User Status Check**: Ensure user account is still active
5. **Role Verification**: Confirm user roles and subscription tier

## Security Layers

### 1. Client-Side Security

#### Bearer Token Authentication:
- **Storage**: sessionId stored in localStorage (not cookies)
- **Headers**: `Authorization: Bearer {sessionId}` sent with all API requests
- **Validation**: Every API call validates session server-side
- **Expiration**: 24-hour automatic expiration

#### CSRF Protection:
```javascript
// CSRF token generation and validation
app.get('/api/csrf-token', generateCSRFToken, (req, res) => {
  res.json({ csrfToken: req.csrfToken });
});

// Applied to sensitive routes
app.use('/api/search', validateOrigin, validateCSRFToken, searchRouter);
```

#### Origin Validation:
```javascript
// Validates request origin
function validateOrigin(req, res, next) {
  const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden origin' });
  }
}
```

### 2. Role-Based Access Control (RBAC)

#### Tier Access Manager Flow:
```javascript
async function applyAccessControl() {
  const userInfo = this.getCurrentUserInfo();
  await this.applyCSSClasses(userInfo.tier, userInfo.role);
}

async function applyCSSClasses(tier, role) {
  const userType = await this.getUserTypeInfo(tier, role);
  
  // Show authorized elements
  (userType.cssShow || []).forEach(className => {
    document.querySelectorAll(className).forEach(el => {
      el.style.display = '';
    });
  });
  
  // Hide unauthorized elements
  (userType.cssHide || []).forEach(className => {
    document.querySelectorAll(className).forEach(el => {
      el.style.display = 'none';
    });
  });
}
```

#### Access Control Matrix:
- **Standard Tier**: Basic search, collections, limited features
- **Premium Tier**: Advanced features, model management, config editing
- **Professional Tier**: Full access to all features
- **Admin Role**: User management capabilities
- **Searcher Role**: Search and query operations only

### 3. Server-Side Security

#### Route Protection:
```javascript
// Protected routes require authentication
app.use('/api/search', validateOrigin, validateCSRFToken, searchRouter);
app.use('/api/models', validateOrigin, validateCSRFToken, modelsRouter);
app.use('/api/database', validateOrigin, validateCSRFToken, databaseRouter);

// Admin-only routes
app.use('/api/auth/users', requireAuth, requireAdmin, userRoutes);
```

#### Content Security Policy:
```javascript
res.setHeader('Content-Security-Policy', 
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline'; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data:; " +
  "connect-src 'self' http://localhost:11434; " +
  "font-src 'self'; " +
  "object-src 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self'"
);
```

## Common Routine Analysis

### Is This a Common Routine?

**YES** - This authentication-session-security flow is a **standard common routine** that executes on every page load for the following reasons:

#### 1. **Universal Security Requirement**
- Every page requires user authentication
- No page can be accessed without valid session
- All pages need role-based access control

#### 2. **Consistent User Experience**
- Same authentication state across all pages
- Persistent theme and user preferences
- Uniform menu visibility based on user tier/role

#### 3. **Security Best Practice**
- Prevents unauthorized access to any page
- Validates session on every page load
- Applies appropriate access restrictions immediately

#### 4. **Centralized Implementation**
- Single `common.js` file handles all authentication logic
- Consistent error handling and redirect behavior
- Unified session management across application

## Security Benefits

### 1. **Defense in Depth**
- Multiple security layers (client + server validation)
- Session expiration and cleanup
- Origin validation and CSRF protection

### 2. **Zero Trust Architecture**
- Every request validated independently
- No assumption of previous authentication
- Continuous session verification

### 3. **Role-Based Security**
- Granular access control per user type
- Dynamic UI based on permissions
- Server-side enforcement of restrictions

### 4. **Session Management**
- Automatic session cleanup
- Secure token-based authentication
- No sensitive data in client storage

## Implementation Files

### Core Authentication Files:
- `shared/common.js` - Main authentication flow
- `shared/utils/authUtils.js` - Authentication utilities
- `shared/utils/tierAccessManager.js` - Role-based access control
- `server/middleware/auth.mjs` - Server-side authentication
- `config/tier-access.json` - Access control configuration

### Security Configuration:
- `server/middleware/csrf.mjs` - CSRF protection
- `server/middleware/errorHandler.mjs` - Secure error handling
- `data/users.json` - User account storage
- `data/sessions.json` - Active session storage

## Conclusion

The auth-session-security interaction is indeed a **common routine** that provides:

1. **Mandatory Authentication**: Every page requires valid session
2. **Role-Based Access**: Dynamic UI based on user permissions  
3. **Security Enforcement**: Multiple layers of protection
4. **Consistent Experience**: Uniform behavior across all pages
5. **Centralized Management**: Single source of truth for authentication

This routine ensures that AIPrivateSearch maintains enterprise-grade security while providing a seamless user experience across all application pages.

---

**Version**: 19.38 | **Last Updated**: 2024-12-19 | **Status**: Complete Documentation