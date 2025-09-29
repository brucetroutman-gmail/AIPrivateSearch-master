import express from 'express';
import { secureFs } from '../lib/utils/secureFileOps.mjs';
import { UnifiedEmbeddingService } from '../lib/documents/unifiedEmbeddingService.mjs';
import path from 'path';

const router = express.Router();
const embeddingService = new UnifiedEmbeddingService();

// Get files in a collection
router.get('/collections/:collection/files', async (req, res) => {
  try {
    const { collection } = req.params;
    const collectionPath = path.join('../../sources/local-documents', collection);
    
    const files = await secureFs.readdir(collectionPath);
    const fileList = files.filter(file => !file.startsWith('.'));
    
    res.json({ files: fileList });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.status(500).json({ error: 'Failed to load collection files' });
  }
});

// Get indexed documents status
router.get('/collections/:collection/indexed', async (req, res) => {
  try {
    const { collection } = req.params;
    const documents = await embeddingService.listDocuments(collection);
    const chunkCounts = await embeddingService.getChunkCounts(collection);
    
    const indexedDocs = documents.map(doc => ({
      filename: doc.filename,
      inLanceDB: true,
      chunks: chunkCounts[doc.filename] || 0,
      processed_at: doc.processed_at
    }));
    
    res.json({ documents: indexedDocs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load indexed documents' });
  }
});

// Index/embed a document
router.post('/collections/:collection/index/:filename', async (req, res) => {
  try {
    const { collection, filename } = req.params;
    
    // Read the document content
    const filePath = path.join('../../sources/local-documents', collection, filename);
    const content = await secureFs.readFile(filePath, 'utf8');
    
    // Process with embedding service
    const result = await embeddingService.processDocument(filename, content, collection);
    
    res.json(result);
  } catch (error) {
    if (error.message.includes('Path traversal')) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    if (error.code === 'ENOENT') {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove document embeddings
router.delete('/collections/:collection/index/:filename', async (req, res) => {
  try {
    const { collection, filename } = req.params;
    const result = await embeddingService.removeDocument(collection, filename);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get embeddings info
router.get('/collections/:collection/embeddings-info', async (req, res) => {
  try {
    const { collection } = req.params;
    const documents = await embeddingService.listDocuments(collection);
    const chunkCounts = await embeddingService.getChunkCounts(collection);
    
    const totalChunks = Object.values(chunkCounts).reduce((sum, count) => sum + count, 0);
    
    res.json({
      lanceDB: {
        documents: documents.map(doc => ({
          filename: doc.filename,
          chunks: chunkCounts[doc.filename] || 0
        })),
        totalChunks
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get embeddings info' });
  }
});

// Search in collection
router.post('/collections/:collection/search', async (req, res) => {
  try {
    const { collection } = req.params;
    const { query, limit = 5 } = req.body;
    
    const results = await embeddingService.findSimilarChunks(query, collection, limit);
    
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Serve document files (must be last due to generic pattern)
router.get('/:collection/:filename', async (req, res) => {
  try {
    const { collection, filename } = req.params;
    
    // Get file extension
    const ext = filename.split('.').pop().toLowerCase();
    const allowedExtensions = ['md', 'txt', 'pdf', 'doc', 'docx'];
    
    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({ error: 'File type not supported' });
    }
    
    const filePath = path.join('../../sources/local-documents', collection, filename);
    
    // Set appropriate content type and read method based on file type
    if (ext === 'md' || ext === 'txt') {
      const content = await secureFs.readFile(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(content);
    } else {
      // Binary files (PDF, DOC, DOCX)
      const content = await secureFs.readFile(filePath);
      
      const contentTypes = {
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      
      res.setHeader('Content-Type', contentTypes[ext]);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.send(content);
    }
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