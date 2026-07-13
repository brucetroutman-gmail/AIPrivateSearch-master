import { DOMSanitizer } from './utils/domSanitizer.js';
import AuthUtils from './utils/authUtils.js';
import DebugUtils from './utils/debugUtils.js';
import './utils/apiConfig.js';
import './utils/appTokenManager.js';
import './utils/secureUserManager.js';
import { logger } from './utils/logger.js';

// Simple rate limiting
let messageCallCount = 0;
let lastMessageReset = Date.now();
let promptCallCount = 0;
let lastPromptReset = Date.now();

// User message system with rate limiting
function showUserMessage(message, type = 'info') {
  // Rate limiting - max 10 messages per 30 seconds
  const now = Date.now();
  if (now - lastMessageReset > 30000) {
    messageCallCount = 0;
    lastMessageReset = now;
  }
  if (messageCallCount >= 10) return;
  messageCallCount++;
  
  // Sanitize input using DOMSanitizer
  const sanitizedMessage = DOMSanitizer.sanitizeText(message).substring(0, 200);
  
  const validTypes = ['info', 'success', 'error'];
  const safeType = validTypes.includes(type) ? type : 'info';
  
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  let messageEl = document.getElementById('user-message');
  if (!messageEl) {
    messageEl = document.createElement('div');
    messageEl.id = 'user-message';
    messageEl.className = 'user-message';
    document.body.appendChild(messageEl);
  }
  
  messageEl.textContent = sanitizedMessage;
  messageEl.className = `user-message ${safeType}`;
  
  setTimeout(() => {
    if (messageEl && messageEl.parentNode) {
      messageEl.parentNode.removeChild(messageEl);
    }
  }, 3000);
}

// Prompt replacement with rate limiting
function securePrompt(message, defaultValue = '') {
  // Rate limiting - max 5 prompts per 60 seconds
  const now = Date.now();
  if (now - lastPromptReset > 60000) {
    promptCallCount = 0;
    lastPromptReset = now;
  }
  if (promptCallCount >= 5) return Promise.resolve(null);
  promptCallCount++;
  
  // Sanitize message using DOMSanitizer
  const sanitizedMessage = DOMSanitizer.sanitizeText(message).substring(0, 500);
  
  return new Promise((resolve) => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const themeClass = isDark ? 'dark' : 'light';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = `modal-dialog ${themeClass}`;
    
    const messageEl = document.createElement('p');
    messageEl.textContent = sanitizedMessage;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = defaultValue;
    input.className = `modal-input ${themeClass}`;
    
    const buttons = document.createElement('div');
    buttons.className = 'modal-buttons';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = `modal-button cancel ${themeClass}`;
    
    const okBtn = document.createElement('button');
    okBtn.textContent = 'OK';
    okBtn.className = 'modal-button ok';
    
    cancelBtn.onclick = () => { document.body.removeChild(modal); resolve(null); };
    okBtn.onclick = () => { 
      const sanitizedValue = DOMSanitizer.sanitizeText(input.value);
      document.body.removeChild(modal); 
      resolve(sanitizedValue); 
    };
    
    buttons.appendChild(cancelBtn);
    buttons.appendChild(okBtn);
    dialog.appendChild(messageEl);
    dialog.appendChild(input);
    dialog.appendChild(buttons);
    modal.appendChild(dialog);
    document.body.appendChild(modal);
    
    input.focus();
    input.select();
  });
}

