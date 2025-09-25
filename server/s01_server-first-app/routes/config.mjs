import express from 'express';
import { secureFs } from '../lib/utils/secureFileOps.mjs';
import path from 'path';
import { requireAuth } from '../middleware/auth.mjs';
import { validateFilename } from '../lib/utils/pathValidator.mjs';

const router = express.Router();

// List config files (must come before /:filename)
router.get('/files', requireAuth, async (req, res) => {
  try {
    const configDir = path.join(process.cwd(), '../../client/c01_client-first-app/config');
    const files = await secureFs.readdir(configDir);
    const jsonFiles = files.filter(file => file.endsWith('.json')).sort();
    res.json(jsonFiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get config file
router.get('/:filename', requireAuth, async (req, res) => {
  try {
    const filename = validateFilename(req.params.filename);
    const configPath = path.join(process.cwd(), '../../client/c01_client-first-app/config', filename);
    const content = await secureFs.readFile(configPath, 'utf8');
    res.json({ content });
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
});

// Update config file
router.put('/:filename', requireAuth, async (req, res) => {
  try {
    const filename = validateFilename(req.params.filename);
    const configPath = path.join(process.cwd(), '../../client/c01_client-first-app/config', filename);
    await secureFs.writeFile(configPath, req.body.content, 'utf8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;