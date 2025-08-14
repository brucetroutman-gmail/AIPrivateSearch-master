import express from 'express';
import fs from 'fs-extra';
import path from 'path';

const router = express.Router();

// Get config file
router.get('/:filename', async (req, res) => {
  try {
    const configPath = path.join(process.cwd(), '../../client/c01_client-first-app/config', req.params.filename);
    const content = await fs.readFile(configPath, 'utf8');
    res.json({ content });
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
});

// Update config file
router.put('/:filename', async (req, res) => {
  try {
    const configPath = path.join(process.cwd(), '../../client/c01_client-first-app/config', req.params.filename);
    await fs.writeFile(configPath, req.body.content, 'utf8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List config files
router.get('/', async (req, res) => {
  try {
    const configDir = path.join(process.cwd(), '../../client/c01_client-first-app/config');
    const files = await fs.readdir(configDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    res.json({ files: jsonFiles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;