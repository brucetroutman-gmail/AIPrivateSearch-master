import { search, getModels } from './services/api.js';
import { logger } from './shared/utils/logger.js';

// Import showUserMessage from global scope - wait for it to be available
let showUserMessage = function(msg, type) { logger.log(`${type}: ${msg}`); };

// Wait for showUserMessage to be available
document.addEventListener('DOMContentLoaded', () => {
  if (window.showUserMessage) {
    showUserMessage = window.showUserMessage;
  }
});

const form       = document.getElementById('searchForm');
const sourceTypeEl = document.getElementById('sourceType');
const modelEl    = document.getElementById('model');
const assistantTypeEl = document.getElementById('assistantType');
const userPromptsEl = document.getElementById('userPrompts');
const queryEl    = document.getElementById('query');
const scoreTglEl = document.getElementById('scoreToggle');
const temperatureEl = document.getElementById('temperature');
const contextEl  = document.getElementById('context');
const tokensEl   = document.getElementById('tokens');
const outputEl   = document.getElementById('output');
const exportBtn  = document.getElementById('exportBtn');
const autoExportToggle = document.getElementById('autoExportToggle');
const manualExportSection = document.getElementById('manualExportSection');
const collectionEl = document.getElementById('collection');
const collectionSection = document.getElementById('collectionSection');
const vectorDBEl = document.getElementById('vectorDB');
const vectorDBSection = document.getElementById('vectorDBSection');

let systemPrompts = [];

// Utility function to format CreatedAt timestamps
function formatCreatedAt(timestamp) {
  return timestamp ? new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ') : null;
}

// Load collections from API
async function loadCollections() {
  try {
    const response = await fetch('http://localhost:3001/api/documents/collections');
    if (!response.ok) throw new Error('Failed to fetch collections');
    const data = await response.json();
    
    collectionEl.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a collection...';
    collectionEl.appendChild(defaultOption);
    
    data.collections.forEach(collection => {
      const option = document.createElement('option');
      option.value = collection;
      option.textContent = collection;
      collectionEl.appendChild(option);
    });
    
    // Restore last used collection
    const lastUsed = localStorage.getItem('lastCollection');
    if (lastUsed && data.collections.includes(lastUsed)) {
      collectionEl.value = lastUsed;
    }
  } catch (error) {
    collectionEl.innerHTML = '<option value="">Error loading collections</option>';
    // logger sanitizes all inputs to prevent log injection
    logger.error('Failed to load collections:', error);
  }
}

// Load source types from JSON file
async function loadSourceTypes() {
  try {
    const response = await fetch('./config/source-types.json');
    const data = await response.json();
    
    sourceTypeEl.innerHTML = '';
    data.source_types.forEach(source => {
      const option = document.createElement('option');
      option.value = source.name;
      option.textContent = source.name;
      sourceTypeEl.appendChild(option);
    });
    
    // Restore last used selection
    const lastUsed = localStorage.getItem('lastSourceType');
    if (lastUsed && data.source_types.find(s => s.name === lastUsed)) {
      sourceTypeEl.value = lastUsed;
    } else {
      sourceTypeEl.value = data.source_types[0]?.name || '';
    }
    return Promise.resolve();
  } catch (error) {
    sourceTypeEl.innerHTML = '<option value="">Error loading source types</option>';
    // logger sanitizes all inputs to prevent log injection
    logger.error('Failed to load source types:', error);
    return Promise.reject(error);
  }
}

// Load models from models-list.json (search category only)
async function loadModels() {
  try {
    logger.log('Loading models...');
    const response = await fetch('config/models-list.json');
    const data = await response.json();
    
    // Get unique search models
    const searchModels = [...new Set(
      data.models
        .filter(model => model.category === 'search')
        .map(model => model.modelName)
    )].sort();
    
    logger.log('Models received:', searchModels);
    modelEl.innerHTML = '';
    searchModels.forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      modelEl.appendChild(option);
    });
    
    // Restore last used model or set default
    const lastUsedModel = localStorage.getItem('lastUsedModel');
    if (lastUsedModel && searchModels.includes(lastUsedModel)) {
      modelEl.value = lastUsedModel;
    } else if (searchModels.includes('qwen2:0.5b')) {
      modelEl.value = 'qwen2:0.5b';
    } else if (searchModels.length > 0) {
      modelEl.value = searchModels[0];
    }
    logger.log('Models loaded successfully');
  } catch (error) {
    modelEl.innerHTML = '<option value="">Error loading models</option>';
    // logger sanitizes all inputs to prevent log injection
    logger.error('Failed to load models:', error);
  }
}

// Add CSS rule to hide checkbox
const hideCheckboxStyle = document.createElement('style');
hideCheckboxStyle.textContent = '.hide-chunks-checkbox { display: none !important; }';
document.head.appendChild(hideCheckboxStyle);

