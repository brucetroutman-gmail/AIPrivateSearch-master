import express from 'express';
import { SearchOrchestrator } from '../lib/search/SearchOrchestrator.mjs';

const router = express.Router();
const searchOrchestrator = new SearchOrchestrator();

// Multi-method search endpoint
router.post('/multi-method', async (req, res) => {
  try {
    const { query, methods = ['traditional'], options = {} } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: 'Query parameter is required and must be a string' 
      });
    }

    const result = await searchOrchestrator.search(query, methods, options);
    
    res.json({
      success: true,
      query,
      methods,
      ...result
    });
  } catch (error) {
    console.error('Multi-search error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      message: error.message 
    });
  }
});

// Individual method endpoints
router.post('/line-search', async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    const result = await searchOrchestrator.search(query, ['line-search'], options);
    res.json(result.results['line-search']);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/document-index', async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    const result = await searchOrchestrator.search(query, ['document-index'], options);
    res.json(result.results['document-index']);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/document-search', async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    const result = await searchOrchestrator.search(query, ['document-search'], options);
    res.json(result.results['document-search']);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/smart-search', async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    const result = await searchOrchestrator.search(query, ['smart-search'], options);
    res.json(result.results['smart-search']);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/hybrid-search', async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    const result = await searchOrchestrator.search(query, ['hybrid-search'], options);
    res.json(result.results['hybrid-search']);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ai-direct', async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    const result = await searchOrchestrator.search(query, ['ai-direct'], options);
    res.json(result.results['ai-direct']);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ai-document-chat', async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    const result = await searchOrchestrator.search(query, ['ai-document-chat'], options);
    res.json(result.results['ai-document-chat']);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Get available methods
router.get('/methods', (req, res) => {
  res.json({
    methods: searchOrchestrator.getAvailableMethods(),
    descriptions: {
      'line-search': 'Line-by-line search with context and Boolean logic',
      'document-index': 'Structured queries using document metadata',
      'document-search': 'Indexed search with ranking and stemming',
      'smart-search': 'Semantic similarity using embeddings',
      'hybrid-search': 'Combined keyword and semantic methods',
      'ai-direct': 'Question-answering models for contextual understanding',
      'ai-document-chat': 'Chunked documents with AI retrieval',

    }
  });
});

// Get available collections
router.get('/collections', async (req, res) => {
  try {
    const collections = await searchOrchestrator.getAvailableCollections();
    res.json({ collections });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Index collection document indexes into SQLite database
router.post('/document-index-create', async (req, res) => {
  try {
    const { collection } = req.body;
    
    if (!collection) {
      return res.status(400).json({ error: 'Collection parameter is required' });
    }
    
    const result = await searchOrchestrator.indexCollectionMetadata(collection);
    res.json({
      success: true,
      collection,
      documentsProcessed: result.documentsProcessed
    });
  } catch (error) {
    console.error('Document index creation error:', error);
    res.status(500).json({ 
      error: 'Doc Index creation failed', 
      message: error.message 
    });
  }
});

// Cleanup META_ files
router.post('/cleanup-meta-files', async (req, res) => {
  try {
    const { collection } = req.body;
    
    if (!collection) {
      return res.status(400).json({ error: 'Collection parameter is required' });
    }
    
    const result = await searchOrchestrator.cleanupMetaFiles(collection);
    res.json({
      success: true,
      collection,
      filesDeleted: result.filesDeleted
    });
  } catch (error) {
    console.error('META file cleanup error:', error);
    res.status(500).json({ 
      error: 'META file cleanup failed', 
      message: error.message 
    });
  }
});

// View document index for a specific document
router.post('/document-index-view', async (req, res) => {
  try {
    const { collection, filename } = req.body;
    
    if (!collection || !filename) {
      return res.status(400).json({ error: 'Collection and filename parameters are required' });
    }
    
    const result = await searchOrchestrator.getDocumentMetadata(collection, filename);
    res.json({
      success: !!result,
      documentIndex: result
    });
  } catch (error) {
    console.error('Document index view error:', error);
    res.status(500).json({ 
      error: 'Failed to load Doc Index', 
      message: error.message 
    });
  }
});

// Update document index comments
router.post('/document-index-update', async (req, res) => {
  try {
    const { id, comments } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Document Index ID is required' });
    }
    
    const result = await searchOrchestrator.updateMetadataComments(id, comments);
    res.json({
      success: true,
      updated: result.updated
    });
  } catch (error) {
    console.error('Document index update error:', error);
    res.status(500).json({ 
      error: 'Failed to update Doc Index', 
      message: error.message 
    });
  }
});

// Update all document index fields
router.post('/document-index-update-all', async (req, res) => {
  try {
    const documentIndex = req.body;
    
    if (!documentIndex.id) {
      return res.status(400).json({ error: 'Document Index ID is required' });
    }
    
    const result = await searchOrchestrator.updateAllMetadata(documentIndex);
    res.json({
      success: true,
      updated: result.updated
    });
  } catch (error) {
    console.error('Document index update all error:', error);
    res.status(500).json({ 
      error: 'Failed to update Doc Index', 
      message: error.message 
    });
  }
});

// Get document index status for collection
router.post('/document-index-status', async (req, res) => {
  try {
    const { collection } = req.body;
    
    if (!collection) {
      return res.status(400).json({ error: 'Collection parameter is required' });
    }
    
    const result = await searchOrchestrator.getMetadataStatus(collection);
    res.json({
      success: true,
      documents: result
    });
  } catch (error) {
    console.error('Document index status error:', error);
    res.status(500).json({ 
      error: 'Failed to get Doc Index status', 
      message: error.message 
    });
  }
});

export default router;