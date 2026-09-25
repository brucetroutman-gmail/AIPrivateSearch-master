import { DOMSanitizer } from './shared/utils/domSanitizer.js';

// Query Intelligence test page.
// All DOM construction uses .textContent / .appendChild (no innerHTML) and
// class="hidden" toggling per the security corrections in the implementation plan.

const testQueryEl = document.getElementById('testQuery');
const analyzeBtn = document.getElementById('analyzeBtn');
const runSamplesBtn = document.getElementById('runSamplesBtn');
const resultsEl = document.getElementById('results');

// Sample queries covering each classification path (from the implementation plan)
const SAMPLE_QUERIES = [
  'clients with POA',
  'which clients have durable power of attorney documents',
  'summarize all estate plans',
  'draft a cover letter'
];

function apiBase() {
  return window.API_BASE_URL || 'http://localhost:3001';
}

// Analyze a single query against the backend endpoint
async function analyzeQuery(query) {
  const res = await window.csrfManager.fetch(`${apiBase()}/api/search/analyze-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) {
    throw new Error(`Analysis failed (${res.status})`);
  }
  return res.json();
}

// Build a labelled detail row using safe DOM methods
function detailRow(label, valueNode) {
  const p = document.createElement('p');
  const labelSpan = document.createElement('span');
  labelSpan.className = 'detail-label';
  labelSpan.textContent = `${label}: `;
  p.appendChild(labelSpan);
  if (typeof valueNode === 'string') {
    const valueSpan = document.createElement('span');
    valueSpan.className = 'detail-value';
    valueSpan.textContent = valueNode;
    p.appendChild(valueSpan);
  } else if (valueNode) {
    p.appendChild(valueNode);
  }
  return p;
}

function badge(text, variant) {
  const span = document.createElement('span');
  span.className = `badge badge-${variant}`;
  span.textContent = text;
  return span;
}

// Render one analysis result card
function renderResultCard(query, data) {
  const card = document.createElement('div');
  card.className = 'result-card success';

  const header = document.createElement('div');
  header.className = 'result-header';
  const title = document.createElement('div');
  title.className = 'result-title';
  title.textContent = query;
  const status = document.createElement('div');
  status.className = 'result-status pass';
  status.textContent = 'ANALYZED';
  header.appendChild(title);
  header.appendChild(status);
  card.appendChild(header);

  const analysis = data.analysis || {};
  const improved = data.improved || {};

  // Query type badge
  if (analysis.type) {
    card.appendChild(detailRow('Query Type', badge(analysis.type, analysis.type)));
  }
  // Quality
  if (analysis.quality) {
    card.appendChild(detailRow('Quality', analysis.quality));
  }
  // Recommended method
  if (data.recommendedMethod) {
    const methodWrap = document.createElement('span');
    methodWrap.appendChild(document.createTextNode(`${data.recommendedMethod} `));
    methodWrap.appendChild(badge('recommended', 'auto'));
    card.appendChild(detailRow('Search Method', methodWrap));
  }
  // Improvement
  if (improved.wasImproved) {
    const impWrap = document.createElement('span');
    impWrap.appendChild(badge('improved', 'improved'));
    impWrap.appendChild(document.createTextNode(` ${improved.enhanced || ''}`));
    card.appendChild(detailRow('Improved Query', impWrap));
  } else {
    card.appendChild(detailRow('Improved Query', 'Query used as written (already clear)'));
  }
  // Reasoning
  if (analysis.reasoning) {
    card.appendChild(detailRow('Reasoning', analysis.reasoning));
  }

  // Raw JSON details
  const details = document.createElement('div');
  details.className = 'result-details';
  const pre = document.createElement('pre');
  pre.textContent = JSON.stringify(data, null, 2);
  details.appendChild(pre);
  card.appendChild(details);

  return card;
}

function renderErrorCard(query, message) {
  const card = document.createElement('div');
  card.className = 'result-card error';

  const header = document.createElement('div');
  header.className = 'result-header';
  const title = document.createElement('div');
  title.className = 'result-title';
  title.textContent = query;
  const status = document.createElement('div');
  status.className = 'result-status fail';
  status.textContent = 'ERROR';
  header.appendChild(title);
  header.appendChild(status);
  card.appendChild(header);

  card.appendChild(detailRow('Message', message));
  return card;
}

function clearResults() {
  while (resultsEl.firstChild) {
    resultsEl.removeChild(resultsEl.firstChild);
  }
}

async function runSingle(query) {
  const clean = DOMSanitizer.sanitizeText((query || '').trim());
  if (!clean) {
    if (window.showUserMessage) window.showUserMessage('Please enter a query', 'error');
    return;
  }
  try {
    const data = await analyzeQuery(clean);
    resultsEl.appendChild(renderResultCard(clean, data));
  } catch (err) {
    resultsEl.appendChild(renderErrorCard(clean, err.message || 'Unknown error'));
  }
}

async function runSamples() {
  clearResults();
  runSamplesBtn.disabled = true;
  runSamplesBtn.textContent = 'Running...';
  try {
    for (const q of SAMPLE_QUERIES) {
      // Sequential to keep result order deterministic
      await runSingle(q);
    }
  } finally {
    runSamplesBtn.disabled = false;
    runSamplesBtn.textContent = 'Run Sample Queries';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  analyzeBtn.addEventListener('click', async () => {
    clearResults();
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';
    try {
      await runSingle(testQueryEl.value);
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Analyze Query';
    }
  });

  runSamplesBtn.addEventListener('click', runSamples);

  testQueryEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') analyzeBtn.click();
  });
});
