import { search, getModels } from './services/api.js';

const form       = document.getElementById('searchForm');
const modelEl    = document.getElementById('model');
const queryEl    = document.getElementById('query');
const scoreTglEl = document.getElementById('scoreToggle');
const temperatureEl = document.getElementById('temperature');
const contextEl  = document.getElementById('context');
const outputEl   = document.getElementById('output');

// Load models on page load
async function loadModels() {
  try {
    const { models } = await getModels();
    modelEl.innerHTML = models.map(model => 
      `<option value="${model}">${model}</option>`
    ).join('');
    
    // Set default to qwen2:0.5b if available
    if (models.includes('qwen2:0.5b')) {
      modelEl.value = 'qwen2:0.5b';
    }
  } catch (error) {
    modelEl.innerHTML = '<option value="">Error loading models</option>';
    console.error('Failed to load models:', error);
  }
}

loadModels();

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
        <tr><th>Operation</th><th>Model</th><th>Duration</th><th>Load</th><th>Eval Rate</th><th>Context</th><th>Temperature</th></tr>
      </thead>
      <tbody>`;

    if (result.metrics.search) {
      const m = result.metrics.search;
      const totalSecs = (m.total_duration / 1000000000).toFixed(1);
      const loadMs = (m.load_duration / 1000000).toFixed(0);
      const tokensPerSec = (m.eval_count / (m.eval_duration / 1000000000)).toFixed(1);
      tableHTML += `<tr><td>Search</td><td>${m.model}</td><td>${totalSecs}s</td><td>${loadMs}ms</td><td>${tokensPerSec} t/s</td><td>${m.context_size}</td><td>${m.temperature}</td></tr>`;
    }

    if (result.metrics.scoring) {
      const m = result.metrics.scoring;
      const totalSecs = (m.total_duration / 1000000000).toFixed(1);
      const loadMs = (m.load_duration / 1000000).toFixed(0);
      const tokensPerSec = (m.eval_count / (m.eval_duration / 1000000000)).toFixed(1);
      tableHTML += `<tr><td>Scoring</td><td>${m.model}</td><td>${totalSecs}s</td><td>${loadMs}ms</td><td>${tokensPerSec} t/s</td><td>${m.context_size}</td><td>${m.temperature}</td></tr>`;
    }

    if (result.metrics.scoringRetry) {
      const m = result.metrics.scoringRetry;
      const totalSecs = (m.total_duration / 1000000000).toFixed(1);
      const loadMs = (m.load_duration / 1000000).toFixed(0);
      const tokensPerSec = (m.eval_count / (m.eval_duration / 1000000000)).toFixed(1);
      tableHTML += `<tr><td>Scoring Retry</td><td>${m.model}</td><td>${totalSecs}s</td><td>${loadMs}ms</td><td>${tokensPerSec} t/s</td><td>${m.context_size}</td><td>${m.temperature}</td></tr>`;
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

  // 5. created at
  const meta = document.createElement('p');
  meta.style.fontSize = '.8rem';
  meta.style.color = '#555';
  meta.textContent = `CreatedAt: ${result.createdAt}`;
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
    const result = await search(queryEl.value, scoreTglEl.checked, modelEl.value, parseFloat(temperatureEl.value), parseFloat(contextEl.value));
    render(result);
  } catch (err) {
    outputEl.textContent = err.message;
    console.error(err);
  }
});
