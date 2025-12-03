/**
 * Theme Loader - Immediate theme loading to prevent flash
 * This script should be loaded in the <head> before styles
 */

(function() {
  // Try to get theme from app_token first, fallback to localStorage
  let theme = 'dark'; // default
  
  try {
    const appToken = localStorage.getItem('app_token');
    if (appToken) {
      const parsed = JSON.parse(appToken);
      theme = parsed.ui?.theme || 'dark';
    } else {
      // Fallback to old localStorage method
      theme = localStorage.getItem('theme') || 'dark';
    }
  } catch (error) {
    // If parsing fails, use default dark theme
    theme = 'dark';
  }
  
  // Apply theme immediately
  document.documentElement.setAttribute('data-theme', theme);
  
  // Save theme to app_token structure if it doesn't exist
  try {
    const appToken = localStorage.getItem('app_token');
    if (!appToken) {
      const defaultToken = {
        ui: { theme: theme, logSearchResults: false },
        search: {},
        models: {},
        user: {},
        version: '1.0',
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('app_token', JSON.stringify(defaultToken));
    }
  } catch (error) {
    // Silent fail - app token will be created by appTokenManager.js
  }
})();