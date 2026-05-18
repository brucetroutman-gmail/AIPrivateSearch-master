import express from 'express';
import { requireAuth } from '../middleware/auth.mjs';
import { generatePattern } from '../scripts/generatePattern.mjs';

const router = express.Router();
const FABRIC_URL = process.env.FABRIC_URL;
const FABRIC_API_KEY = process.env.FABRIC_API_KEY;

// POST /api/fabric/generate-pattern
router.post('/generate-pattern', requireAuth, async (req, res) => {
  const { collection } = req.body;
  if (!collection || typeof collection !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(collection)) {
    return res.status(400).json({ error: 'Invalid collection name' });
  }
  res.json({ success: true, message: 'Pattern generation started' });
  generatePattern(collection).catch(err => {
    console.error(`[fabric route] Pattern generation failed for ${collection}:`, err.message);
  });
});

// POST /api/fabric/enhance
// Enhances a user query using the collection-specific Fabric pattern
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

  const patternName = `enhance_${collection}`;
  const sanitizedQuery = query.trim().substring(0, 1000);

  try {
    const response = await fetch(`${FABRIC_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FABRIC_API_KEY}`
      },
      body: JSON.stringify({
        prompts: [{ role: 'user', content: sanitizedQuery }],
        patternName
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      // Fall back to improve_prompt if collection pattern doesn't exist
      const fallbackResponse = await fetch(`${FABRIC_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FABRIC_API_KEY}`
        },
        body: JSON.stringify({
          prompts: [{ role: 'user', content: sanitizedQuery }],
          patternName: 'improve_prompt'
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (!fallbackResponse.ok) {
        return res.status(502).json({ error: 'Fabric enhancement unavailable' });
      }

      const enhanced = await collectSSE(fallbackResponse);
      return res.json({ enhanced, fallback: true });
    }

    const enhanced = await collectSSE(response);
    res.json({ enhanced, fallback: false });

  } catch (error) {
    console.error('[fabric/enhance] Error:', error.message);
    res.status(502).json({ error: 'Fabric enhancement unavailable' });
  }
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

// GET /api/fabric/pattern/:collection — fetch current pattern from Fabric
router.get('/pattern/:collection', requireAuth, async (req, res) => {
  const { collection } = req.params;
  if (!collection || !/^[a-zA-Z0-9_-]+$/.test(collection)) {
    return res.status(400).json({ error: 'Invalid collection name' });
  }
  if (!FABRIC_URL || !FABRIC_API_KEY) {
    return res.status(503).json({ error: 'Fabric not configured' });
  }

  const patternName = `enhance_${collection}`;
  try {
    const response = await fetch(`${FABRIC_URL}/patterns/${patternName}`, {
      headers: { 'Authorization': `Bearer ${FABRIC_API_KEY}` },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) {
      return res.json({ exists: false, pattern: '' });
    }
    const data = await response.json();
    const pattern = data?.pattern?.system || data?.system || JSON.stringify(data, null, 2);
    res.json({ exists: true, pattern });
  } catch (error) {
    res.status(502).json({ error: 'Could not reach Fabric server' });
  }
});

// PUT /api/fabric/pattern/:collection — save updated pattern to Fabric
router.put('/pattern/:collection', requireAuth, async (req, res) => {
  const { collection } = req.params;
  const { pattern } = req.body;
  if (!collection || !/^[a-zA-Z0-9_-]+$/.test(collection)) {
    return res.status(400).json({ error: 'Invalid collection name' });
  }
  if (!pattern || typeof pattern !== 'string') {
    return res.status(400).json({ error: 'Pattern text is required' });
  }
  if (!FABRIC_URL || !FABRIC_API_KEY) {
    return res.status(503).json({ error: 'Fabric not configured' });
  }

  const patternName = `enhance_${collection}`;
  try {
    const response = await fetch(`${FABRIC_URL}/patterns/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FABRIC_API_KEY}`
      },
      body: JSON.stringify({ name: patternName, pattern: { system: pattern } }),
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ error: `Fabric error: ${text}` });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(502).json({ error: 'Could not reach Fabric server' });
  }
});

export default router;
