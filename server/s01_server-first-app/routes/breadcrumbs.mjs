import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();
const LOGS_DIR = '/Users/Shared/AIPrivateSearch/logs';
const LOG_FILE = path.join(LOGS_DIR, 'breadcrumbs.log');
const MAX_LINES = 2000;

async function appendLog(entry) {
  await fs.mkdir(LOGS_DIR, { recursive: true });
  await fs.appendFile(LOG_FILE, JSON.stringify(entry) + '\n', 'utf8');

  // Trim to MAX_LINES
  const content = await fs.readFile(LOG_FILE, 'utf8');
  const lines = content.split('\n').filter(Boolean);
  if (lines.length > MAX_LINES) {
    await fs.writeFile(LOG_FILE, lines.slice(-MAX_LINES).join('\n') + '\n', 'utf8');
  }
}

// POST /api/breadcrumbs/report
router.post('/report', async (req, res) => {
  try {
    const { user, error, stack, crumbs } = req.body;
    await appendLog({ receivedAt: new Date().toISOString(), user: user || 'unknown', error, stack, crumbs });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

// GET /api/breadcrumbs — returns parsed entries, optional ?user=&action=&from=&to=
router.get('/', async (req, res) => {
  try {
    const content = await fs.readFile(LOG_FILE, 'utf8');
    let entries = content.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    const { user, action, from, to } = req.query;
    if (user)   entries = entries.filter(e => (e.user || '').toLowerCase().includes(user.toLowerCase()));
    if (action) entries = entries.filter(e => (e.crumbs || []).some(c => c.action?.toLowerCase().includes(action.toLowerCase())));
    if (from)   entries = entries.filter(e => new Date(e.receivedAt) >= new Date(from));
    if (to)     entries = entries.filter(e => new Date(e.receivedAt) <= new Date(to + 'T23:59:59Z'));
    res.json({ entries: entries.reverse(), total: entries.length });
  } catch (e) {
    if (e.code === 'ENOENT') return res.json({ entries: [], total: 0 });
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/breadcrumbs — clears the log file
router.delete('/', async (req, res) => {
  try {
    await fs.writeFile(LOG_FILE, '', 'utf8');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/breadcrumbs/download
router.get('/download', async (req, res) => {
  try {
    const content = await fs.readFile(LOG_FILE, 'utf8');
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="breadcrumbs.log"');
    res.send(content);
  } catch (e) {
    if (e.code === 'ENOENT') return res.status(404).json({ error: 'No log file yet' });
    res.status(500).json({ error: e.message });
  }
});

export default router;
