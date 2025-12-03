/**
 * Secure User Manager
 * Handles user data securely - no sensitive info in localStorage
 */

class SecureUserManager {
  constructor() {
    this.currentUser = null;
    this.sessionId = null;
    this.cacheExpiry = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get session ID from httpOnly cookie or header
  getSessionId() {
    // Try to get from Authorization header first (current method)
    const authHeader = document.querySelector('meta[name="session-id"]');
    if (authHeader) {
      return authHeader.content;
    }
    
    // Fallback to localStorage for backward compatibility (will be removed)
    return localStorage.getItem('sessionId');
  }

  // Validate session and get user info from server
  async getCurrentUser() {
    // Return cached user if still valid
    if (this.currentUser && this.cacheExpiry && Date.now() < this.cacheExpiry) {
      return this.currentUser;
    }

    const sessionId = this.getSessionId();
    if (!sessionId) {
      return null;
    }

    try {
      const response = await fetch(`${window.API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      });

      if (!response.ok) {
        throw new Error('Session invalid');
      }

      const data = await response.json();
      this.currentUser = data.user;
      this.sessionId = sessionId;
      this.cacheExpiry = Date.now() + this.cacheTimeout;
      
      // Update app_token with non-sensitive display info only
      if (window.AppToken && this.currentUser) {
        window.AppToken.setSection('session', {
          isLoggedIn: true,
          displayName: this.currentUser.email?.split('@')[0] || 'User'
        });
      }
      
      return this.currentUser;
    } catch (error) {
      console.error('Failed to get current user:', error);
      this.clearSession();
      return null;
    }
  }

  // Get user email (server-side only)
  async getUserEmail() {
    const user = await this.getCurrentUser();
    return user?.email || null;
  }

  // Get user role (server-side only)
  async getUserRole() {
    const user = await this.getCurrentUser();
    return user?.subscriptionTier || 'standard';
  }

  // Get user type (admin/searcher) (server-side only)
  async getUserUserRole() {
    const user = await this.getCurrentUser();
    return user?.userRole || 'searcher';
  }

  // Check if user is logged in
  async isLoggedIn() {
    const user = await this.getCurrentUser();
    return !!user;
  }

  // Clear session data
  clearSession() {
    this.currentUser = null;
    this.sessionId = null;
    this.cacheExpiry = null;
    
    // Clear localStorage session data
    localStorage.removeItem('sessionId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userUserRole');
    
    // Update app_token
    if (window.AppToken) {
      window.AppToken.setSection('session', {
        isLoggedIn: false,
        displayName: null
      });
    }
  }

  // Set session (called after successful login)
  setSession(sessionId, user) {
    this.sessionId = sessionId;
    this.currentUser = user;
    this.cacheExpiry = Date.now() + this.cacheTimeout;
    
    // Store session ID (will move to httpOnly cookie later)
    localStorage.setItem('sessionId', sessionId);
    
    // Update app_token with non-sensitive display info
    if (window.AppToken) {
      window.AppToken.setSection('session', {
        isLoggedIn: true,
        displayName: user.email?.split('@')[0] || 'User'
      });
    }
  }

  // Fast cached methods (no API call if cached)
  getUserEmailCached() {
    return this.currentUser?.email || null;
  }

  getUserRoleCached() {
    return this.currentUser?.subscriptionTier || 'standard';
  }

  getUserUserRoleCached() {
    return this.currentUser?.userRole || 'searcher';
  }

  isLoggedInCached() {
    return !!this.currentUser && this.cacheExpiry && Date.now() < this.cacheExpiry;
  }

  // Logout
  async logout() {
    const sessionId = this.getSessionId();
    
    if (sessionId) {
      try {
        await fetch(`${window.API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionId}`
          }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    this.clearSession();
    window.location.href = './user-management.html';
  }
}

// Create global instance
window.SecureUser = new SecureUserManager();

export default window.SecureUser;