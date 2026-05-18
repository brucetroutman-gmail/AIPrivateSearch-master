/* eslint-disable security/detect-non-literal-fs-filename */
import express from 'express';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/auth.mjs';
import { generatePattern } from '../scripts/generatePattern.mjs';
import { CollectionsUtil } from '../lib/utils/collectionsUtil.mjs';

const router = express.Router();
const FABRIC_URL = process.env.FABRIC_URL;
const FABRIC_API_KEY = process.env.FABRIC_API_KEY;

// Resolve local pattern file path
function patternFilePath(collection) {
  return path.join(CollectionsUtil.getCollectionsPath(), collection, 'fabric-pattern.md');
}

// POST /api/fabric/generate-pattern
// Generates pattern from collection docs and saves locally
router.post('/generate-pattern', requireAuth, async (req, res) => {
  const { collection } = req.body;
  if (!collection || typeof collection !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(collection)) {
    return res.status(400).json({ error: 'Invalid collection name' });
  }
  try {
    const result = await generatePattern(collection);
    res.json(result);
  } catch (err) {
    console.error(`[fabric route] Pattern generation failed for ${collection}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fabric/enhance
// Reads local fabric-pattern.md, sends pattern + query to Fabric, returns enhanced prompt
router.post('/enhance', requireAuth, async (req, res) => {
  const { query, collection } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Query is required' });
  }
  if (!collection || typeof collection !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(collection)) {
    return res.status(400).json({ error: 'Invalid collection name' });
  }
  if (!FABRIC_URL || !FABRIC_API_KEY) {
    return res.status(503).json({ error: 'Fabric not configured' });
  }

  const sanitizedQuery = query.trim().substring(0, 1000);
  const patternPath = patternFilePath(collection);

  // Read local pattern — fall back to improve_prompt if not found
  let systemPrompt = null;
  if (fs.existsSync(patternPath)) {
    systemPrompt = fs.readFileSync(patternPath, 'utf8').trim();
  }

  try {
    const body = systemPrompt
      ? {
          prompts: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: sanitizedQuery }
          ]
        }
      : {
          prompts: [{ role: 'user', content: sanitizedQuery }],
          patternName: 'improve_prompt'
        };

    const response = await fetch(`${FABRIC_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FABRIC_API_KEY}`
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ error: `Fabric error: ${response.status} ${text}` });
    }

    const enhanced = await collectSSE(response);
    res.json({ enhanced, fallback: !systemPrompt });

  } catch (error) {
    console.error('[fabric/enhance] Error:', error.message);
    res.status(502).json({ error: 'Fabric enhancement unavailable' });
  }
});

// GET /api/fabric/pattern/:collection — read local fabric-pattern.md
router.get('/pattern/:collection', requireAuth, (req, res) => {
  const { collection } = req.params;
  if (!collection || !/^[a-zA-Z0-9_-]+$/.test(collection)) {
    return res.status(400).json({ error: 'Invalid collection name' });
  }
  const patternPath = patternFilePath(collection);
  if (!fs.existsSync(patternPath)) {
    return res.json({ exists: false, pattern: '' });
  }
  const pattern = fs.readFileSync(patternPath, 'utf8');
  res.json({ exists: true, pattern });
});

// PUT /api/fabric/pattern/:collection — save edited pattern to local file
router.put('/pattern/:collection', requireAuth, (req, res) => {
  const { collection } = req.params;
  const { pattern } = req.body;
  if (!collection || !/^[a-zA-Z0-9_-]+$/.test(collection)) {
    return res.status(400).json({ error: 'Invalid collection name' });
  }
  if (!pattern || typeof pattern !== 'string') {
    return res.status(400).json({ error: 'Pattern text is required' });
  }
  const patternPath = patternFilePath(collection);
  fs.writeFileSync(patternPath, pattern, 'utf8');
  res.json({ success: true });
});

// Collect SSE stream into a single string
async function collectSSE(response) {
  const text = await response.text();
  const lines = text.split('\n').filter(l => l.startsWith('data: '));
  return lines
    .map(l => {
      try {
        const data = JSON.parse(l.slice(6));
        return data.content || data.text || '';
      } catch { return ''; }
    })
    .join('')
    .trim();
}

export default router;