// Confirm replacement with rate limiting
function secureConfirm(message) {
  // Rate limiting - max 5 confirms per 60 seconds
  const now = Date.now();
  if (now - lastPromptReset > 60000) {
    promptCallCount = 0;
    lastPromptReset = now;
  }
  if (promptCallCount >= 5) return Promise.resolve(false);
  promptCallCount++;
  
  // Sanitize message using DOMSanitizer
  const sanitizedMessage = DOMSanitizer.sanitizeText(message).substring(0, 500);
  
  return new Promise((resolve) => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const themeClass = isDark ? 'dark' : 'light';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = `modal-dialog ${themeClass}`;
    
    const messageEl = document.createElement('p');
    messageEl.textContent = sanitizedMessage;
    messageEl.className = 'modal-message';
    
    const buttons = document.createElement('div');
    buttons.className = 'modal-buttons';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = `modal-button cancel ${themeClass}`;
    
    const okBtn = document.createElement('button');
    okBtn.textContent = 'OK';
    okBtn.className = 'modal-button ok';
    
    cancelBtn.onclick = () => { document.body.removeChild(modal); resolve(false); };
    okBtn.onclick = () => { document.body.removeChild(modal); resolve(true); };
    
    buttons.appendChild(cancelBtn);
    buttons.appendChild(okBtn);
    dialog.appendChild(messageEl);
    dialog.appendChild(buttons);
    modal.appendChild(dialog);
    document.body.appendChild(modal);
  });
}

// Load app config and update branding
async function loadAppConfig() {
  try {
    const response = await fetch('./config/app.json');
    const config = await response.json();
    const logoEl = document.getElementById('app-logo');
    if (logoEl && config['app-name']) {
      // Clear existing content safely
      while (logoEl.firstChild) {
        logoEl.removeChild(logoEl.firstChild);
      }
      
      // Add app name as text node
      logoEl.appendChild(document.createTextNode(config['app-name']));
    }
    
    // Update footer group link if present
    const footerGroupLink = document.getElementById('footer-group-link');
    if (footerGroupLink && config['app-name']) {
      footerGroupLink.textContent = `${config['app-name']} Group`;
    }
  } catch (error) {
    // Silently fail - app config is not critical
  }
}





// Load shared header and footer
async function loadSharedComponents() {
  try {
    // Load header
    const headerResponse = await fetch('./shared/header.html');
    const headerHTML = await headerResponse.text();
    const headerEl = document.getElementById('header-placeholder');
    if (headerEl) {
      // Safe HTML parsing to prevent XSS
      const parser = new DOMParser();
      const doc = parser.parseFromString(headerHTML, 'text/html');
      const headerContent = doc.body.firstElementChild;
      if (headerContent) {
        headerEl.appendChild(headerContent);
        // Load app config after header is loaded
        loadAppConfig();
        // Apply tier access immediately after header is in DOM
        if (window.tierAccessManager) {
          window.tierAccessManager.applyAccessControl();
        }
      }
    }
    
    // Load footer
    const footerResponse = await fetch('./shared/footer.html');
    const footerHTML = await footerResponse.text();
    const footerEl = document.getElementById('footer-placeholder');
    if (footerEl) {
      // Safe HTML parsing to prevent XSS
      const parser = new DOMParser();
      const doc = parser.parseFromString(footerHTML, 'text/html');
      const footerContent = doc.body.firstElementChild;
      if (footerContent) {
        footerEl.appendChild(footerContent);
      }
    }
    
  } catch (error) {
    console.error('Error loading shared components:', error);
  }
}

// Dark mode toggle function
function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  
  // Use app token if available, fallback to localStorage
  if (window.AppToken) {
    window.AppToken.set('ui', 'theme', newTheme);
  } else {
    localStorage.setItem('theme', newTheme);
  }
}

// Load saved theme
function loadTheme() {
  let theme;
  
  // Use app token if available, fallback to localStorage
  if (window.AppToken) {
    theme = window.AppToken.get('ui', 'theme');
  } else {
    theme = localStorage.getItem('theme');
  }
  
  if (!theme) {
    // First-time user - default to dark mode
    theme = 'dark';
    if (window.AppToken) {
      window.AppToken.set('ui', 'theme', theme);
    } else {
      localStorage.setItem('theme', theme);
    }
  }
  
  document.documentElement.setAttribute('data-theme', theme);
}

// Toggle mobile menu
function toggleMenu() {
  const navMenu = document.getElementById('navMenu');
  if (navMenu) {
    navMenu.classList.toggle('active');
  }
}

