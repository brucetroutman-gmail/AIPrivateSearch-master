/**
 * Centralized App Token Manager
 * Manages all localStorage data through a structured app_token object
 */

class AppTokenManager {
  constructor() {
    this.tokenKey = 'app_token';
    this.initializeToken();
  }

  // Default token structure
  getDefaultToken() {
    return {
      // UI Preferences (safe for localStorage)
      ui: {
        theme: 'dark',
        logSearchResults: false
      },
      
      // Search State (safe for localStorage)
      search: {
        selectedCollection: null,
        selectedScoreModel: null,
        selectedSearchMethods: [],
        lastQuery: null,
        useWildcards: false,
        useWildcardsMulti: false,
        addMetaPrompt: false,
        generateScores: false,
        lastSearchType: null,
        lastSourceType: null,
        lastAssistantType: null
      },
      
      // Model Settings (safe for localStorage)
      models: {
        lastUsedModel: null,
        temperature: null,
        context: null,
        tokens: null,
        vectorDB: null,
        lastPrompt: null
      },
      
      // Session info (non-sensitive display data only)
      session: {
        isLoggedIn: false,
        displayName: null // First name or display name only
      },
      
      // Metadata
      version: '1.0',
      lastUpdated: new Date().toISOString()
    };
  }

  // Initialize token on app start
  initializeToken() {
    try {
      const existing = localStorage.getItem(this.tokenKey);
      if (!existing) {
        console.log('Creating new app_token');
        this.saveToken(this.getDefaultToken());
      } else {
        // Validate and migrate existing token
        const token = JSON.parse(existing);
        const defaultToken = this.getDefaultToken();
        const mergedToken = this.mergeTokens(defaultToken, token);
        this.saveToken(mergedToken);
      }
    } catch (error) {
      console.error('Error initializing app_token:', error);
      this.saveToken(this.getDefaultToken());
    }
  }

  // Merge existing token with default structure
  mergeTokens(defaultToken, existingToken) {
    const merged = { ...defaultToken };
    
    // Merge each section
    Object.keys(defaultToken).forEach(section => {
      if (existingToken[section] && typeof existingToken[section] === 'object') {
        merged[section] = { ...defaultToken[section], ...existingToken[section] };
      }
    });
    
    merged.lastUpdated = new Date().toISOString();
    return merged;
  }

  // Get full token
  getToken() {
    try {
      const token = localStorage.getItem(this.tokenKey);
      return token ? JSON.parse(token) : this.getDefaultToken();
    } catch (error) {
      console.error('Error getting app_token:', error);
      return this.getDefaultToken();
    }
  }

  // Save full token
  saveToken(token) {
    try {
      // Validate before saving
      if (!this.isValidToken(token)) {
        throw new Error('Invalid token structure');
      }
      
      token.lastUpdated = new Date().toISOString();
      const tokenStr = JSON.stringify(token);
      
      // Check size limit (10KB)
      if (tokenStr.length > 10240) {
        console.warn('Token size exceeds 10KB');
        this.showUserMessage('Settings are too large, some data may be lost', 'warning');
      }
      
      localStorage.setItem(this.tokenKey, tokenStr);
      
    } catch (error) {
      console.error('Error saving app_token:', error);
      
      if (error.name === 'QuotaExceededError') {
        this.showUserMessage('Storage quota exceeded, settings not saved', 'error');
      } else {
        this.showUserMessage('Failed to save settings: ' + error.message, 'error');
      }
      throw error;
    }
  }

