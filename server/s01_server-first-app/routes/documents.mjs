import express from 'express';
import { secureFs } from '../lib/utils/secureFileOps.mjs';
import path from 'path';

const router = express.Router();

// Serve document files
router.get('/:collection/:filename', async (req, res) => {
  try {
    const { collection, filename } = req.params;
    
    // Validate filename ends with .md
    if (!filename.endsWith('.md')) {
      return res.status(400).json({ error: 'Only .md files are allowed' });
    }
    
    const filePath = path.join('../../sources/local-documents', collection, filename);
    const content = await secureFs.readFile(filePath, 'utf8');
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(content);
  } catch (error) {
    if (error.message.includes('Path traversal')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.status(500).json({ error: 'Failed to load document' });
  }
});

export default router;