// Role-based system
async function setUserRole(role) {
  const validRoles = ['standard', 'premium', 'professional'];
  if (!validRoles.includes(role)) return;
  
  const currentRole = getUserRole();
  if (currentRole === role) {
    return;
  }
  
  const tierMap = { 'standard': 1, 'premium': 2, 'professional': 3 };
  const tier = tierMap[role];
  
  try {
    const sessionId = localStorage.getItem('sessionId');
    const response = await window.csrfManager.fetch(`${window.API_BASE_URL}/api/config/subscription-tier`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionId}`
      },
      body: JSON.stringify({ tier })
    });
    
    if (response.ok) {
      if (window.AppToken) {
        window.AppToken.set('user', 'role', role);
      } else {
        localStorage.setItem('userRole', role);
      }
      const userRole = getUserUserRole();
      await applyUserRole(role, userRole);
    }
  } catch (error) {
    // Silent fail - tier change will be handled by authentication flow
  }
}

function getUserRole() {
  if (window.SecureUser) {
    // Use cached version for performance
    const cached = window.SecureUser.getUserRoleCached();
    if (cached !== 'standard') return cached;
    
    // Fallback to async if no cache
    window.SecureUser.getUserRole().then(role => {
      // Cache will be updated automatically
    });
    return cached;
  }
  // Fallback for backward compatibility
  return localStorage.getItem('userRole') || 'professional';
}

function getUserUserRole() {
  if (window.SecureUser) {
    // Use cached version for performance
    const cached = window.SecureUser.getUserUserRoleCached();
    if (cached !== 'searcher') return cached;
    
    // Fallback to async if no cache
    window.SecureUser.getUserUserRole().then(role => {
      // Cache will be updated automatically
    });
    return cached;
  }
  // Fallback for backward compatibility
  return localStorage.getItem('userUserRole') || 'admin';
}

// Legacy function for backward compatibility
function toggleDeveloperMode() {
  const currentRole = getUserRole();
  const newRole = currentRole === 'standard' ? 'professional' : 'standard';
  setUserRole(newRole);
}

function toggleElementsByClass(className, isDeveloperMode) {
  const elements = document.querySelectorAll(className);
  elements.forEach(element => {
    element.style.display = isDeveloperMode ? '' : 'none';
  });
}

async function applyUserRole(role = null, userRole = null) {
  if (role === null) {
    role = getUserRole();
  }
  if (userRole === null) {
    userRole = getUserUserRole();
  }
  
  console.log('🔐 ROLE DEBUG: Applying user role:', { role, userRole });
  
  // Try to use tier access manager if available
  if (window.tierAccessManager) {
    try {
      const tierMap = { 'standard': 1, 'premium': 2, 'professional': 3 };
      const tier = tierMap[role] || 1;
      console.log('🔐 ROLE DEBUG: Using tier access manager with tier:', tier, 'role:', userRole);
      await window.tierAccessManager.applyCSSClasses(tier, userRole);
      return;
    } catch (error) {
      console.warn('Tier access manager failed, using fallback:', error);
    }
  }
  
  console.log('🔐 ROLE DEBUG: Using fallback role application');
  // Fallback to original logic
  const showAdvanced = role !== 'standard';
  const isAdmin = userRole === 'admin';
  
  const isPremium = role === 'premium';
  const isProfessional = role === 'professional';
  toggleElementsByClass('.prem-only', isPremium || isProfessional);
  toggleElementsByClass('.pro-only', isProfessional);
  toggleElementsByClass('.admin-only', isAdmin);
  toggleElementsByClass('.searcher-only', !isAdmin);
}

// Legacy function for backward compatibility
function applyDeveloperMode(isDeveloperMode = null) {
  if (isDeveloperMode === null) {
    // Migrate from old developerMode to role system
    const oldMode = localStorage.getItem('developerMode');
    if (oldMode !== null) {
      const role = oldMode === 'true' ? 'professional' : 'standard';
      localStorage.setItem('userRole', role);
      localStorage.removeItem('developerMode');
    }
  }
  applyUserRole();
}

function loadDeveloperMode() {
  // Migrate existing users from developerMode to role system
  const oldMode = localStorage.getItem('developerMode');
  if (oldMode !== null && !localStorage.getItem('userRole')) {
    const role = oldMode === 'true' ? 'professional' : 'standard';
    localStorage.setItem('userRole', role);
    localStorage.removeItem('developerMode');
  }
  
  // Default to professional role if not set (for existing users)
  if (!localStorage.getItem('userRole')) {
    localStorage.setItem('userRole', 'professional');
  }
  
  applyUserRole();
}

// Email management
async function checkUserEmail() {
  if (window.SecureUser) {
    const email = await window.SecureUser.getUserEmail();
    return !!email;
  }
  // Fallback for backward compatibility
  const email = localStorage.getItem('userEmail');
  return !!email;
}

async function promptForEmail() {
  let email;
  do {
    email = await securePrompt('Welcome to AIPrivateSearch!\n\nPlease enter your email address to continue:');
    if (email === null) {
      // User clicked cancel
      showUserMessage('Email is required to use this application.', 'error');
      continue;
    }
    if (email && validateEmail(email)) {
      if (window.AppToken) {
        window.AppToken.set('user', 'email', email);
      } else {
        localStorage.setItem('userEmail', email);
      }
      return true;
    } else if (email) {
      showUserMessage('Please enter a valid email address.', 'error');
    }
  } while (!email || !validateEmail(email));
}

function validateEmail(email) {
  const sanitized = DOMSanitizer.sanitizeEmail(email);
  return sanitized !== '';
}

async function getUserEmail() {
  if (window.SecureUser) {
    return await window.SecureUser.getUserEmail() || '';
  }
  // Fallback for backward compatibility
  return localStorage.getItem('userEmail') || '';
}

async function updateUserEmail() {
  const currentEmail = getUserEmail();
  const newEmail = await securePrompt('Enter your email address:', currentEmail);
  const sanitizedEmail = DOMSanitizer.sanitizeEmail(newEmail || '');
  if (newEmail !== null && sanitizedEmail) {
    if (window.AppToken) {
      window.AppToken.set('user', 'email', sanitizedEmail);
    } else {
      localStorage.setItem('userEmail', sanitizedEmail);
    }
    showUserMessage('Email updated successfully!', 'success');
  } else if (newEmail) {
    showUserMessage('Please enter a valid email address.', 'error');
  }
}

async function showUserInfo() {
  window.location.href = './user-management.html';
}

async function handleLogout() {
  logger.crumb('logout', { user: localStorage.getItem('userEmail') || 'unknown' });
  if (window.SecureUser) {
    await window.SecureUser.logout();
  } else {
    AuthUtils.logout();
  }
  localStorage.removeItem('sessionId');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userUserRole');
  localStorage.removeItem('userRole');
  window.location.href = './user-management.html';
}

function setupLoginIcon() {
  const loginIcon = document.querySelector('.login-icon');
  if (loginIcon) {
    loginIcon.addEventListener('click', (e) => {
      e.preventDefault();
      showUserInfo();
    });
  }
}

// Show licensed content (menu and user info)
function showLicensedContent() {
  console.log('🔓 MENU: Showing licensed content');
  const licensedElements = document.querySelectorAll('.licensed-only');
  licensedElements.forEach(element => {
    element.style.display = '';
  });
}

// Common score model loading function
async function loadScoreModels(selectElementId) {
  try {
    const response = await fetch(`${window.API_BASE_URL}/api/config/models-list.json`);
    const data = await response.json();
    const scoreSelect = document.getElementById(selectElementId);
    
    if (!scoreSelect) {
      console.error('Score select element not found:', selectElementId);
      return;
    }
    
    const scoreModels = [...new Set(
      data.models
        .filter(model => model.category === 'score')
        .map(model => model.modelName)
    )].sort();
    
    if (scoreModels.length > 0) {
      const savedScoreModel = localStorage.getItem('selectedScoreModel');
      // Clear existing options safely
      while (scoreSelect.firstChild) {
        scoreSelect.removeChild(scoreSelect.firstChild);
      }
      
      scoreModels.forEach((modelName, index) => {
        const option = document.createElement('option');
        option.value = modelName;
        option.textContent = modelName;
        if (savedScoreModel ? modelName === savedScoreModel : index === 0) {
          option.selected = true;
        }
        scoreSelect.appendChild(option);
      });
      
      // Remove existing event listeners to prevent duplicates
      const newSelect = scoreSelect.cloneNode(true);
      scoreSelect.parentNode.replaceChild(newSelect, scoreSelect);
      
      // Add single event listener
      newSelect.addEventListener('change', function() {
        localStorage.setItem('selectedScoreModel', this.value);
      });
    } else {
      while (scoreSelect.firstChild) {
        scoreSelect.removeChild(scoreSelect.firstChild);
      }
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No score models available';
      scoreSelect.appendChild(option);
    }
  } catch (error) {
    console.error('Error loading score models:', error);
    const selectEl = document.getElementById(selectElementId);
    if (selectEl) {
      while (selectEl.firstChild) {
        selectEl.removeChild(selectEl.firstChild);
      }
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Error loading score models';
      selectEl.appendChild(option);
    }
  }
}

// Common database export function with retry logic
async function exportToDatabase(result, testCategory = null, testDescription = null, testParams = null, retryCount = 0) {
  const dbData = {
    TestCode: result.testCode || '',
    TestCategory: testCategory || null,
    TestDescription: testDescription || null,
    UserEmail: DOMSanitizer.sanitizeEmail(localStorage.getItem('userEmail') || '') || null,
    PcCode: result.pcCode || null,
    PcCPU: result.systemInfo?.chip || null,
    PcGraphics: result.systemInfo?.graphics || null,
    PcRAM: result.systemInfo?.ram || null,
    PcOS: result.systemInfo?.os || null,
    CreatedAt: (() => {
      if (!result.createdAt) return null;
      try {
        const date = new Date(result.createdAt);
        const formatted = date.toISOString().slice(0, 19).replace('T', ' ');
        console.debug('CreatedAt formatting:', 'original:', result.createdAt, 'formatted:', formatted, 'length:', formatted.length);
        return formatted;
      } catch (e) {
        console.error('Date formatting error:', e);
        return null;
      }
    })(),
    SourceType: result.sourceType || null,
    CollectionName: result.collection || null,
    SearchMethodType: result.searchType || null,
    SystemPrompt: result.systemPromptName || null,
    Prompt: result.query || null,
    'ModelName-search': result.metrics?.search?.model || null,
    'ModelContextSize-search': result.metrics?.search?.context_size || testParams?.context || null,
    'ModelTemperature-search': result.metrics?.search?.temperature || testParams?.temperature || null,
    'ModelTopK-search': result.metrics?.search?.topK || result.topK || testParams?.topK || null,
    'ModelTokenLimit-search': (() => {
      const tl = result.metrics?.search?.token_limit ?? result.tokenLimit ?? null;
      if (tl === null || tl === undefined) throw new Error('ModelTokenLimit-search is missing from search metrics and result');
      return tl;
    })(),
    'Duration-search-s': result.metrics?.search ? (result.metrics.search.total_duration / 1000000000) : null,
    'Load-search-ms': result.metrics?.search ? Math.round(result.metrics.search.load_duration / 1000000) : null,
    'EvalTokensPerSecond-ssearch': (() => {
      const search = result.metrics?.search;
      if (!search || !search.eval_count || !search.eval_duration || search.eval_duration === 0) {
        return null;
      }
      const tokensPerSec = search.eval_count / (search.eval_duration / 1000000000);
      return isFinite(tokensPerSec) ? Math.round(tokensPerSec * 100) / 100 : null;
    })(),
    'Answer-search': result.response || null,
    'Chunks-search': result.chunks?.length
      ? JSON.stringify(result.chunks.map(c => ({
          filename: c.filename,
          chunk_index: c.chunk_index,
          similarity: c.similarity,
          content: c.content
        })))
      : null,
    'ModelName-score': result.metrics?.scoring?.model || null,
    'ModelContextSize-score': result.metrics?.scoring?.context_size || null,
    'ModelTemperature-score': result.metrics?.scoring?.temperature || null,
    'ModelTokenLimit-score': result.metrics?.scoring?.max_tokens || null,
    'Duration-score-s': result.metrics?.scoring ? (result.metrics.scoring.total_duration / 1000000000) : null,
    'Load-score-ms': result.metrics?.scoring ? Math.round(result.metrics.scoring.load_duration / 1000000) : null,
    'EvalTokensPerSecond-score': result.metrics?.scoring ? (result.metrics.scoring.eval_count / (result.metrics.scoring.eval_duration / 1000000000)) : null,
    AccurateScore: result.scores?.accuracy || null,
    RelevantScore: result.scores?.relevance || null,
    OrganizedScore: result.scores?.organization || null,
    'WeightedScore-pct': result.scores?.total || null
  };
  
  try {
    const response = await window.csrfManager.fetch(`${window.API_BASE_URL}/api/database/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const saveResult = await response.json();
    
    if (saveResult.success) {
      return { success: true, insertId: saveResult.insertId };
    } else {
      throw new Error(`Database error: ${saveResult.error} (Code: ${saveResult.code || 'unknown'})`);
    }
  } catch (error) {
    console.error('Database export error:', error);
    
    // Retry on connection issues (common on M4 Macs)
    if (error.message && (error.message.includes('ECONNRESET') || error.message.includes('ECONNREFUSED')) && retryCount < 3) {
      console.warn(`Database connection issue, retrying... (attempt ${retryCount + 1})`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      return exportToDatabase(result, testCategory, testDescription, testParams, retryCount + 1);
    }
    
    const errorMsg = error.message || error.toString() || 'Unknown database error';
    throw new Error(errorMsg);
  }
}

// Collections utility functions
const collectionsUtils = {
  async loadCollections() {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/multi-search/collections`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return data.collections || [];
    } catch (error) {
      console.error('Failed to load collections:', error);
      return [];
    }
  },

  async populateCollectionSelect(selectId, includeAllOption = false) {
    const select = document.getElementById(selectId);
    if (!select) return;

    try {
      const collections = await this.loadCollections();
      select.textContent = '';
      
      if (includeAllOption) {
        const allOption = document.createElement('option');
        allOption.value = '';
        allOption.textContent = 'All Collections';
        select.appendChild(allOption);
      } else {
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select Collection';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        select.appendChild(defaultOption);
      }
      
      const savedCollection = localStorage.getItem('selectedCollection');
      collections.forEach(collection => {
        const option = document.createElement('option');
        option.value = collection;
        option.textContent = collection;
        if (collection === savedCollection) {
          option.selected = true;
        }
        select.appendChild(option);
      });
      
      select.addEventListener('change', function() {
        localStorage.setItem('selectedCollection', this.value);
      });
    } catch (error) {
      console.error('Failed to populate collection select:', error);
    }
  }
};

// Make functions globally available
if (typeof window !== 'undefined') {
  window.showUserMessage = showUserMessage;
  window.securePrompt = securePrompt;
  window.secureConfirm = secureConfirm;
  window.toggleDarkMode = toggleDarkMode;
  window.toggleDeveloperMode = toggleDeveloperMode;
  window.setUserRole = setUserRole;
  window.getUserRole = getUserRole;
  window.getUserUserRole = getUserUserRole;
  window.toggleMenu = toggleMenu;
  window.collectionsUtils = collectionsUtils;
  window.handleLogout = handleLogout;
  window.showLicensedContent = showLicensedContent;
  window.testLogout = () => {
    if (confirm('Logout for testing?')) {
      handleLogout();
    }
  };
}

// Export functions for module imports
export { loadScoreModels, exportToDatabase };

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 COMMON.JS: DOMContentLoaded fired');
  DebugUtils.logFullState('DOMContentLoaded start');
  
  // Load tier access manager
  try {
    const { default: tierAccessManager } = await import('./utils/tierAccessManager.js');
    window.tierAccessManager = tierAccessManager;
    await tierAccessManager.loadConfig();
  } catch (error) {
    console.warn('Failed to load tier access manager:', error);
  }
  loadTheme();
  
  // Skip authentication check on licensing pages
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const licensingPages = ['license-activation.html', 'index.html', 'videos.html'];
  
  console.log('🚀 COMMON.JS: Current page check:', { currentPage, isLicensingPage: licensingPages.includes(currentPage) });
  
  if (!licensingPages.includes(currentPage)) {
    console.log('🔐 AUTH DEBUG: Page requires auth check:', currentPage);
    console.log('🔐 AUTH DEBUG: localStorage state:', {
      sessionId: localStorage.getItem('sessionId') ? 'exists' : 'missing',
      userEmail: localStorage.getItem('userEmail'),
      userRole: localStorage.getItem('userRole'),
      userUserRole: localStorage.getItem('userUserRole')
    });
    
    // Check license status first
    if (window.licenseChecker) {
      console.log('🔐 AUTH DEBUG: Checking license status before auth...');
      const licenseStatus = await window.licenseChecker.checkLicenseStatus();
      console.log('🔐 AUTH DEBUG: License status result:', licenseStatus);
      
      if (licenseStatus.requiresActivation && !licenseStatus.fallback) {
        console.log('🔐 AUTH DEBUG: License requires activation, redirecting to activation page');
        window.location.href = './license-activation.html';
        return;
      } else {
        console.log('🔐 AUTH DEBUG: License OK, proceeding to auth check');
      }
    } else {
      console.log('🔐 AUTH DEBUG: No license checker available');
    }
    
    // Check authentication status - require login with fallback
    console.log('🔐 AUTH DEBUG: Calling AuthUtils.requireAuth()');
    const user = await AuthUtils.requireAuth();
    console.log('🔐 AUTH DEBUG: AuthUtils.requireAuth() result:', user);
    
    if (!user) {
      console.log('🔐 AUTH DEBUG: No user returned, clearing session and redirecting to login');
      // Clear invalid session data and redirect to login
      localStorage.removeItem('sessionId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userUserRole');
      sessionStorage.setItem('loginReturnUrl', window.location.href);
      logger.crumb('session_timeout', { page: window.location.pathname.split('/').pop() });
      window.location.href = './user-management.html';
      return;
    }
    
    // Set role from authenticated user
    setUserRole(user.subscriptionTier);
    // Store user role (admin/searcher)
    localStorage.setItem('userUserRole', user.userRole);
    // Store email for compatibility
    localStorage.setItem('userEmail', user.email);
    window._showLicensedContent = true;
  } else if (currentPage === 'index.html') {
    // For index page, check license and auth status to show menu
    let showMenu = false;
    
    // Check license status
    if (window.licenseChecker) {
      const licenseStatus = await window.licenseChecker.checkLicenseStatus();
      console.log('🔐 INDEX DEBUG: License status for menu display:', licenseStatus);
      
      // Show menu if license is valid, expired (but not requiring activation), or in fallback mode
      if (licenseStatus.valid || licenseStatus.expired || licenseStatus.fallback) {
        // Check if user is authenticated
        const user = await AuthUtils.checkAuth();
        if (user) {
          showMenu = true;
          // Set role from authenticated user
          setUserRole(user.subscriptionTier);
          localStorage.setItem('userUserRole', user.userRole);
          localStorage.setItem('userEmail', user.email);
        }
      }
    }
    
    if (showMenu) {
      window._showLicensedContent = true;
    }
  }

  loadSharedComponents().then(async () => {
    setupLoginIcon();
    if (window.tierAccessManager) {
      await window.tierAccessManager.applyAccessControl();
    }
    if (window._showLicensedContent) showLicensedContent();
  });
});