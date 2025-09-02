import express from 'express';
import { Ollama } from 'ollama';
import { requireAuthWithRateLimit } from '../middleware/auth.mjs';
import loggerPkg from '../../../shared/utils/logger.mjs';
const { logger } = loggerPkg;

const router = express.Router();
const ollama = new Ollama({ host: 'http://localhost:11434' });

router.get('/', requireAuthWithRateLimit(10, 60000), async (req, res) => {
  try {
    const response = await ollama.list();
    const models = response.models
      .map(model => model.name)
      .filter(name => !name.includes('nomic-embed-text'))
      .sort();
    res.json({ models });
  } catch (error) {
    logger.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

export default router;