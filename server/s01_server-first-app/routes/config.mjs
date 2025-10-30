import express from 'express';
import { secureFs } from '../lib/utils/secureFileOps.mjs';
import path from 'path';

const router = express.Router();

// Update subscription tier
router.post('/subscription-tier', async (req, res) => {
  try {
    const { tier } = req.body;
    if (![1, 2, 3].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    const configPath = path.join(process.cwd(), '../../client/c01_client-first-app/config/app.json');
    const configData = await secureFs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    config['subscription-tier'] = tier;
    
    await secureFs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    // Check if admin exists for new tier, create if needed
    const { UserManager } = await import('../lib/auth/userManager.mjs');
    const userManager = new UserManager();
    const users = await userManager.loadUsers();
    const adminExists = users.some(user => user.userRole === 'admin' && user.active);
    
    if (!adminExists) {
      const tierNames = { 1: 'standard', 2: 'premium', 3: 'professional' };
      const adminAccounts = {
        1: { email: 'adm-std@a.com', password: '123' },
        2: { email: 'adm-prem@a.com', password: '123' },
        3: { email: 'adm-prof@a.com', password: '123' }
      };
      const admin = adminAccounts[tier];
      await userManager.createUser(admin.email, admin.password, tierNames[tier], 'admin');
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get config files list
router.get('/files', async (req, res) => {
  try {
    const configDir = path.join(process.cwd(), '../../client/c01_client-first-app/config');
    const files = await secureFs.readdir(configDir);
    const configFiles = files.filter(file => file.endsWith('.json'));
    res.json(configFiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific config file
router.get('/:filename', async (req, res) => {
  console.log('Config file request:', req.params.filename);
  try {
    const { filename } = req.params;
    if (!filename.endsWith('.json')) {
      console.log('Invalid file type:', filename);
      return res.status(400).json({ error: 'Invalid file type' });
    }
    
    const filePath = path.join(process.cwd(), '../../client/c01_client-first-app/config', filename);
    console.log('Reading file:', filePath);
    const content = await secureFs.readFile(filePath, 'utf8');
    res.json({ content });
  } catch (error) {
    console.log('Config file error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update specific config file
router.put('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { content } = req.body;
    
    if (!filename.endsWith('.json')) {
      return res.status(400).json({ error: 'Invalid file type' });
    }
    
    const filePath = path.join(process.cwd(), '../../client/c01_client-first-app/config', filename);
    await secureFs.writeFile(filePath, content);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;