  // Get value from token (supports dot notation)
  get(path, key = null) {
    const token = this.getToken();
    
    // Support both old format get('ui', 'theme') and new get('ui.theme')
    if (key !== null) {
      return token[path] ? token[path][key] : null;
    }
    
    // Dot notation: 'ui.theme' -> token.ui.theme
    const parts = path.split('.');
    let current = token;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }
    return current;
  }

  // Set value in token (supports dot notation)
  set(path, keyOrValue, value = null) {
    const token = this.getToken();
    
    // Support both old format set('ui', 'theme', 'dark') and new set('ui.theme', 'dark')
    if (value !== null) {
      // Old format: set(section, key, value)
      if (!token[path]) {
        token[path] = {};
      }
      token[path][keyOrValue] = value;
    } else {
      // New format: set('ui.theme', 'dark')
      const parts = path.split('.');
      const lastKey = parts.pop();
      let current = token;
      
      // Navigate/create nested structure
      for (const part of parts) {
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part];
      }
      current[lastKey] = keyOrValue;
    }
    
    try {
      this.saveToken(token);
    } catch (error) {
      this.recoverFromError(error, 'set operation');
    }
  }

  // Get entire section
  getSection(section) {
    const token = this.getToken();
    return token[section] || {};
  }

  // Set entire section
  setSection(section, data) {
    const token = this.getToken();
    token[section] = { ...token[section], ...data };
    this.saveToken(token);
  }

  // Migration helpers for existing localStorage keys
  migrateFromOldStorage() {
    console.log('Migrating from old localStorage format...');
    
    const migrations = {
      // UI preferences
      'theme': 'ui.theme',
      'logSearchResults': 'ui.logSearchResults',
      
      // Search state
      'selectedCollection': 'search.selectedCollection',
      'selectedScoreModel': 'search.selectedScoreModel',
      'selectedSearchMethods': 'search.selectedSearchMethods',
      'multiModeSearchQuery': 'search.lastQuery',
      'useWildcards': 'search.useWildcards',
      'useWildcardsMulti': 'search.useWildcardsMulti',
      'addMetaPrompt': 'search.addMetaPrompt',
      'generateScores': 'search.generateScores',
      'lastSearchType': 'search.lastSearchType',
      'lastSourceType': 'search.lastSourceType',
      'lastCollection': 'search.selectedCollection',
      'lastAssistantType': 'search.lastAssistantType',
      
      // Model settings
      'lastUsedModel': 'models.lastUsedModel',
      'lastTemperature': 'models.temperature',
      'lastContext': 'models.context',
      'lastTokens': 'models.tokens',
      'lastVectorDB': 'models.vectorDB',
      'lastPrompt': 'models.lastPrompt',
      
      // Note: userEmail, userRole, userUserRole are now server-side only
      // No longer stored in localStorage for security
    };

    const token = this.getToken();
    let migrated = false;

    Object.entries(migrations).forEach(([oldKey, newPath]) => {
      const oldValue = localStorage.getItem(oldKey);
      if (oldValue !== null) {
        try {
          const parsedValue = oldKey === 'selectedSearchMethods' ? JSON.parse(oldValue) : oldValue;
          this.set(newPath, parsedValue);
          localStorage.removeItem(oldKey);
          migrated = true;
          console.log(`Migrated ${oldKey} -> app_token.${newPath}`);
        } catch (error) {
          console.error(`Error migrating ${oldKey}:`, error);
        }
      }
    });

    if (migrated) {
      console.log('Migration completed');
    }
  }

  // Clear all data
  clear() {
    localStorage.removeItem(this.tokenKey);
    this.initializeToken();
  }

  // Validate token structure
  isValidToken(token) {
    if (!token || typeof token !== 'object') return false;
    
    const requiredSections = ['ui', 'search', 'models', 'session'];
    return requiredSections.every(section => 
      token.hasOwnProperty(section) && typeof token[section] === 'object'
    );
  }
  
  // Show user-friendly messages
  showUserMessage(message, type = 'info') {
    const statusEl = document.getElementById('statusMessage') || document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `status-message status-${type}`;
      statusEl.style.display = 'block';
      setTimeout(() => statusEl.style.display = 'none', 5000);
      return;
    }
    console.log(`[AppToken ${type.toUpperCase()}]: ${message}`);
  }
  
  // Recovery helper
  recoverFromError(error, operation) {
    console.error(`AppToken error in ${operation}:`, error);
    
    try {
      const backup = this.getToken();
      localStorage.setItem('app_token_backup', JSON.stringify(backup));
      this.saveToken(this.getDefaultToken());
      this.showUserMessage(`Recovered from ${operation} error, settings reset`, 'warning');
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
      this.showUserMessage('Critical error: unable to recover settings', 'error');
    }
  }
  
  // Debug helper
  debug() {
    const token = this.getToken();
    console.log('Current app_token:', token);
    console.log('Token size:', JSON.stringify(token).length, 'bytes');
    console.log('Valid structure:', this.isValidToken(token));
  }
}

// Create global instance
window.AppToken = new AppTokenManager();

// Auto-migrate on first load
if (!localStorage.getItem('app_token_migrated')) {
  window.AppToken.migrateFromOldStorage();
  localStorage.setItem('app_token_migrated', 'true');
}