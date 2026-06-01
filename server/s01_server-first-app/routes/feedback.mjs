import express from 'express';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/auth.mjs';

const router = express.Router();
const LOG_FILE = '/Users/Shared/AIPrivateSearch/logs/search-evaluations.jsonl';

// POST /api/search-feedback — log thumbs up/down for an AI Document Chat response
router.post('/', requireAuth, (req, res) => {
  const { feedbackToken, rating, query, collection, model, topK, contextSize, temperature, chunksUsed } = req.body;

  if (!feedbackToken || rating === undefined) {
    return res.status(400).json({ error: 'feedbackToken and rating are required' });
  }
  if (rating !== 0 && rating !== 1) {
    return res.status(400).json({ error: 'rating must be 0 (negative) or 1 (positive)' });
  }

  try {
    const entry = {
      timestamp: new Date().toISOString(),
      feedbackToken,
      rating,          // 1 = thumbs up, 0 = thumbs down
      query,
      collection,
      model,
      topK,
      contextSize,
      temperature,
      chunksUsed
    };

    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n', 'utf8');

    console.log(`[feedback] ${rating === 1 ? '👍' : '👎'} ${collection} "${query?.substring(0, 50)}"`);
    res.json({ success: true });
  } catch (error) {
    console.error('[feedback] Error logging feedback:', error.message);
    res.status(500).json({ error: 'Failed to log feedback' });
  }
});

// GET /api/search-feedback/stats — basic stats from the log
router.get('/stats', requireAuth, (req, res) => {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return res.json({ total: 0, positive: 0, negative: 0, score: null });
    }
    const lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n').filter(Boolean);
    const entries = lines.map(l => JSON.parse(l));
    const positive = entries.filter(e => e.rating === 1).length;
    const negative = entries.filter(e => e.rating === 0).length;
    const total = positive + negative;
    res.json({
      total,
      positive,
      negative,
      score: total > 0 ? Math.round((positive / total) * 100) : null,
      byCollection: entries.reduce((acc, e) => {
        if (!e.collection) return acc;
        if (!acc[e.collection]) acc[e.collection] = { positive: 0, negative: 0 };
        acc[e.collection][e.rating === 1 ? 'positive' : 'negative']++;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read feedback log' });
  }
});

export default router;
