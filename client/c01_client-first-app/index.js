import { search, getModels } from './services/api.js';

const form       = document.getElementById('searchForm');
const modelEl    = document.getElementById('model');
const queryEl    = document.getElementById('query');
const scoreTglEl = document.getElementById('scoreToggle');
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
  
  return `${metrics.model} - Total: ${totalSecs}s, Load: ${loadMs}ms, Eval: ${tokensPerSec} tokens/sec`;
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
        <tr><td><strong>Weighted Score</strong></td><td colspan="2"><strong>${s.total ?? '-'}</strong></td></tr>
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

    if (result.metrics.search) {
      const searchMetrics = document.createElement('div');
      searchMetrics.innerHTML = `<strong>Search:</strong> ${formatMetrics(result.metrics.search)}`;
      outputEl.append(searchMetrics);
    }

    if (result.metrics.scoring) {
      const scoringMetrics = document.createElement('div');
      scoringMetrics.innerHTML = `<strong>Scoring:</strong> ${formatMetrics(result.metrics.scoring)}`;
      outputEl.append(scoringMetrics);
    }

    if (result.metrics.scoringRetry) {
      const retryMetrics = document.createElement('div');
      retryMetrics.innerHTML = `<strong>Scoring Retry:</strong> ${formatMetrics(result.metrics.scoringRetry)}`;
      outputEl.append(retryMetrics);
    }
  }

  // 4. metadata
  const meta = document.createElement('p');
  meta.style.fontSize = '.8rem';
  meta.style.color = '#555';
  meta.textContent = `timestamp: ${result.timestamp}`;
  outputEl.append(meta);

  if (result.pcCode) {
    const pcCode = document.createElement('p');
    pcCode.style.fontSize = '.8rem';
    pcCode.style.color = '#555';
    pcCode.textContent = `PcCode: ${result.pcCode}`;
    outputEl.append(pcCode);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!modelEl.value) {
    outputEl.textContent = 'Please select a model first.';
    return;
  }
  
  outputEl.textContent = 'Loading…';

  try {
    const result = await search(queryEl.value, scoreTglEl.checked, modelEl.value);
    render(result);
  } catch (err) {
    outputEl.textContent = err.message;
    console.error(err);
  }
});
