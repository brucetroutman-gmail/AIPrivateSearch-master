// CSRF Token Management
class CSRFManager {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
    this.initPromise = null;
  }

  // Initialize CSRF manager
  async init() {
    if (!this.initPromise) {
      this.initPromise = this.getToken();
    }
    return this.initPromise;
  }

  // Fetch CSRF token from server
  async getToken() {
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await fetch('http://localhost:3001/api/csrf-token');
      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }
      
      const data = await response.json();
      this.token = data.csrfToken;
      this.tokenExpiry = Date.now() + 3500000; // 58 minutes (slightly less than server expiry)
      
      return this.token;
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      // For development, allow requests without CSRF token if server is not available
      if (error.message.includes('fetch')) {
        console.warn('CSRF server unavailable, proceeding without token');
        return null;
      }
      throw error;
    }
  }

  // Add CSRF token to request headers
  async addTokenToHeaders(headers = {}) {
    const token = await this.getToken();
    if (token) {
      return {
        ...headers,
        'X-CSRF-Token': token
      };
    }
    return headers;
  }

  // Add CSRF token to FormData
  async addTokenToFormData(formData) {
    const token = await this.getToken();
    if (token) {
      formData.append('_csrf', token);
    }
    return formData;
  }

  // Enhanced fetch with automatic CSRF token
  async fetch(url, options = {}) {
    // Ensure CSRF manager is initialized
    await this.init();
    
    const method = options.method || 'GET';
    
    // Only add CSRF token for state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
      if (options.body instanceof FormData) {
        await this.addTokenToFormData(options.body);
      } else {
        options.headers = await this.addTokenToHeaders(options.headers);
      }
    }

    return fetch(url, options);
  }
}

// Global CSRF manager instance
if (typeof window !== 'undefined') {
  window.csrfManager = new CSRFManager();
  // Initialize immediately
  window.csrfManager.init().catch(console.error);
}