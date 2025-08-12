import { search, getModels } from './services/api.js';

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

let systemPrompts = [];

// Load source types from JSON file
async function loadSourceTypes() {
  try {
    const response = await fetch('./config/source-types.json');
    const data = await response.json();
    
    sourceTypeEl.innerHTML = data.source_types.map(source => 
      `<option value="${source.name}">${source.name}</option>`
    ).join('');
    
    // Restore last used selection
    const lastUsed = localStorage.getItem('lastSourceType');
    if (lastUsed && data.source_types.find(s => s.name === lastUsed)) {
      sourceTypeEl.value = lastUsed;
    } else {
      sourceTypeEl.value = data.source_types[0]?.name || '';
    }
  } catch (error) {
    sourceTypeEl.innerHTML = '<option value="">Error loading source types</option>';
    console.error('Failed to load source types:', error);
  }
}

// Load models on page load
async function loadModels() {
  try {
    console.log('Loading models...');
    const { models } = await getModels();
    console.log('Models received:', models);
    modelEl.innerHTML = models.map(model => 
      `<option value="${model}">${model}</option>`
    ).join('');
    
    // Restore last used model or set default
    const lastUsedModel = localStorage.getItem('lastUsedModel');
    if (lastUsedModel && models.includes(lastUsedModel)) {
      modelEl.value = lastUsedModel;
    } else if (models.includes('qwen2:0.5b')) {
      modelEl.value = 'qwen2:0.5b';
    }
    console.log('Models loaded successfully');
  } catch (error) {
    modelEl.innerHTML = '<option value="">Error loading models</option>';
    console.error('Failed to load models:', error);
  }
}

loadSourceTypes();
loadModels();
loadSystemPrompts();
loadUserPrompts();
loadTemperatureOptions();
loadContextOptions();
loadTokensOptions();
restoreModelOptions();

// Load system prompts from JSON file
async function loadSystemPrompts() {
  try {
    const response = await fetch('./config/system-prompts.json');
    const data = await response.json();
    systemPrompts = data.system_prompts;
    
    assistantTypeEl.innerHTML = systemPrompts.map(prompt => 
      `<option value="${prompt.name}">${prompt.name}</option>`
    ).join('');
    
    // Restore last used selection
    const lastUsed = localStorage.getItem('lastAssistantType');
    if (lastUsed && systemPrompts.find(p => p.name === lastUsed)) {
      assistantTypeEl.value = lastUsed;
    } else {
      assistantTypeEl.value = systemPrompts[0]?.name || '';
    }
  } catch (error) {
    assistantTypeEl.innerHTML = '<option value="">Error loading system prompts</option>';
    console.error('Failed to load system prompts:', error);
  }
}

// Load user prompts from JSON file
async function loadUserPrompts() {
  try {
    const response = await fetch('./config/user-prompts.json');
    const data = await response.json();
    
    userPromptsEl.innerHTML = '<option value="">Select a prompt...</option>' + 
      data.user_prompts.map(prompt => 
        `<option value="${prompt.prompt}">${prompt.name}</option>`
      ).join('');
  } catch (error) {
    userPromptsEl.innerHTML = '<option value="">Error loading user prompts</option>';
    console.error('Failed to load user prompts:', error);
  }
}

