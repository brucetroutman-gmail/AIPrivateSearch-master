import express from 'express';
import { Ollama } from 'ollama';
import { requireAuth } from '../middleware/auth.mjs';

const router = express.Router();
const ollama = new Ollama({ host: 'http://localhost:11434' });

router.get('/', requireAuth, async (req, res) => {
  try {
    const response = await ollama.list();
    const models = response.models
      .map(model => model.name)
      .filter(name => !name.includes('nomic-embed-text'))
      .sort();
    res.json({ models });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

export default router;