// Hide checkbox immediately on page load
const showChunksLabel = document.getElementById('showChunksLabel');
const showChunksToggle = document.getElementById('showChunksToggle');
if (showChunksLabel) showChunksLabel.classList.add('hide-chunks-checkbox');
if (showChunksToggle) showChunksToggle.checked = false;

loadSourceTypes().then(() => {
  // Check source type after it's loaded and set checkbox visibility
  const showChunksLabel = document.getElementById('showChunksLabel');
  const showChunksToggle = document.getElementById('showChunksToggle');
  
  if (sourceTypeEl.value === 'Local Documents Only' || sourceTypeEl.value === 'Local Model and Documents') {
    if (showChunksLabel) showChunksLabel.classList.remove('hide-chunks-checkbox');
  } else {
    if (showChunksLabel) showChunksLabel.classList.add('hide-chunks-checkbox');
    if (showChunksToggle) showChunksToggle.checked = false;
  }
  
  // Handle collection/vectorDB sections
  if (sourceTypeEl.value.includes('Docu')) {
    collectionSection.style.display = 'block';
    if (vectorDBSection) vectorDBSection.style.display = 'block';
    loadCollections();
  }
}).catch(() => {
  // Fallback: keep checkbox hidden if source types fail to load
  const showChunksLabel = document.getElementById('showChunksLabel');
  const showChunksToggle = document.getElementById('showChunksToggle');
  if (showChunksLabel) showChunksLabel.classList.add('hide-chunks-checkbox');
  if (showChunksToggle) showChunksToggle.checked = false;
});
loadModels();
loadSystemPrompts();
loadUserPrompts();

loadTokensOptions();
loadTemperatureOptions();
loadContextOptions();
restoreModelOptions();
loadScoreModels('scoreModel');
loadScoringOptions();

// Load temperature options from JSON file
async function loadTemperatureOptions() {
  try {
    const response = await fetch('./config/temperature.json');
    const data = await response.json();
    
    temperatureEl.innerHTML = '';
    data.temperature.forEach(temp => {
      const option = document.createElement('option');
      option.value = temp.value;
      option.textContent = temp.name;
      temperatureEl.appendChild(option);
    });
  } catch (error) {
    // logger sanitizes all inputs to prevent log injection
    logger.error('Failed to load temperature options:', error);
  }
}

// Load context options from JSON file
async function loadContextOptions() {
  try {
    const response = await fetch('./config/context.json');
    const data = await response.json();
    
    contextEl.innerHTML = '';
    data.context.forEach(context => {
      const option = document.createElement('option');
      option.value = context.name;
      option.textContent = context.name;
      contextEl.appendChild(option);
    });
  } catch (error) {
    // logger sanitizes all inputs to prevent log injection
    logger.error('Failed to load context options:', error);
  }
}

// Load vectorDB options from JSON file
async function loadVectorDBOptions() {
  if (!vectorDBEl) return;
  
  try {
    const response = await fetch('./config/vectorDB.json');
    if (!response.ok) throw new Error('Failed to fetch vectorDB options');
    const data = await response.json();
    
    vectorDBEl.innerHTML = '';
    data.vectorDB.forEach(db => {
      const option = document.createElement('option');
      option.value = db.value;
      option.textContent = db.name;
      vectorDBEl.appendChild(option);
    });
    
    // Restore last used selection
    const lastUsed = localStorage.getItem('lastVectorDB');
    if (lastUsed && data.vectorDB.find(db => db.value === lastUsed)) {
      vectorDBEl.value = lastUsed;
    } else {
      vectorDBEl.value = data.vectorDB[0]?.value || 'local';
    }
  } catch (error) {
    vectorDBEl.innerHTML = '<option value="local">Local</option>';
    // logger sanitizes all inputs to prevent log injection
    logger.error('Failed to load vectorDB options:', error);
  }
}
loadVectorDBOptions();

// Load system prompts from JSON file
async function loadSystemPrompts() {
  try {
    const response = await fetch('./config/system-prompts.json');
    const data = await response.json();
    systemPrompts = data.system_prompts;
    
    filterAssistantTypes();
  } catch (error) {
    assistantTypeEl.innerHTML = '<option value="">Error loading system prompts</option>';
    // logger sanitizes all inputs to prevent log injection
    logger.error('Failed to load system prompts:', error);
  }
}

