// Rate limiting for message display
let messageCallCount = 0;
let lastMessageReset = Date.now();

// Rate limiting for prompts
let promptCallCount = 0;
let lastPromptReset = Date.now();

// Authorization system
const AUTHORIZED_FUNCTIONS = new Set([
  'toggleDeveloperMode', 'promptForEmail', 'updateUserEmail', 'showUserInfo',
  'exportToDatabase', 'loadScoreModels', 'loadSharedComponents', 'handleExport',
  'search.js', 'collections.html', 'test.html', 'model.html', 'collections-editor.html'
]);

function isAuthorizedCaller() {
  const stack = new Error().stack;
  if (!stack) return false;
  
  // Check if call comes from authorized functions
  for (const funcName of AUTHORIZED_FUNCTIONS) {
    if (stack.includes(funcName)) return true;
  }
  
  // Check if call comes from legitimate application files
  const legitimateFiles = [
    'search.js', 'common.js', 'collections.html', 'test.html', 
    'model.html', 'collections-editor.html'
  ];
  
  for (const file of legitimateFiles) {
    if (stack.includes(file)) return true;
  }
  
  // Check if call comes from same origin and not from eval/Function
  if (window.location.origin === document.location.origin && 
      !stack.includes('eval') && !stack.includes('Function')) {
    return true;
  }
  
  return false;
}

// Secure user message system
function showUserMessage(message, type = 'info') {
  // Authorization check
  if (!isAuthorizedCaller()) {
    console.warn('Unauthorized message display attempt');
    return;
  }
  
  // Rate limiting - max 10 messages per 30 seconds
  const now = Date.now();
  if (now - lastMessageReset > 30000) {
    messageCallCount = 0;
    lastMessageReset = now;
  }
  if (messageCallCount >= 10) {
    console.warn('Message rate limit exceeded');
    return;
  }
  messageCallCount++;
  
  // Sanitize input
  if (typeof message !== 'string') {
    message = String(message);
  }
  const sanitizedMessage = message.replace(/[<>"'&]/g, (char) => {
    const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
    return entities[char];
  }).substring(0, 200);
  
  const validTypes = ['info', 'success', 'error'];
  const safeType = validTypes.includes(type) ? type : 'info';
  
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  let messageEl = document.getElementById('user-message');
  if (!messageEl) {
    messageEl = document.createElement('div');
    messageEl.id = 'user-message';
    messageEl.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 10px; border-radius: 4px; z-index: 1000; max-width: 300px; word-wrap: break-word;';
    document.body.appendChild(messageEl);
  }
  
  messageEl.textContent = sanitizedMessage;
  if (isDark) {
    messageEl.style.background = safeType === 'error' ? '#5f2c2c' : safeType === 'success' ? '#2d5a2d' : '#333';
    messageEl.style.borderColor = safeType === 'error' ? '#f44336' : safeType === 'success' ? '#4caf50' : '#666';
    messageEl.style.color = '#fff';
  } else {
    messageEl.style.background = safeType === 'error' ? '#ffebee' : safeType === 'success' ? '#e8f5e8' : '#f0f0f0';
    messageEl.style.borderColor = safeType === 'error' ? '#f44336' : safeType === 'success' ? '#4caf50' : '#ccc';
    messageEl.style.color = '#333';
  }
  messageEl.style.border = '1px solid';
  
  setTimeout(() => {
    if (messageEl && messageEl.parentNode) {
      messageEl.parentNode.removeChild(messageEl);
    }
  }, 3000);
}

