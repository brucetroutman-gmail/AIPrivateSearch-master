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

// POST /api/breadcrumbs/report — called automatically on JS error
router.post('/report', async (req, res) => {
  try {
    const { user, error, stack, crumbs } = req.body;
    await appendLog({
      receivedAt: new Date().toISOString(),
      user: user || 'unknown',
      error,
      stack,
      crumbs
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

// GET /api/breadcrumbs/download — support team downloads the log
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
