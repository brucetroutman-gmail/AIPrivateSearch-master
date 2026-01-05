/**
 * Common Authentication Utilities
 */

class AuthUtils {
  static async checkAuth() {
    const sessionId = localStorage.getItem('sessionId');
    console.log('🔐 AUTH DEBUG: checkAuth called, sessionId:', sessionId ? 'exists' : 'missing');
    
    if (!sessionId) {
      console.log('🔐 AUTH DEBUG: No sessionId in localStorage');
      return null;
    }
    
    try {
      console.log('🔐 AUTH DEBUG: Validating session with backend...');
      const response = await fetch(`${window.API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${sessionId}` }
      });
      
      console.log('🔐 AUTH DEBUG: Backend response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔐 AUTH DEBUG: Valid session, user data:', data.user);
        return data.user;
      } else {
        console.log('🔐 AUTH DEBUG: Invalid session, backend rejected');
        return null;
      }
    } catch (error) {
      console.log('🔐 AUTH DEBUG: Session validation error:', error.message);
      return null;
    }
  }
  
  static async authenticatedFetch(url, options = {}) {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      throw new Error('No session found');
    }
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${sessionId}`
    };
    
    // Update URL to use dynamic API base if it's a relative API call
    const finalUrl = url.startsWith('/api/') ? `${window.API_BASE_URL}${url}` : url;
    const response = await fetch(finalUrl, { ...options, headers });
    
    if (response.status === 401) {
      localStorage.removeItem('sessionId');
      window.location.href = './user-management.html';
      throw new Error('Session expired');
    }
    
    return response;
  }
  
  static logout() {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      fetch(`${window.API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionId}` }
      }).catch(() => {});
    }
    localStorage.removeItem('sessionId');
    localStorage.removeItem('userEmail');
    window.location.href = './user-management.html';
  }
  
  static async requireAuth() {
    console.log('🔐 AUTH DEBUG: requireAuth called');
    const user = await this.checkAuth();
    console.log('🔐 AUTH DEBUG: checkAuth returned:', user);
    
    if (!user) {
      console.log('🔐 AUTH DEBUG: No valid user, clearing session data and redirecting');
      // Clear all session data when authentication fails
      localStorage.removeItem('sessionId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userUserRole');
      window.location.href = './user-management.html';
      return null;
    }
    console.log('🔐 AUTH DEBUG: Valid user found, returning user data');
    return user;
  }
}

export default AuthUtils;