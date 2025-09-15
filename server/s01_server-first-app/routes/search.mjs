import express from 'express';
import CombinedSearchScorer from '../lib/models/combinedSearchScorer.mjs';
import { DocumentSearch } from '../lib/documents/documentSearch.mjs';
import loggerPkg from '../../../shared/utils/logger.mjs';
const { logger } = loggerPkg;
import { requireAuthWithRateLimit } from '../middleware/auth.mjs';

const router = express.Router();

// Create an instance of the scorer
const scorer = new CombinedSearchScorer();

// Define the POST route
router.post('/', requireAuthWithRateLimit(30, 60000), async (req, res) => {
  try {
    logger.log('Received request with keys:', Object.keys(req.body));
    const { query, score, model, temperature, context, systemPrompt, systemPromptName, tokenLimit, sourceType, testCode, collection, showChunks, scoreModel, vectorDB } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // logger sanitizes all inputs to prevent log injection
    logger.log('Processing query:', query);
    logger.log('Scoring enabled:', score);
    logger.log('Model:', model);
    logger.log('Collection:', collection);
    logger.log('Show chunks:', showChunks);
    
    // Route to DocumentSearch if collection is provided
    if (collection) {
      const documentSearch = new DocumentSearch(collection, vectorDB || 'local');
      if (vectorDB !== 'lanceDB') {
        await documentSearch.initialize();
      }
      
      const searchResults = await documentSearch.searchDocuments(query, 5);
      
      if (searchResults.length === 0) {
        const result = {
          response: 'No relevant documents found in the selected collection.',
          query,
          sourceType,
          collection,
          createdAt: new Date().toISOString(),
          testCode
        };
        return res.json(result);
      }
      
      // If showChunks is true, return raw chunks without AI processing
      if (showChunks) {
        const chunksResponse = searchResults.map((result, i) => 
          `**Chunk ${i + 1}** (${result.filename}) - Similarity: ${result.similarity.toFixed(3)}\n${result.content}`
        ).join('\n\n---\n\n');
        
        const result = {
          response: `Found ${searchResults.length} relevant chunks:\n\n${chunksResponse}`,
          query,
          sourceType,
          collection,
          documentSources: searchResults.map(r => ({ filename: r.filename, similarity: r.similarity })),
          createdAt: new Date().toISOString(),
          testCode
        };
        
        return res.json(result);
      }
      
      // Create document context from search results
      const documentContext = searchResults.map((result, i) => 
        `Document ${i + 1} (${result.filename}):\n${result.content}`
      ).join('\n\n');
      
      // Create enhanced prompt with document context
      const enhancedQuery = `Based on the following documents, please answer this question: ${query}\n\nRelevant documents:\n${documentContext}`;
      
      // Process through AI model using retry logic for tests
      const result = testCode ? 
        await scorer.processWithRetry(enhancedQuery, score, model, temperature, context, systemPrompt, systemPromptName, tokenLimit, sourceType, testCode, scoreModel) :
        await scorer.process(enhancedQuery, score, model, temperature, context, systemPrompt, systemPromptName, tokenLimit, sourceType, testCode, scoreModel);
      // Process through AI model using existing scorer
      const result = await scorer.process(enhancedQuery, score, model, temperature, context, systemPrompt, systemPromptName, tokenLimit, sourceType, testCode, scoreModel);
      
      // Add collection info to result
      result.collection = collection;
      result.documentSources = searchResults.map(r => ({ filename: r.filename, similarity: r.similarity }));
      
      return res.json(result);
    }
    
    // Use existing internet search for non-collection queries with retry logic for tests
    const result = testCode ? 
      await scorer.processWithRetry(query, score, model, temperature, context, systemPrompt, systemPromptName, tokenLimit, sourceType, testCode, scoreModel) :
      await scorer.process(query, score, model, temperature, context, systemPrompt, systemPromptName, tokenLimit, sourceType, testCode, scoreModel);
    // Use existing internet search for non-collection queries
    const result = await scorer.process(query, score, model, temperature, context, systemPrompt, systemPromptName, tokenLimit, sourceType, testCode, scoreModel);
    
    logger.log('Sending response with keys:', Object.keys(result));
    res.json(result);
  } catch (error) {
    // logger sanitizes all inputs to prevent log injection
    logger.error('Route error:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

export default router;
