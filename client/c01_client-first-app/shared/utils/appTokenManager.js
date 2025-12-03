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
      token.lastUpdated = new Date().toISOString();
      localStorage.setItem(this.tokenKey, JSON.stringify(token));
    } catch (error) {
      console.error('Error saving app_token:', error);
    }
  }

  // Get value from token
  get(section, key) {
    const token = this.getToken();
    return token[section] ? token[section][key] : null;
  }

  // Set value in token
  set(section, key, value) {
    const token = this.getToken();
    if (!token[section]) {
      token[section] = {};
    }
    token[section][key] = value;
    this.saveToken(token);
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
      'theme': ['ui', 'theme'],
      'logSearchResults': ['ui', 'logSearchResults'],
      
      // Search state
      'selectedCollection': ['search', 'selectedCollection'],
      'selectedScoreModel': ['search', 'selectedScoreModel'],
      'selectedSearchMethods': ['search', 'selectedSearchMethods'],
      'multiModeSearchQuery': ['search', 'lastQuery'],
      'useWildcards': ['search', 'useWildcards'],
      'useWildcardsMulti': ['search', 'useWildcardsMulti'],
      'addMetaPrompt': ['search', 'addMetaPrompt'],
      'generateScores': ['search', 'generateScores'],
      'lastSearchType': ['search', 'lastSearchType'],
      'lastSourceType': ['search', 'lastSourceType'],
      'lastCollection': ['search', 'selectedCollection'],
      'lastAssistantType': ['search', 'lastAssistantType'],
      
      // Model settings
      'lastUsedModel': ['models', 'lastUsedModel'],
      'lastTemperature': ['models', 'temperature'],
      'lastContext': ['models', 'context'],
      'lastTokens': ['models', 'tokens'],
      'lastVectorDB': ['models', 'vectorDB'],
      'lastPrompt': ['models', 'lastPrompt'],
      
      // Note: userEmail, userRole, userUserRole are now server-side only
      // No longer stored in localStorage for security
    };

    const token = this.getToken();
    let migrated = false;

    Object.entries(migrations).forEach(([oldKey, [section, newKey]]) => {
      const oldValue = localStorage.getItem(oldKey);
      if (oldValue !== null) {
        try {
          const parsedValue = oldKey === 'selectedSearchMethods' ? JSON.parse(oldValue) : oldValue;
          this.set(section, newKey, parsedValue);
          localStorage.removeItem(oldKey);
          migrated = true;
          console.log(`Migrated ${oldKey} -> app_token.${section}.${newKey}`);
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

  // Debug helper
  debug() {
    console.log('Current app_token:', this.getToken());
  }
}

// Create global instance
window.AppToken = new AppTokenManager();

// Auto-migrate on first load
if (!localStorage.getItem('app_token_migrated')) {
  window.AppToken.migrateFromOldStorage();
  localStorage.setItem('app_token_migrated', 'true');
}