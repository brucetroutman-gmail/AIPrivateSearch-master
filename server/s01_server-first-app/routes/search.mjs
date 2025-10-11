import express from 'express';
import { SearchOrchestrator } from '../lib/search/SearchOrchestrator.mjs';
import ScoringService from '../lib/services/ScoringService.mjs';
import loggerPkg from '../../../shared/utils/logger.mjs';
const { logger } = loggerPkg;
import { requireAuthWithRateLimit } from '../middleware/auth.mjs';
import { getSystemInfo } from '../lib/utils/systemInfo.mjs';

const router = express.Router();

// Create instances of services
const searchOrchestrator = new SearchOrchestrator();
const scoringService = new ScoringService();



// Define the POST route
router.post('/', requireAuthWithRateLimit(30, 60000), async (req, res) => {
  try {
    logger.log('Received request with keys:', Object.keys(req.body));
    const { query, score, model, temperature, context, systemPrompt, systemPromptName, tokenLimit, sourceType, testCode, collection, showChunks, scoreModel, searchType, useWildcards } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    logger.log('Processing query:', query);
    logger.log('Scoring enabled:', score);
    logger.log('Search type:', searchType);
    logger.log('Collection:', collection);
    
    let searchResponse;
    let searchMetrics = null;
    let chunks = null;
    
    // Phase 1: Search using SearchOrchestrator
    if (collection && searchType) {
      // Use SearchOrchestrator for document searches
      const startTime = Date.now();
      const searchResult = await searchOrchestrator.search(query, [searchType], {
        collection,
        model,
        temperature,
        contextSize: context,
        tokenLimit,
        useWildcards,
        showChunks
      });
      const endTime = Date.now();
      
      const methodResult = searchResult.results[searchType];
      if (!methodResult || !methodResult.results || methodResult.results.length === 0) {
        return res.json({
          response: 'No relevant documents found using the selected search method.',
          query,
          sourceType,
          collection,
          searchType,
          createdAt: new Date().toISOString(),
          testCode
        });
      }
      
      // Get the search response - for line-search, document-search, and document-index, return all results with context
      if (searchType === 'line-search' || searchType === 'document-search' || searchType === 'document-index') {
        // Use common formatting logic
        searchResponse = methodResult.results.map((result, index) => {
          const docLink = result.documentPath ? `[View Document](${result.documentPath})` : 
                         `[View Document](http://localhost:3001/api/documents/${collection}/${result.source})`;
          return `**Result ${index + 1}: ${result.title}**\n${result.excerpt}\n${docLink}\n`;
        }).join('\n---\n\n');
      } else if (searchType === 'ai-direct') {
        // For AI Direct, format all results
        searchResponse = methodResult.results.map((result, index) => {
          return `**${result.title}**\n${result.excerpt}\n---\n`;
        }).join('\n');
      } else {
        const firstResult = methodResult.results[0];
        searchResponse = firstResult.excerpt || firstResult.content || 'No content available';
      }
      
      // Extract chunks if available (for AI Document Chat searches)
      if (searchType === 'ai-document-chat' && methodResult.results && methodResult.results[0] && methodResult.results[0].chunks) {
        chunks = methodResult.results[0].chunks;
      }
      
      // Create search metrics for document searches
      searchMetrics = {
        model: model,
        total_duration: (endTime - startTime) * 1000000, // Convert to nanoseconds
        load_duration: 100000000, // Estimated 100ms load time
        eval_count: Math.floor(searchResponse.length / 4), // Rough token estimate
        eval_duration: (endTime - startTime - 100) * 1000000, // Subtract load time
        context_size: context,
        temperature: temperature
      };
      
    } else {
      // For non-document searches, use simple model response with metrics
      const startTime = Date.now();
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          prompt: `${query}`,
          stream: false,
          options: {
            temperature: temperature,
            num_ctx: context,
            ...(tokenLimit && tokenLimit !== 'No Limit' ? { num_predict: parseInt(tokenLimit) } : {})
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }
      
      const result = await response.json();
      searchResponse = result.response || 'No response generated';
      
      // Capture search metrics
      searchMetrics = {
        model: model,
        total_duration: result.total_duration || (Date.now() - startTime) * 1000000,
        load_duration: result.load_duration || 0,
        eval_count: result.eval_count || 0,
        eval_duration: result.eval_duration || 0,
        context_size: context,
        temperature: temperature
      };
    }
    
    // Phase 2: Optional Scoring
    let scores = null;
    let scoringMetrics = null;
    if (score && scoreModel) {
      try {
        const scoringResult = await scoringService.score(query, searchResponse, scoreModel);
        scores = scoringResult.scores;
        scoringMetrics = scoringResult.metrics;
      } catch (error) {
        logger.error('Scoring failed:', error.message);
      }
    }
    
    // Get system information
    const systemInfo = await getSystemInfo();
    
    // Build final result
    const result = {
      response: searchResponse,
      query,
      sourceType,
      collection,
      searchType,
      createdAt: new Date().toISOString(),
      testCode,
      scores,
      metrics: {
        ...(searchMetrics && { search: searchMetrics }),
        ...(scoringMetrics && { scoring: scoringMetrics })
      },
      ...(chunks && { chunks }),
      ...systemInfo
    };
    
    logger.log('Sending response with keys:', Object.keys(result));
    res.json(result);
    
  } catch (error) {
    logger.error('Route error:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Exact Match Search endpoint
router.post('/line-search', async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    const result = await searchOrchestrator.search(query, ['line-search'], options);
    res.json(result.results['line-search']);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



export default router;