// Filter assistant types based on source type
function filterAssistantTypes() {
  if (!systemPrompts || systemPrompts.length === 0) return;
  
  let filteredPrompts;
  
  if (sourceTypeEl.value === 'Local Documents Only') {
    // Only show "Documents Only" assistant
    filteredPrompts = systemPrompts.filter(prompt => prompt.name === 'Documents Only');
  } else {
    // Show all assistants except "Documents Only"
    filteredPrompts = systemPrompts.filter(prompt => prompt.name !== 'Documents Only');
  }
  
  assistantTypeEl.innerHTML = '';
  filteredPrompts.forEach(prompt => {
    const option = document.createElement('option');
    option.value = prompt.name;
    option.textContent = prompt.name;
    assistantTypeEl.appendChild(option);
  });
  
  // Restore last used selection if still available
  const lastUsed = localStorage.getItem('lastAssistantType');
  if (lastUsed && filteredPrompts.find(p => p.name === lastUsed)) {
    assistantTypeEl.value = lastUsed;
  } else {
    assistantTypeEl.value = filteredPrompts[0]?.name || '';
  }
}

// Load user prompts from JSON file
async function loadUserPrompts() {
  try {
    const response = await fetch('./config/user-prompts.json');
    const data = await response.json();
    
    userPromptsEl.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a prompt...';
    userPromptsEl.appendChild(defaultOption);
    
    data.user_prompts.forEach(prompt => {
      const option = document.createElement('option');
      option.value = prompt.prompt;
      option.textContent = prompt.name;
      userPromptsEl.appendChild(option);
    });
  } catch (error) {
    userPromptsEl.innerHTML = '<option value="">Error loading user prompts</option>';
    // logger sanitizes all inputs to prevent log injection
    logger.error('Failed to load user prompts:', error);
  }
}

// Handle user prompt selection
userPromptsEl.addEventListener('change', () => {
  if (userPromptsEl.value) {
    queryEl.value = userPromptsEl.value;
    localStorage.setItem('lastPrompt', userPromptsEl.value);
  }
});

// Save assistant type selection
assistantTypeEl.addEventListener('change', () => {
  localStorage.setItem('lastAssistantType', assistantTypeEl.value);
});

// Save model selection
modelEl.addEventListener('change', () => {
  localStorage.setItem('lastUsedModel', modelEl.value);
});

// Save temperature selection
temperatureEl.addEventListener('change', () => {
  localStorage.setItem('lastTemperature', temperatureEl.value);
});

// Save context selection
contextEl.addEventListener('change', () => {
  localStorage.setItem('lastContext', contextEl.value);
});

// Save source type selection and handle collection dropdown
sourceTypeEl.addEventListener('change', () => {
  localStorage.setItem('lastSourceType', sourceTypeEl.value);
  
  // Show/hide collection and vectorDB dropdowns based on source type
  if (sourceTypeEl.value.includes('Docu')) {
    collectionSection.style.display = 'block';
    if (vectorDBSection) vectorDBSection.style.display = 'block';
    loadCollections();
  } else {
    collectionSection.style.display = 'none';
    if (vectorDBSection) vectorDBSection.style.display = 'none';
  }
  
  // Show/hide source chunks checkbox only for Local Documents source types
  const showChunksLabel = document.getElementById('showChunksLabel');
  const showChunksToggle = document.getElementById('showChunksToggle');
  
  if (sourceTypeEl.value === 'Local Documents Only' || sourceTypeEl.value === 'Local Model and Documents') {
    if (showChunksLabel) showChunksLabel.classList.remove('hide-chunks-checkbox');
  } else {
    if (showChunksLabel) showChunksLabel.classList.add('hide-chunks-checkbox');
    if (showChunksToggle) showChunksToggle.checked = false;
  }
  
  // Filter assistant types based on source type
  filterAssistantTypes();
});

// Save collection selection
collectionEl.addEventListener('change', () => {
  localStorage.setItem('lastCollection', collectionEl.value);
});

// Save vectorDB selection
if (vectorDBEl) {
  vectorDBEl.addEventListener('change', () => {
    localStorage.setItem('lastVectorDB', vectorDBEl.value);
  });
}

// Show/hide scoring section based on score toggle
scoreTglEl.addEventListener('change', () => {
  const scoringSection = document.getElementById('scoringSection');
  scoringSection.style.display = scoreTglEl.checked ? 'block' : 'none';
  localStorage.setItem('generateScores', scoreTglEl.checked);
});

// Handle auto export toggle
autoExportToggle.addEventListener('change', () => {
  manualExportSection.style.display = autoExportToggle.checked ? 'none' : 'block';
  localStorage.setItem('autoExportToDatabase', autoExportToggle.checked);
});

// Restore auto export setting
const autoExportSetting = localStorage.getItem('autoExportToDatabase');
if (autoExportSetting === 'true') {
  autoExportToggle.checked = true;
  manualExportSection.style.display = 'none';
}

// Restore generate scores setting
const generateScoresSetting = localStorage.getItem('generateScores');
if (generateScoresSetting === 'true') {
  scoreTglEl.checked = true;
  document.getElementById('scoringSection').style.display = 'block';
}

// Restore prompt text after page loads
setTimeout(() => {
  const lastPrompt = localStorage.getItem('lastPrompt');
  if (lastPrompt && queryEl) {
    queryEl.value = lastPrompt;
  }
}, 50);

