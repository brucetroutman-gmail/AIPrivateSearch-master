 
 
import express from 'express';
import { secureFs } from '../lib/utils/secureFileOps.mjs';
import { AppConfig } from '../lib/utils/appConfig.mjs';
import path from 'path';

const router = express.Router();

// Get subscription tier
router.get('/subscription-tier', async (req, res) => {
  try {
    const tier = AppConfig.getSubscriptionTier();
    res.json({ tier });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update subscription tier
router.post('/subscription-tier', async (req, res) => {
  try {
    const { tier } = req.body;
    if (![1, 2, 3].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    const configLocation = AppConfig.getConfigLocation();
    const configPath = path.join(configLocation, 'app.json');
    const configData = await secureFs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    config['subscription-tier'] = tier;
    
    await secureFs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get config files list
router.get('/files', async (req, res) => {
  try {
    const configDir = AppConfig.getConfigLocation();
    const files = await secureFs.readdir(configDir);
    const configFiles = files.filter(file => file.endsWith('.json'));
    res.json(configFiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific config file
router.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename to prevent path traversal
    if (!filename || !filename.endsWith('.json') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const configDir = AppConfig.getConfigLocation();
    const filePath = path.join(configDir, filename);
    
    // Ensure the resolved path is within the config directory
    if (!filePath.startsWith(configDir)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    const content = await secureFs.readFile(filePath, 'utf8');
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update specific config file
router.put('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { content } = req.body;
    
    // Validate filename to prevent path traversal
    if (!filename || !filename.endsWith('.json') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const configDir = AppConfig.getConfigLocation();
    const filePath = path.join(configDir, filename);
    
    // Ensure the resolved path is within the config directory
    if (!filePath.startsWith(configDir)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    await secureFs.writeFile(filePath, content);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;