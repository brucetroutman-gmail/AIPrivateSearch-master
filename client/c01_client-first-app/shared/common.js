// Load shared header and footer
async function loadSharedComponents() {
  try {
    // Load header
    const headerResponse = await fetch('./shared/header.html');
    const headerHTML = await headerResponse.text();
    document.getElementById('header-placeholder').innerHTML = headerHTML;
    
    // Load footer
    const footerResponse = await fetch('./shared/footer.html');
    const footerHTML = await footerResponse.text();
    document.getElementById('footer-placeholder').innerHTML = footerHTML;
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error loading shared components:', error);
    return Promise.reject(error);
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
  navMenu.classList.toggle('active');
}

// Email management
function checkUserEmail() {
  const email = localStorage.getItem('userEmail');
  if (!email) {
    promptForEmail();
  }
}

function promptForEmail() {
  const email = prompt('Welcome to AISearch-n-Score!\n\nPlease enter your email address for export functionality:');
  if (email && validateEmail(email)) {
    localStorage.setItem('userEmail', email);
  } else if (email) {
    alert('Please enter a valid email address.');
    promptForEmail();
  }
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function getUserEmail() {
  return localStorage.getItem('userEmail') || '';
}

function updateUserEmail() {
  const currentEmail = getUserEmail();
  const newEmail = prompt('Enter your email address:', currentEmail);
  if (newEmail && validateEmail(newEmail)) {
    localStorage.setItem('userEmail', newEmail);
    alert('Email updated successfully!');
  } else if (newEmail) {
    alert('Please enter a valid email address.');
  }
}

function showUserInfo() {
  const email = getUserEmail();
  if (email) {
    const action = confirm(`Logged in as: ${email}\n\nClick OK to change email, Cancel to close.`);
    if (action) {
      updateUserEmail();
    }
  } else {
    updateUserEmail();
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
      
      // Save selection on change
      scoreSelect.addEventListener('change', function() {
        localStorage.setItem('selectedScoreModel', this.value);
      });
    } else {
      scoreSelect.innerHTML = '<option value="">No score models available</option>';
    }
  } catch (error) {
    console.error('Error loading score models:', error);
    document.getElementById(selectElementId).innerHTML = '<option value="">Error loading score models</option>';
  }
}

// Common database export function
async function exportToDatabase(result, testCategory = null, testDescription = null, testParams = null) {
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
    CreatedAt: result.createdAt ? new Date(result.createdAt).toLocaleString('sv-SE').replace('T', ' ') : null,
    SourceType: result.sourceType || null,
    SystemPrompt: result.systemPromptName || null,
    Prompt: result.query || null,
    'ModelName-search': result.metrics?.search?.model || null,
    'ModelContextSize-search': result.metrics?.search?.context_size || testParams?.context || null,
    'ModelTemperature-search': result.metrics?.search?.temperature || testParams?.temperature || null,
    'ModelTokenLimit-search': result.tokenLimit || null,
    'Duration-search-s': result.metrics?.search ? (result.metrics.search.total_duration / 1000000000) : null,
    'Load-search-ms': result.metrics?.search ? Math.round(result.metrics.search.load_duration / 1000000) : null,
    'EvalTokensPerSecond-ssearch': result.metrics?.search ? (result.metrics.search.eval_count / (result.metrics.search.eval_duration / 1000000000)) : null,
    'Answer-search': result.response || null,
    'ModelName-score': result.metrics?.scoring?.model || null,
    'ModelContextSize-score': result.metrics?.scoring?.context_size || null,
    'ModelTemperature-score': result.metrics?.scoring?.temperature || null,
    'Duration-score-s': result.metrics?.scoring ? (result.metrics.scoring.total_duration / 1000000000) : null,
    'Load-score-ms': result.metrics?.scoring ? Math.round(result.metrics.scoring.load_duration / 1000000) : null,
    'EvalTokensPerSecond-score': result.metrics?.scoring ? (result.metrics.scoring.eval_count / (result.metrics.scoring.eval_duration / 1000000000)) : null,
    AccurateScore: result.scores?.accuracy || null,
    RelevantScore: result.scores?.relevance || null,
    OrganizedScore: result.scores?.organization || null,
    'WeightedScore-pct': result.scores?.total || null
  };
  
  try {
    const response = await fetch('http://localhost:3001/api/database/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbData)
    });
    
    const saveResult = await response.json();
    
    if (saveResult.success) {
      return { success: true, insertId: saveResult.insertId };
    } else {
      throw new Error(saveResult.error);
    }
  } catch (error) {
    console.error('Database export error:', error);
    throw error;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  loadTheme();
  loadSharedComponents().then(() => {
    setupLoginIcon();
  });
  checkUserEmail();
});