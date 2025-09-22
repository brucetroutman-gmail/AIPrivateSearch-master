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
router.post('/traditional', async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    const result = await searchOrchestrator.search(query, ['traditional'], options);
    res.json(result.results.traditional);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/metadata', async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    const result = await searchOrchestrator.search(query, ['metadata'], options);
    res.json(result.results.metadata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/fulltext', async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    const result = await searchOrchestrator.search(query, ['fulltext'], options);
    res.json(result.results.fulltext);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/vector', async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    const result = await searchOrchestrator.search(query, ['vector'], options);
    res.json(result.results.vector);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/hybrid', async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    const result = await searchOrchestrator.search(query, ['hybrid'], options);
    res.json(result.results.hybrid);
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

router.post('/rag', async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    const result = await searchOrchestrator.search(query, ['rag'], options);
    res.json(result.results.rag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/rag-simple', async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    const result = await searchOrchestrator.search(query, ['rag-simple'], options);
    res.json(result.results['rag-simple']);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available methods
router.get('/methods', (req, res) => {
  res.json({
    methods: searchOrchestrator.getAvailableMethods(),
    descriptions: {
      traditional: 'File-based grep-like search for exact matches',
      metadata: 'Structured queries using document metadata',
      fulltext: 'Indexed search with ranking and stemming',
      vector: 'Semantic similarity using embeddings',
      hybrid: 'Combined traditional and vector methods',
      'ai-direct': 'Question-answering models for contextual understanding',
      rag: 'Chunked documents with AI retrieval',
      'rag-simple': 'Chunked documents with text similarity (no embeddings)'
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

export default router;