// Secure prompt replacement
function securePrompt(message, defaultValue = '') {
  // Authorization check
  if (!isAuthorizedCaller()) {
    console.warn('Unauthorized prompt attempt');
    return Promise.resolve(null);
  }
  
  // Rate limiting - max 5 prompts per 60 seconds
  const now = Date.now();
  if (now - lastPromptReset > 60000) {
    promptCallCount = 0;
    lastPromptReset = now;
  }
  if (promptCallCount >= 5) {
    console.warn('Prompt rate limit exceeded');
    return Promise.resolve(null);
  }
  promptCallCount++;
  
  // Sanitize message input
  if (typeof message !== 'string') {
    message = String(message);
  }
  const sanitizedMessage = message.replace(/[<>"'&]/g, (char) => {
    const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
    return entities[char];
  }).substring(0, 500);
  
  return new Promise((resolve) => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `background: ${isDark ? '#2a2a2a' : 'white'}; color: ${isDark ? '#fff' : '#333'}; padding: 20px; border-radius: 8px; max-width: 400px; width: 90%;`;
    
    const messageEl = document.createElement('p');
    messageEl.textContent = sanitizedMessage;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = defaultValue;
    input.style.cssText = `width: 100%; padding: 8px; margin: 10px 0; border: 1px solid ${isDark ? '#555' : '#ccc'}; border-radius: 4px; background: ${isDark ? '#333' : 'white'}; color: ${isDark ? '#fff' : '#333'};`;
    
    const buttons = document.createElement('div');
    buttons.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end; margin-top: 15px;';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `padding: 8px 16px; border: 1px solid ${isDark ? '#555' : '#ccc'}; background: ${isDark ? '#444' : '#f5f5f5'}; color: ${isDark ? '#fff' : '#333'}; border-radius: 4px; cursor: pointer;`;
    
    const okBtn = document.createElement('button');
    okBtn.textContent = 'OK';
    okBtn.style.cssText = 'padding: 8px 16px; border: none; background: #007cba; color: white; border-radius: 4px; cursor: pointer;';
    
    cancelBtn.onclick = () => { document.body.removeChild(modal); resolve(null); };
    okBtn.onclick = () => { document.body.removeChild(modal); resolve(input.value); };
    
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

// Secure confirm replacement
function secureConfirm(message) {
  // Authorization check
  if (!isAuthorizedCaller()) {
    console.warn('Unauthorized confirm attempt');
    return Promise.resolve(false);
  }
  
  // Rate limiting - max 5 confirms per 60 seconds
  const now = Date.now();
  if (now - lastPromptReset > 60000) {
    promptCallCount = 0;
    lastPromptReset = now;
  }
  if (promptCallCount >= 5) {
    console.warn('Confirm rate limit exceeded');
    return Promise.resolve(false);
  }
  promptCallCount++;
  
  // Sanitize message input
  if (typeof message !== 'string') {
    message = String(message);
  }
  const sanitizedMessage = message.replace(/[<>"'&]/g, (char) => {
    const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
    return entities[char];
  }).substring(0, 500);
  
  return new Promise((resolve) => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `background: ${isDark ? '#2a2a2a' : 'white'}; color: ${isDark ? '#fff' : '#333'}; padding: 20px; border-radius: 8px; max-width: 400px; width: 90%;`;
    
    const messageEl = document.createElement('p');
    messageEl.textContent = sanitizedMessage;
    messageEl.style.whiteSpace = 'pre-line';
    
    const buttons = document.createElement('div');
    buttons.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end; margin-top: 15px;';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `padding: 8px 16px; border: 1px solid ${isDark ? '#555' : '#ccc'}; background: ${isDark ? '#444' : '#f5f5f5'}; color: ${isDark ? '#fff' : '#333'}; border-radius: 4px; cursor: pointer;`;
    
    const okBtn = document.createElement('button');
    okBtn.textContent = 'OK';
    okBtn.style.cssText = 'padding: 8px 16px; border: none; background: #007cba; color: white; border-radius: 4px; cursor: pointer;';
    
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

// Load shared header and footer
async function loadSharedComponents() {
  try {
    // Load header
    const headerResponse = await fetch('./shared/header.html');
    const headerHTML = await headerResponse.text();
    const headerEl = document.getElementById('header-placeholder');
    if (headerEl) headerEl.innerHTML = headerHTML;
    
    // Load footer
    const footerResponse = await fetch('./shared/footer.html');
    const footerHTML = await footerResponse.text();
    const footerEl = document.getElementById('footer-placeholder');
    if (footerEl) footerEl.innerHTML = footerHTML;
    
  } catch (error) {
    if (typeof logger !== 'undefined') {
      logger.error('Error loading shared components:', String(error).replace(/[\r\n\t]/g, ' ').substring(0, 200));
    } else {
      console.error('Error loading shared components:', String(error).replace(/[\r\n\t]/g, ' ').substring(0, 200));
    }
    throw error;
  }
}

// Dark mode toggle function
function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// Load saved theme
function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

// Toggle mobile menu
function toggleMenu() {
  const navMenu = document.getElementById('navMenu');
  if (navMenu) {
    navMenu.classList.toggle('active');
  }
}

// Developer mode toggle
function toggleDeveloperMode() {
  const isDeveloperMode = localStorage.getItem('developerMode') === 'true';
  const newMode = !isDeveloperMode;
  localStorage.setItem('developerMode', newMode);
  applyDeveloperMode(newMode);
  showUserMessage(`Advanced Mode ${newMode ? 'enabled' : 'disabled'}`, 'info');
}

function toggleElementsByClass(className, isDeveloperMode) {
  const elements = document.querySelectorAll(className);
  elements.forEach(element => {
    element.style.display = isDeveloperMode ? '' : 'none';
  });
}

function applyDeveloperMode(isDeveloperMode = null) {
  if (isDeveloperMode === null) {
    isDeveloperMode = localStorage.getItem('developerMode') === 'true';
  }
  
  toggleElementsByClass('.dev-only', isDeveloperMode);
  toggleElementsByClass('.adv-only', isDeveloperMode);
}

function loadDeveloperMode() {
  // Default to developer mode enabled if not set
  const isDeveloperMode = localStorage.getItem('developerMode');
  if (isDeveloperMode === null) {
    localStorage.setItem('developerMode', 'true');
  }
  applyDeveloperMode();
}

// Email management
function checkUserEmail() {
  const email = localStorage.getItem('userEmail');
  if (!email) {
    promptForEmail();
    return false;
  }
  return true;
}

async function promptForEmail() {
  let email;
  do {
    email = await securePrompt('Welcome to AISearch-n-Score!\n\nPlease enter your email address to continue:');
    if (email === null) {
      // User clicked cancel
      showUserMessage('Email is required to use this application.', 'error');
      continue;
    }
    if (email && validateEmail(email)) {
      localStorage.setItem('userEmail', email);
      return true;
    } else if (email) {
      showUserMessage('Please enter a valid email address.', 'error');
    }
  } while (!email || !validateEmail(email));
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function getUserEmail() {
  return localStorage.getItem('userEmail') || '';
}

async function updateUserEmail() {
  const currentEmail = getUserEmail();
  const newEmail = await securePrompt('Enter your email address:', currentEmail);
  if (newEmail !== null && newEmail && validateEmail(newEmail)) {
    localStorage.setItem('userEmail', newEmail);
    showUserMessage('Email updated successfully!', 'success');
  } else if (newEmail) {
    showUserMessage('Please enter a valid email address.', 'error');
  }
}

async function showUserInfo() {
  const email = getUserEmail();
  if (email) {
    const action = await secureConfirm(`Logged in as: ${email}\n\nClick OK to change email, Cancel to close.`);
    if (action) {
      await updateUserEmail();
    }
  } else {
    await updateUserEmail();
  }
}

function setupLoginIcon() {
  const loginIcon = document.querySelector('.login-icon');
  if (loginIcon) {
    loginIcon.addEventListener('click', showUserInfo);
  }
}

// Common score model loading function
async function loadScoreModels(selectElementId) {
  try {
    const response = await fetch('config/models-list.json');
    const data = await response.json();
    const scoreSelect = document.getElementById(selectElementId);
    
    if (!scoreSelect) {
      if (typeof logger !== 'undefined') {
        logger.error('Score select element not found:', String(selectElementId).replace(/[\r\n\t]/g, ' ').substring(0, 200));
      } else {
        console.error('Score select element not found:', String(selectElementId).replace(/[\r\n\t]/g, ' ').substring(0, 200));
      }
      return;
    }
    
    const scoreModels = [...new Set(
      data.models
        .filter(model => model.category === 'score')
        .map(model => model.modelName)
    )].sort();
    
    if (scoreModels.length > 0) {
      const savedScoreModel = localStorage.getItem('selectedScoreModel');
      scoreSelect.innerHTML = scoreModels.map((modelName, index) => {
        const isSelected = savedScoreModel ? modelName === savedScoreModel : index === 0;
        return `<option value="${modelName}" ${isSelected ? 'selected' : ''}>${modelName}</option>`;
      }).join('');
      
      // Remove existing event listeners to prevent duplicates
      const newSelect = scoreSelect.cloneNode(true);
      scoreSelect.parentNode.replaceChild(newSelect, scoreSelect);
      
      // Add single event listener
      newSelect.addEventListener('change', function() {
        localStorage.setItem('selectedScoreModel', this.value);
      });
    } else {
      scoreSelect.innerHTML = '<option value="">No score models available</option>';
    }
  } catch (error) {
    if (typeof logger !== 'undefined') {
      logger.error('Error loading score models:', String(error).replace(/[\r\n\t]/g, ' ').substring(0, 200));
    } else {
      console.error('Error loading score models:', String(error).replace(/[\r\n\t]/g, ' ').substring(0, 200));
    }
    const selectEl = document.getElementById(selectElementId);
    if (selectEl) {
      selectEl.innerHTML = '<option value="">Error loading score models</option>';
    }
  }
}

// Common database export function with retry logic
async function exportToDatabase(result, testCategory = null, testDescription = null, testParams = null, retryCount = 0) {
  const dbData = {
    TestCode: result.testCode || '',
    TestCategory: testCategory || null,
    TestDescription: testDescription || null,
    UserEmail: localStorage.getItem('userEmail') || null,
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
        console.log('CreatedAt formatting:', 'original:', result.createdAt, 'formatted:', formatted, 'length:', formatted.length);
        return formatted;
      } catch (e) {
        console.error('Date formatting error:', e);
        return null;
      }
    })(),
    SourceType: result.sourceType || null,
    SystemPrompt: result.systemPromptName || null,
    Prompt: result.query || null,
    'ModelName-search': result.metrics?.search?.model || null,
    'ModelContextSize-search': result.metrics?.search?.context_size || testParams?.context || null,
    'ModelTemperature-search': result.metrics?.search?.temperature || testParams?.temperature || null,
    'ModelTokenLimit-search': result.metrics?.search?.token_limit !== undefined ? 
      (result.metrics?.search?.token_limit === null ? 'No Limit' : result.metrics.search.token_limit) : 
      (result.tokenLimit === null ? 'No Limit' : result.tokenLimit) || null,
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
    const response = await window.csrfManager.fetch('http://localhost:3001/api/database/save', {
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
    console.error('Full database export error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Retry on connection reset (common on M4 Macs)
    if (error.message && error.message.includes('ECONNRESET') && retryCount < 2) {
      console.log(`Database connection reset, retrying... (attempt ${retryCount + 1})`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return exportToDatabase(result, testCategory, testDescription, testParams, retryCount + 1);
    }
    
    const errorMsg = error.message || error.toString() || 'Unknown database error';
    if (typeof logger !== 'undefined') {
      logger.error('Database export error:', errorMsg);
    } else {
      console.error('Database export error:', errorMsg);
    }
    throw new Error(errorMsg);
  }
}

// Make showUserMessage globally available
if (typeof window !== 'undefined') {
  window.showUserMessage = showUserMessage;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  loadTheme();
  
  // Check email first - block page loading if no email
  if (!checkUserEmail()) {
    // Hide page content until email is provided
    document.body.style.display = 'none';
    return;
  }
  
  loadSharedComponents().then(() => {
    setupLoginIcon();
    loadDeveloperMode();
  });
});