// Handle user prompt selection
userPromptsEl.addEventListener('change', () => {
  if (userPromptsEl.value) {
    queryEl.value = userPromptsEl.value;
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

// Save source type selection
sourceTypeEl.addEventListener('change', () => {
  localStorage.setItem('lastSourceType', sourceTypeEl.value);
});

// Save tokens selection
tokensEl.addEventListener('change', () => {
  localStorage.setItem('lastTokens', tokensEl.value);
});

// Load temperature options from JSON file
async function loadTemperatureOptions() {
  try {
    const response = await fetch('./config/temperature.json');
    const data = await response.json();
    
    temperatureEl.innerHTML = data.temperature.map(temp => 
      `<option value="${temp.value}">${temp.name}</option>`
    ).join('');
  } catch (error) {
    console.error('Failed to load temperature options:', error);
  }
}

// Load context options from JSON file
async function loadContextOptions() {
  try {
    const response = await fetch('./config/context.json');
    const data = await response.json();
    
    contextEl.innerHTML = data.context.map(context => 
      `<option value="${context.name}">${context.name}</option>`
    ).join('');
  } catch (error) {
    console.error('Failed to load context options:', error);
  }
}

// Load tokens options from JSON file
async function loadTokensOptions() {
  try {
    const response = await fetch('./config/tokens.json');
    const data = await response.json();
    
    tokensEl.innerHTML = data.tokens.map(token => 
      `<option value="${token.name}">${token.name}</option>`
    ).join('');
    
    // Restore last used selection
    const lastUsed = localStorage.getItem('lastTokens');
    if (lastUsed && data.tokens.find(t => t.name === lastUsed)) {
      tokensEl.value = lastUsed;
    } else {
      tokensEl.value = data.tokens[0]?.name || '';
    }
  } catch (error) {
    tokensEl.innerHTML = '<option value="">Error loading tokens</option>';
    console.error('Failed to load tokens options:', error);
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
  
  // Position 4: User Prompts (1-5)
  const userPromptMap = {
    'KNOWLEDGE-Quantum': '1',
    'REASON-AI-adopt': '2',
    'CREATE-AI-dialog': '3',
    'CODE-Pseudo': '4',
    'INSTRUCT-Fix wifi': '5'
  };
  // Check if query matches any template, default to 1
  let userPromptCode = '1';
  for (const [key, value] of Object.entries(userPromptMap)) {
    const template = systemPrompts.find(p => p.name === key);
    if (template && queryEl.value.includes(template.prompt.substring(0, 20))) {
      userPromptCode = value;
      break;
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
    scoresH.textContent = 'Scores';
    outputEl.append(scoresH);

    const tbl = document.createElement('table');
    tbl.className = 'score-table';
    tbl.innerHTML = `
      <thead>
        <tr><th>Criterion</th><th>Score (1-5)</th><th>Justification</th></tr>
      </thead>
      <tbody>
        <tr><td>Accuracy</td><td>${s.accuracy ?? '-'}</td><td>${s.justifications.accuracy}</td></tr>
        <tr><td>Relevance</td><td>${s.relevance ?? '-'}</td><td>${s.justifications.relevance}</td></tr>
        <tr><td>Organization</td><td>${s.organization ?? '-'}</td><td>${s.justifications.organization}</td></tr>
        <tr><td><strong>Weighted Score</strong></td><td><strong>${s.total ? s.total + '%' : '-'}</strong></td><td></td></tr>
      </tbody>
    `;
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
    let tableHTML = `
      <thead>
        <tr><th>Operation</th><th>Model</th><th>Duration</th><th>Load</th><th>Tokens</th><th>Eval Rate</th><th>Context</th><th>Temperature</th></tr>
      </thead>
      <tbody>`;

    if (result.metrics.search) {
      const m = result.metrics.search;
      const totalSecs = (m.total_duration / 1000000000).toFixed(1);
      const loadMs = (m.load_duration / 1000000).toFixed(0);
      const tokensPerSec = (m.eval_count / (m.eval_duration / 1000000000)).toFixed(1);
      tableHTML += `<tr><td>Search</td><td>${m.model}</td><td>${totalSecs}s</td><td>${loadMs}ms</td><td>${m.eval_count || 0}</td><td>${tokensPerSec} t/s</td><td>${m.context_size}</td><td>${m.temperature}</td></tr>`;
    }

    if (result.metrics.scoring) {
      const m = result.metrics.scoring;
      const totalSecs = (m.total_duration / 1000000000).toFixed(1);
      const loadMs = (m.load_duration / 1000000).toFixed(0);
      const tokensPerSec = (m.eval_count / (m.eval_duration / 1000000000)).toFixed(1);
      tableHTML += `<tr><td>Scoring</td><td>${m.model}</td><td>${totalSecs}s</td><td>${loadMs}ms</td><td>${m.eval_count || 0}</td><td>${tokensPerSec} t/s</td><td>${m.context_size}</td><td>${m.temperature}</td></tr>`;
    }

    if (result.metrics.scoringRetry) {
      const m = result.metrics.scoringRetry;
      const totalSecs = (m.total_duration / 1000000000).toFixed(1);
      const loadMs = (m.load_duration / 1000000).toFixed(0);
      const tokensPerSec = (m.eval_count / (m.eval_duration / 1000000000)).toFixed(1);
      tableHTML += `<tr><td>Scoring Retry</td><td>${m.model}</td><td>${totalSecs}s</td><td>${loadMs}ms</td><td>${m.eval_count || 0}</td><td>${tokensPerSec} t/s</td><td>${m.context_size}</td><td>${m.temperature}</td></tr>`;
    }

    tableHTML += '</tbody>';
    tbl.innerHTML = tableHTML;
    outputEl.append(tbl);
  }

  // 4. system info table
  if (result.pcCode || result.systemInfo) {
    const systemH = document.createElement('h3');
    systemH.textContent = 'System Information';
    outputEl.append(systemH);

    const sysTbl = document.createElement('table');
    sysTbl.className = 'score-table';
    let sysTableHTML = `
      <thead>
        <tr><th>PcCode</th><th>CPU</th><th>Graphics</th><th>RAM</th><th>OS</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>${result.pcCode || 'Unknown'}</td>
          <td>${result.systemInfo?.chip || 'Unknown'}</td>
          <td>${result.systemInfo?.graphics || 'Unknown'}</td>
          <td>${result.systemInfo?.ram || 'Unknown'}</td>
          <td>${result.systemInfo?.os || 'Unknown'}</td>
        </tr>
      </tbody>`;
    sysTbl.innerHTML = sysTableHTML;
    outputEl.append(sysTbl);
  }

  // 5. created at and test code
  const meta = document.createElement('p');
  meta.style.fontSize = '.8rem';
  meta.style.color = '#555';
  meta.textContent = `CreatedAt: ${result.createdAt} | Test Code: ${result.testCode || 'N/A'}`;
  outputEl.append(meta);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!modelEl.value) {
    outputEl.textContent = 'Please select a model first.';
    return;
  }
  
  outputEl.textContent = 'Loading…';

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
    
    const result = await search(queryEl.value, scoreTglEl.checked, modelEl.value, parseFloat(temperatureEl.value), parseFloat(contextEl.value), systemPrompt, systemPromptName, tokenLimit, sourceTypeEl.value, testCode);
    render(result);
    
    // Show export section
    document.getElementById('exportSection').style.display = 'block';
  } catch (err) {
    outputEl.textContent = err.message;
    console.error(err);
  }
});

// Add event listener for export button
exportBtn.addEventListener('click', async () => {
  const exportFormat = document.getElementById('exportFormat').value;
  
  if (!window.currentResult) {
    alert('No results available to export.');
    return;
  }
  
  const filename = `AISearch-${window.currentResult.createdAt}`;
  
  if (exportFormat === 'pdf') {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>AI Search Results</title>
          <style>
            body { font-family: system-ui, sans-serif; margin: 2rem; }
            h1, h3 { margin-top: 1rem; }
            table { border-collapse: collapse; margin-top: 1rem; width: 100%; }
            th, td { border: 1px solid #ccc; padding: .4rem .6rem; text-align: left; }
            th { background: #fafafa; }
            .meta { font-size: 0.8rem; color: #555; margin-top: 1rem; }
          </style>
        </head>
        <body>
          <h1>AI Search Results</h1>
          ${outputEl.innerHTML}
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
      markdown += `| Criterion | Score (1-5) | Justification |\n`;
      markdown += `|-----------|-------------|---------------|\n`;
      markdown += `| Accuracy | ${s.accuracy ?? '-'} | ${s.justifications.accuracy} |\n`;
      markdown += `| Relevance | ${s.relevance ?? '-'} | ${s.justifications.relevance} |\n`;
      markdown += `| Organization | ${s.organization ?? '-'} | ${s.justifications.organization} |\n`;
      markdown += `| **Weighted Score** | **${s.total ? s.total + '%' : '-'}** | |\n\n`;
      
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
    
    markdown += `**CreatedAt:** ${result.createdAt}\n`;
    
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
      PcCode: result.pcCode || null,
      PcCPU: result.systemInfo?.chip || null,
      PcGraphics: result.systemInfo?.graphics || null,
      PcRAM: result.systemInfo?.ram || null,
      PcOS: result.systemInfo?.os || null,
      CreatedAt: result.createdAt || null,
      SourceType: result.sourceType || null,
      SystemPrompt: result.systemPromptName || null,
      Prompt: result.query || null,
      'ModelName-search': result.metrics?.search?.model || null,
      'ModelContextSize-search': result.metrics?.search?.context_size || null,
      'ModelTemperature-search': result.metrics?.search?.temperature || null,
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
    // Export to database
    const result = window.currentResult;
    const dbData = {
      TestCode: result.testCode || '',
      PcCode: result.pcCode || null,
      PcCPU: result.systemInfo?.chip || null,
      PcGraphics: result.systemInfo?.graphics || null,
      PcRAM: result.systemInfo?.ram || null,
      PcOS: result.systemInfo?.os || null,
      CreatedAt: result.createdAt || null,
      SourceType: result.sourceType || null,
      SystemPrompt: result.systemPromptName || null,
      Prompt: result.query || null,
      'ModelName-search': result.metrics?.search?.model || null,
      'ModelContextSize-search': result.metrics?.search?.context_size || null,
      'ModelTemperature-search': result.metrics?.search?.temperature || null,
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
        alert(`Successfully saved to database with ID: ${saveResult.insertId}`);
      } else {
        alert(`Database save failed: ${saveResult.error}`);
      }
    } catch (error) {
      alert(`Database save error: ${error.message}`);
    }
  }
});
