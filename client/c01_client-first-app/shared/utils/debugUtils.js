// Debug utilities for tracking license/auth state
class DebugUtils {
  static logLocalStorageState(context = '') {
    const state = {
      sessionId: localStorage.getItem('sessionId') ? 'exists' : 'missing',
      userEmail: localStorage.getItem('userEmail'),
      userRole: localStorage.getItem('userRole'),
      userUserRole: localStorage.getItem('userUserRole'),
      theme: localStorage.getItem('theme'),
      lastCollection: localStorage.getItem('lastCollection'),
      lastUsedModel: localStorage.getItem('lastUsedModel')
    };
    
    console.log(`🔍 LOCALSTORAGE DEBUG [${context}]:`, state);
    return state;
  }
  
  static logLicenseState(context = '') {
    const licenseState = {
      hasLicenseChecker: !!window.licenseChecker,
      cachedStatus: window.licenseChecker?.licenseStatus,
      lastCheck: window.licenseChecker?.lastCheck,
      cacheAge: window.licenseChecker?.lastCheck ? Date.now() - window.licenseChecker.lastCheck : 'no cache'
    };
    
    console.log(`🔐 LICENSE STATE DEBUG [${context}]:`, licenseState);
    return licenseState;
  }
  
  static logFullState(context = '') {
    console.log(`🔍 FULL DEBUG STATE [${context}]:`);
    this.logLocalStorageState(context);
    this.logLicenseState(context);
    console.log(`📍 Current page: ${window.location.pathname}`);
    console.log(`🌐 API Base URL: ${window.API_BASE_URL || 'not set'}`);
  }
  
  static clearAllAuthData() {
    console.log('🧹 CLEARING ALL AUTH DATA');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userUserRole');
    
    if (window.licenseChecker) {
      window.licenseChecker.licenseStatus = null;
      window.licenseChecker.lastCheck = 0;
    }
    
    this.logFullState('after clear');
  }
}

// Make available globally
window.DebugUtils = DebugUtils;

export default DebugUtils;