// Load and populate scoring options
async function loadScoringOptions() {
  try {
    // Load temperature options
    const tempResponse = await fetch('./config/temperature.json');
    const tempData = await tempResponse.json();
    const scoreTemperatureEl = document.getElementById('scoreTemperature');
    scoreTemperatureEl.innerHTML = '';
    tempData.temperature.forEach(temp => {
      const option = document.createElement('option');
      option.value = temp.value;
      option.textContent = temp.name;
      scoreTemperatureEl.appendChild(option);
    });
    
    // Load context options
    const contextResponse = await fetch('./config/context.json');
    const contextData = await contextResponse.json();
    const scoreContextEl = document.getElementById('scoreContext');
    scoreContextEl.innerHTML = '';
    contextData.context.forEach(context => {
      const option = document.createElement('option');
      option.value = context.name;
      option.textContent = context.name;
      scoreContextEl.appendChild(option);
    });
    
    // Load tokens options
    const tokensResponse = await fetch('./config/tokens.json');
    const tokensData = await tokensResponse.json();
    const scoreTokensEl = document.getElementById('scoreTokens');
    scoreTokensEl.innerHTML = '';
    tokensData.tokens.forEach(token => {
      const option = document.createElement('option');
      option.value = token.name;
      option.textContent = token.name;
      scoreTokensEl.appendChild(option);
    });
    
    // Restore saved values
    const lastScoreTemp = localStorage.getItem('lastScoreTemperature');
    if (lastScoreTemp) scoreTemperatureEl.value = lastScoreTemp;
    
    const lastScoreContext = localStorage.getItem('lastScoreContext');
    if (lastScoreContext) scoreContextEl.value = lastScoreContext;
    
    const lastScoreTokens = localStorage.getItem('lastScoreTokens');
    if (lastScoreTokens) scoreTokensEl.value = lastScoreTokens;
    
    // Add event listeners for persistence
    scoreTemperatureEl.addEventListener('change', () => {
      localStorage.setItem('lastScoreTemperature', scoreTemperatureEl.value);
    });
    
    scoreContextEl.addEventListener('change', () => {
      localStorage.setItem('lastScoreContext', scoreContextEl.value);
    });
    
    scoreTokensEl.addEventListener('change', () => {
      // Sanitize value before storing to prevent XSS
      const sanitizedValue = scoreTokensEl.value.replace(/[<>"'&]/g, '');
      localStorage.setItem('lastScoreTokens', sanitizedValue);
    });
    
  } catch (error) {
    // logger sanitizes all inputs to prevent log injection
    logger.error('Failed to load scoring options:', error);
  }
}



// Save tokens selection
tokensEl.addEventListener('change', () => {
  localStorage.setItem('lastTokens', tokensEl.value);
});

// Save prompt text
queryEl.addEventListener('input', () => {
  localStorage.setItem('lastPrompt', queryEl.value);
});



// Load tokens options from JSON file
async function loadTokensOptions() {
  try {
    const response = await fetch('./config/tokens.json');
    if (!response.ok) throw new Error('Failed to fetch tokens');
    const data = await response.json();
    
    tokensEl.innerHTML = '';
    data.tokens.forEach(token => {
      const option = document.createElement('option');
      option.value = token.name;
      option.textContent = token.name;
      tokensEl.appendChild(option);
    });
    
    // Restore last used selection
    const lastUsed = localStorage.getItem('lastTokens');
    if (lastUsed && data.tokens.find(t => t.name === lastUsed)) {
      tokensEl.value = lastUsed;
    } else {
      tokensEl.value = data.tokens[0]?.name || '';
    }
  } catch (error) {
    tokensEl.innerHTML = '<option value="">Error loading tokens</option>';
    // logger sanitizes all inputs to prevent log injection
    logger.error('Failed to load tokens options:', error);
  }
}

// Generate TestCode based on current form selections
function generateTestCode() {
  // Position 1: 't' (fixed)
  let testCode = 't';
  
  // Position 2: Source Type (1-3)
  const sourceTypeMap = {
    'Local Model Only': '1',
    'Local Documents Only': '2', 
    'Local Model and Documents': '3'
  };
  testCode += sourceTypeMap[sourceTypeEl.value] || '1';
  
  // Position 3: Assistant Type (1-5)
  const assistantTypeMap = {
    'Simple Assistant': '1',
    'Detailed Assistant': '2',
    'Reasoned Assistant': '3',
    'Creative Assistant': '4',
    'Coding Assistant': '5'
  };
  testCode += assistantTypeMap[assistantTypeEl.value] || '1';
  
  // Position 4: User Prompts (1-5) - default to 1
  let userPromptCode = '1';
  if (systemPrompts && systemPrompts.length > 0) {
    const userPromptMap = {
      'KNOWLEDGE-Quantum': '1',
      'REASON-AI-adopt': '2',
      'CREATE-AI-dialog': '3',
      'CODE-Pseudo': '4',
      'INSTRUCT-Fix wifi': '5'
    };
    // Check if query matches any template
    for (const [key, value] of Object.entries(userPromptMap)) {
      const template = systemPrompts.find(p => p.name === key);
      if (template && queryEl.value && queryEl.value.includes(template.prompt.substring(0, 20))) {
        userPromptCode = value;
        break;
      }
    }
  }
  testCode += userPromptCode;
  
  // Position 5: Temperature (1-3)
  const tempValue = parseFloat(temperatureEl.value);
  const tempCode = tempValue === 0.3 ? '1' : tempValue === 0.6 ? '2' : '3';
  testCode += tempCode;
  
  // Position 6: Context (1-4)
  const contextValue = parseInt(contextEl.value);
  const contextCode = contextValue === 2048 ? '1' : contextValue === 4096 ? '2' : contextValue === 8192 ? '3' : '4';
  testCode += contextCode;
  
  // Position 7: Tokens (1-3)
  const tokenMap = {
    'No Limit': '1',
    '250': '2',
    '500': '3'
  };
  testCode += tokenMap[tokensEl.value] || '1';
  
  // Position 8: Generate Scores (0-1)
  testCode += scoreTglEl.checked ? '1' : '0';
  
  return testCode;
}

// Restore model options from localStorage
function restoreModelOptions() {
  const lastTemperature = localStorage.getItem('lastTemperature');
  if (lastTemperature) {
    temperatureEl.value = lastTemperature;
  }
  
  const lastContext = localStorage.getItem('lastContext');
  if (lastContext) {
    contextEl.value = lastContext;
  }
  
  const lastTokens = localStorage.getItem('lastTokens');
  if (lastTokens) {
    tokensEl.value = lastTokens;
  }
}

function formatMetrics(metrics) {
  if (!metrics) return 'N/A';
  
  const totalSecs = (metrics.total_duration / 1000000000).toFixed(1);
  const loadMs = (metrics.load_duration / 1000000).toFixed(0);
  const tokensPerSec = (metrics.eval_count / (metrics.eval_duration / 1000000000)).toFixed(1);
  const contextSize = metrics.context_size || 'N/A';
  const temperature = metrics.temperature || 'N/A';
  
  return `${metrics.model} - Duration: ${totalSecs}s, Load: ${loadMs}ms, Eval: ${tokensPerSec} tokens/sec, ContextSize: ${contextSize}, Temperature: ${temperature}`;
}

function render(result) {
  // clear then build markup
  outputEl.innerHTML = '';
  
  // Store result for export
  window.currentResult = result;

  // 1. the raw answer
  const answerH = document.createElement('h3');
  answerH.textContent = 'Answer';
  const answerP = document.createElement('p');
  answerP.textContent = result.response;
  outputEl.append(answerH, answerP);

  // 2. (optional) scores
  if (result.scores) {
    const s = result.scores;

    const scoresH = document.createElement('h3');
    scoresH.textContent = 'Scores (3-Better 2-Good 1-Poor)';
    outputEl.append(scoresH);

    const tbl = document.createElement('table');
    tbl.className = 'score-table';
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Criterion', 'Score'].forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    
    const tbody = document.createElement('tbody');
    [['Accuracy', s.accuracy ?? '-'],
     ['Relevance', s.relevance ?? '-'],
     ['Organization', s.organization ?? '-'],
     ['Weighted Score', s.total ? s.total + '%' : '-']].forEach(([criterion, score]) => {
      const row = document.createElement('tr');
      [criterion, score].forEach(text => {
        const td = document.createElement('td');
        td.textContent = text;
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
    
    tbl.appendChild(thead);
    tbl.appendChild(tbody);
    outputEl.append(tbl);

    if (s.overallComments) {
      const comH = document.createElement('h4');
      comH.textContent = 'Overall Comments';
      const comP = document.createElement('p');
      comP.textContent = s.overallComments;
      outputEl.append(comH, comP);
    }
  }

  // 3. metrics
  if (result.metrics) {
    const metricsH = document.createElement('h3');
    metricsH.textContent = 'Performance Metrics';
    outputEl.append(metricsH);

    const tbl = document.createElement('table');
    tbl.className = 'score-table';
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Operation', 'Model', 'Duration', 'Load', 'Tokens', 'Eval Rate', 'Context', 'Temperature'].forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    
    const tbody = document.createElement('tbody');
    
    if (result.metrics.search) {
      const m = result.metrics.search;
      const totalSecs = (m.total_duration / 1000000000).toFixed(1);
      const loadMs = (m.load_duration / 1000000).toFixed(0);
      const tokensPerSec = (m.eval_count / (m.eval_duration / 1000000000)).toFixed(1);
      const row = document.createElement('tr');
      ['Search', m.model, totalSecs + 's', loadMs + 'ms', m.eval_count || 0, tokensPerSec + ' t/s', m.context_size, m.temperature].forEach(text => {
        const td = document.createElement('td');
        td.textContent = text;
        row.appendChild(td);
      });
      tbody.appendChild(row);
    }

    if (result.metrics.scoring) {
      const m = result.metrics.scoring;
      const totalSecs = (m.total_duration / 1000000000).toFixed(1);
      const loadMs = (m.load_duration / 1000000).toFixed(0);
      const tokensPerSec = (m.eval_count / (m.eval_duration / 1000000000)).toFixed(1);
      const row = document.createElement('tr');
      ['Scoring', m.model, totalSecs + 's', loadMs + 'ms', m.eval_count || 0, tokensPerSec + ' t/s', m.context_size, m.temperature].forEach(text => {
        const td = document.createElement('td');
        td.textContent = text;
        row.appendChild(td);
      });
      tbody.appendChild(row);
    }

    if (result.metrics.scoringRetry) {
      const m = result.metrics.scoringRetry;
      const totalSecs = (m.total_duration / 1000000000).toFixed(1);
      const loadMs = (m.load_duration / 1000000).toFixed(0);
      const tokensPerSec = (m.eval_count / (m.eval_duration / 1000000000)).toFixed(1);
      const row = document.createElement('tr');
      ['Scoring Retry', m.model, totalSecs + 's', loadMs + 'ms', m.eval_count || 0, tokensPerSec + ' t/s', m.context_size, m.temperature].forEach(text => {
        const td = document.createElement('td');
        td.textContent = text;
        row.appendChild(td);
      });
      tbody.appendChild(row);
    }
    
    tbl.appendChild(thead);
    tbl.appendChild(tbody);
    outputEl.append(tbl);
  }

  // 4. system info table
  if (result.pcCode || result.systemInfo) {
    const systemH = document.createElement('h3');
    systemH.textContent = 'System Information';
    outputEl.append(systemH);

    const sysTbl = document.createElement('table');
    sysTbl.className = 'score-table';
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['PcCode', 'CPU', 'Graphics', 'RAM', 'OS'].forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    
    const tbody = document.createElement('tbody');
    const dataRow = document.createElement('tr');
    [result.pcCode || 'Unknown', result.systemInfo?.chip || 'Unknown', result.systemInfo?.graphics || 'Unknown', result.systemInfo?.ram || 'Unknown', result.systemInfo?.os || 'Unknown'].forEach(text => {
      const td = document.createElement('td');
      td.textContent = text;
      dataRow.appendChild(td);
    });
    tbody.appendChild(dataRow);
    
    sysTbl.appendChild(thead);
    sysTbl.appendChild(tbody);
    outputEl.append(sysTbl);
  }

  // 5. created at, test code, and execution time
  const meta = document.createElement('p');
  meta.style.fontSize = '.8rem';
  meta.style.color = 'var(--text-color)';
  meta.textContent = `CreatedAt: ${formatCreatedAt(result.createdAt)} | Test Code: ${result.testCode || 'N/A'}${result.executionTime ? ` | Time: ${result.executionTime}` : ''}`;
  outputEl.append(meta);

  // 6. Add export section at the end
  const exportDiv = document.createElement('div');
  exportDiv.style.cssText = 'margin-top: 1.5rem; padding: 1rem; background: var(--input-bg); border-radius: 6px; border: 1px solid var(--border-color);';
  
  const innerDiv = document.createElement('div');
  innerDiv.style.cssText = 'display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;';
  
  const label = document.createElement('label');
  label.setAttribute('for', 'exportFormat');
  label.style.cssText = 'margin: 0; font-weight: 600;';
  label.textContent = 'Export to:';
  
  const select = document.createElement('select');
  select.id = 'exportFormat';
  select.style.cssText = 'background: var(--input-bg); color: var(--text-color); border: 1px solid var(--border-color); padding: 0.5rem; border-radius: 4px;';
  ['pdf', 'markdown', 'json', 'database'].forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value === 'pdf' ? 'Printer/PDF' : value.charAt(0).toUpperCase() + value.slice(1);
    select.appendChild(option);
  });
  
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'exportBtn';
  button.style.cssText = 'background: #3498db; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;';
  button.textContent = 'Export';
  
  innerDiv.appendChild(label);
  innerDiv.appendChild(select);
  innerDiv.appendChild(button);
  exportDiv.appendChild(innerDiv);
  outputEl.append(exportDiv);
  
  // Add event listener to the new export button
  const newExportBtn = exportDiv.querySelector('#exportBtn');
  newExportBtn.addEventListener('click', handleExport);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Check authorization - require email for access
  const userEmail = localStorage.getItem('userEmail');
  if (!userEmail || userEmail.trim() === '') {
    outputEl.textContent = 'Please provide your email address to use this service.';
    return;
  }
  
  if (!modelEl.value) {
    outputEl.textContent = 'Please select a model first.';
    return;
  }
  
  if (scoreTglEl.checked && !document.getElementById('scoreModel').value) {
    outputEl.textContent = 'Please select a score model when scoring is enabled.';
    return;
  }
  
  // Start timing
  const startTime = Date.now();
  
  // Disable submit button to prevent multiple runs
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Processing...';
  submitBtn.classList.add('processing-button');
  
  let progressMessages = [];
  
  function updateProgress(message) {
    progressMessages.push(message);
    outputEl.textContent = progressMessages.join(' → ') + '...';
  }
  
  updateProgress('Loading');

  try {
    // Get selected system prompt
    const selectedPrompt = systemPrompts.find(p => p.name === assistantTypeEl.value);
    const systemPrompt = selectedPrompt ? selectedPrompt.prompt : null;
    const systemPromptName = selectedPrompt ? selectedPrompt.name : null;
    
    // Get token limit
    const tokenLimit = tokensEl.value === 'No Limit' ? null : 
                      tokensEl.value === '250' ? 250 : 
                      tokensEl.value === '500' ? 500 : null;
    
    // Generate TestCode
    const testCode = generateTestCode();
    
    // Get collection if Local Documents source type is selected
    const collection = (sourceTypeEl.value.includes('Docu')) ? collectionEl.value : null;
    const showChunks = document.getElementById('showChunksToggle').checked;
    const scoreModel = scoreTglEl.checked ? document.getElementById('scoreModel').value : null;
    const vectorDB = (sourceTypeEl.value.includes('Docu') && vectorDBEl) ? vectorDBEl.value : 'local';
    
    // Validate collection selection for local documents
    if (sourceTypeEl.value.includes('Docu') && !collection) {
      outputEl.textContent = 'Please select a collection for local document search.';
      return;
    }
    
    updateProgress('Searching');
    const result = await search(queryEl.value, scoreTglEl.checked, modelEl.value, parseFloat(temperatureEl.value), parseFloat(contextEl.value), systemPrompt, systemPromptName, tokenLimit, sourceTypeEl.value, testCode, collection, showChunks, scoreModel, vectorDB);
    
    // Show scoring phase if scores were generated
    if (result.scores) {
      updateProgress('Scoring');
    }
    
    // Calculate execution time
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    const minutes = Math.floor(executionTime / 60000);
    const seconds = Math.floor((executionTime % 60000) / 1000);
    const formattedTime = `${minutes.toString().padStart(2, '0')}.${seconds.toString().padStart(2, '0')}`;
    
    // Add execution time to result
    result.executionTime = formattedTime;
    
    render(result);
    
    // Auto export to database if enabled
    if (autoExportToggle.checked) {
      try {
        const exportResult = await exportToDatabase(window.currentResult, null, null, null);
        logger.log('Auto-exported to database with ID:', exportResult.insertId);
        showUserMessage(`Auto-saved to database (ID: ${exportResult.insertId})`, 'success');
      } catch (error) {
        // logger sanitizes all inputs to prevent log injection
      logger.error('Auto-export failed:', error);
        showUserMessage(`Auto-save failed: ${error.message}`, 'error');
      }
    }
    
    // Export section is now part of the answer
  } catch (err) {
    outputEl.textContent = err.message;
    // logger sanitizes all inputs to prevent log injection
    logger.error(err);
  } finally {
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    submitBtn.classList.remove('processing-button');
  }
});

// Use the shared exportToDatabase function from common.js
// (function is already available globally)

// Add event listener for export button
// Export handler function
async function handleExport() {
  // Check authorization - require email for export access
  const userEmail = localStorage.getItem('userEmail');
  if (!userEmail || userEmail.trim() === '') {
    logger.warn('Export blocked: No email provided');
    outputEl.textContent = 'Please provide your email address to export results.';
    return;
  }
  
  const exportFormat = document.getElementById('exportFormat').value;
  
  if (!window.currentResult) {
    logger.warn('Export blocked: No results available');
    outputEl.textContent = 'No results available to export.';
    return;
  }
  
  const createdAt = new Date(window.currentResult.createdAt);
  const filename = `AISearch-${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}-${String(createdAt.getHours()).padStart(2, '0')}-${String(createdAt.getMinutes()).padStart(2, '0')}-${String(createdAt.getSeconds()).padStart(2, '0')}`;
  
  if (exportFormat === 'pdf') {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    // Sanitize content by creating a temporary element and using textContent
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = outputEl.innerHTML;
    const sanitizedContent = tempDiv.textContent || tempDiv.innerText || '';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>AI Search Results</title>
          <style>
            body { font-family: system-ui, sans-serif; margin: 2rem; white-space: pre-wrap; }
            h1 { margin-top: 1rem; }
          </style>
        </head>
        <body>
          <h1>AI Search Results</h1>
          <pre>${sanitizedContent}</pre>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  } else if (exportFormat === 'markdown') {
    // Generate markdown content
    const result = window.currentResult;
    let markdown = `# AI Search Results\n\n`;
    markdown += `**Query:** ${result.query}\n\n`;
    markdown += `## Answer\n\n${result.response}\n\n`;
    
    if (result.scores) {
      const s = result.scores;
      markdown += `## Scores\n\n`;
      markdown += `| Criterion | Score |\n`;
      markdown += `|-----------|-------|\n`;
      markdown += `| Accuracy | ${s.accuracy ?? '-'} |\n`;
      markdown += `| Relevance | ${s.relevance ?? '-'} |\n`;
      markdown += `| Organization | ${s.organization ?? '-'} |\n`;
      markdown += `| **Weighted Score** | **${s.total ? s.total + '%' : '-'}** |\n\n`;
      
      if (s.overallComments) {
        markdown += `### Overall Comments\n\n${s.overallComments}\n\n`;
      }
    }
    
    markdown += `## Performance Metrics\n\n`;
    markdown += `| Operation | Model | Duration | Load | Eval Rate | Context | Temperature |\n`;
    markdown += `|-----------|-------|----------|------|-----------|---------|-------------|\n`;
    
    if (result.metrics.search) {
      const m = result.metrics.search;
      const totalSecs = (m.total_duration / 1000000000).toFixed(1);
      const loadMs = (m.load_duration / 1000000).toFixed(0);
      const tokensPerSec = (m.eval_count / (m.eval_duration / 1000000000)).toFixed(1);
      markdown += `| Search | ${m.model} | ${totalSecs}s | ${loadMs}ms | ${tokensPerSec} t/s | ${m.context_size} | ${m.temperature} |\n`;
    }
    
    if (result.metrics.scoring) {
      const m = result.metrics.scoring;
      const totalSecs = (m.total_duration / 1000000000).toFixed(1);
      const loadMs = (m.load_duration / 1000000).toFixed(0);
      const tokensPerSec = (m.eval_count / (m.eval_duration / 1000000000)).toFixed(1);
      markdown += `| Scoring | ${m.model} | ${totalSecs}s | ${loadMs}ms | ${tokensPerSec} t/s | ${m.context_size} | ${m.temperature} |\n`;
    }
    
    markdown += `\n## System Information\n\n`;
    markdown += `| PcCode | CPU | Graphics | RAM | OS |\n`;
    markdown += `|--------|-----|----------|-----|----| \n`;
    markdown += `| ${result.pcCode || 'Unknown'} | ${result.systemInfo?.chip || 'Unknown'} | ${result.systemInfo?.graphics || 'Unknown'} | ${result.systemInfo?.ram || 'Unknown'} | ${result.systemInfo?.os || 'Unknown'} |\n\n`;
    
    markdown += `**CreatedAt:** ${formatCreatedAt(result.createdAt)}\n`;
    
    // Download markdown file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else if (exportFormat === 'json') {
    // Export as JSON with MySQL database field names
    const result = window.currentResult;
    const jsonData = {
      TestCode: result.testCode || '',
      TestCategory: null,
      TestDescription: null,
      UserEmail: localStorage.getItem('userEmail') || null,
      PcCode: result.pcCode || null,
      PcCPU: result.systemInfo?.chip || null,
      PcGraphics: result.systemInfo?.graphics || null,
      PcRAM: result.systemInfo?.ram || null,
      PcOS: result.systemInfo?.os || null,
      CreatedAt: formatCreatedAt(result.createdAt),
      SourceType: result.sourceType || null,
      CollectionName: (result.sourceType === 'Local Documents Only' || result.sourceType === 'Local Model and Documents') ? result.collection : null,
      SystemPrompt: result.systemPromptName || null,
      Prompt: result.query || null,
      'ModelName-search': result.metrics?.search?.model || null,
      'ModelContextSize-search': result.metrics?.search?.context_size || null,
      'ModelTemperature-search': result.metrics?.search?.temperature || null,
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
    
    const jsonContent = JSON.stringify(jsonData, null, 2);
    
    // Download JSON file
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else if (exportFormat === 'database') {
    // Export to database using common function
    try {
      const result = await exportToDatabase(window.currentResult, null, null, null);
      logger.log(`Successfully saved to database with ID: ${result.insertId}`);
      showUserMessage(`Successfully saved to database (ID: ${result.insertId})`, 'success');
    } catch (error) {
      // logger sanitizes all inputs to prevent log injection
      logger.error('Database save error:', error.message);
      showUserMessage(`Database save failed: ${error.message}`, 'error');
    }
  }
}

// Add event listener for export button (if it exists in DOM)
if (exportBtn) {
  exportBtn.addEventListener('click', handleExport);
}
