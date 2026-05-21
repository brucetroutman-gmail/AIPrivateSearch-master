 
// Browser-compatible logging utility with input sanitization and breadcrumb trail

function sanitizeLogInput(input) {
  if (input === null || input === undefined) return String(input);
  let str = typeof input === 'string' ? input : String(input);
  return str.replace(/[\r\n\t]/g, ' ').replace(/[\x00-\x1f\x7f-\x9f]/g, '');
}

// --- Breadcrumb Trail ---
const MAX_CRUMBS = 50;
const STORAGE_KEY = 'aips_breadcrumbs';

function loadCrumbs() {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveCrumbs(crumbs) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(crumbs)); } catch { /* storage full */ }
}

function addCrumb(action, details = {}) {
  const crumbs = loadCrumbs();
  crumbs.push({
    t: new Date().toISOString(),
    page: window.location.pathname.split('/').pop() || 'index.html',
    action: sanitizeLogInput(action),
    ...Object.fromEntries(Object.entries(details).map(([k, v]) => [k, sanitizeLogInput(String(v))]))
  });
  if (crumbs.length > MAX_CRUMBS) crumbs.splice(0, crumbs.length - MAX_CRUMBS);
  saveCrumbs(crumbs);
  sendCrumb(crumbs[crumbs.length - 1]);
}

async function sendCrumb(crumb) {
  if (localStorage.getItem('breadcrumbsEnabled') !== 'true') return;
  try {
    const apiBase = window.API_BASE_URL || '';
    await fetch(`${apiBase}/api/breadcrumbs/crumb`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        user: localStorage.getItem('userEmail') || 'unknown',
        crumb
      })
    });
  } catch { /* never throw from logger */ }
}

async function reportToServer(errorMsg, errorStack = '') {
  if (localStorage.getItem('breadcrumbsEnabled') !== 'true') return;
  try {
    const apiBase = window.API_BASE_URL || '';
    await fetch(`${apiBase}/api/breadcrumbs/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        user: localStorage.getItem('userEmail') || 'unknown',
        error: sanitizeLogInput(errorMsg),
        stack: sanitizeLogInput(errorStack),
        crumbs: loadCrumbs()
      })
    });
  } catch { /* never throw from logger */ }
}

// Auto-capture page load
if (typeof window !== 'undefined') {
  addCrumb('page_load');

  window.addEventListener('error', (e) => {
    addCrumb('js_error', { msg: e.message, file: e.filename, line: e.lineno });
    reportToServer(e.message, e.error?.stack || '');
  });

  window.addEventListener('unhandledrejection', (e) => {
    const msg = e.reason?.message || String(e.reason);
    addCrumb('promise_rejection', { msg });
    reportToServer(msg, e.reason?.stack || '');
  });
}

// --- Console Logger (existing behaviour preserved) ---
const logger = {
  log:   (...args) => console.log(...args.map(sanitizeLogInput)),
  error: (...args) => console.error(...args.map(sanitizeLogInput)),
  warn:  (...args) => console.warn(...args.map(sanitizeLogInput)),
  info:  (...args) => console.info(...args.map(sanitizeLogInput)),
  debug: (...args) => console.debug(...args.map(sanitizeLogInput)),
  // Breadcrumb API
  crumb: addCrumb,
  report: reportToServer,
  getBreadcrumbs: loadCrumbs
};

if (typeof window !== 'undefined') {
  window.logger = logger;
  window.sanitizeLogInput = sanitizeLogInput;
}

export { logger, sanitizeLogInput };