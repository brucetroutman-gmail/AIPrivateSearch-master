 
 
import express from 'express';
import { SearchOrchestrator } from '../lib/search/SearchOrchestrator.mjs';
import ScoringService from '../lib/services/ScoringService.mjs';
import loggerPkg from '../../../shared/utils/logger.mjs';
const { logger } = loggerPkg;
import { requireAuthWithRateLimit } from '../middleware/auth.mjs';
import { DeviceLicenseClient } from '../lib/licensing/device-license-client.mjs';
import { SearchLogger } from '../lib/utils/searchLogger.mjs';

const router = express.Router();

// Create instances of services
const searchOrchestrator = new SearchOrchestrator();
const scoringService = new ScoringService();



// Define the POST route
router.post('/', requireAuthWithRateLimit(30, 60000), async (req, res) => {
  try {
    logger.log('Received request with keys:', Object.keys(req.body));
    const { query, score, model, temperature, context, systemPrompt, systemPromptName, tokenLimit, sourceType, testCode, collection, showChunks, scoreModel, searchType } = req.body;
    
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
    let feedbackToken = null;
    let feedbackMeta = null;
    let methodResult = null;
    
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
        showChunks
      });
      const endTime = Date.now();
      
      methodResult = searchResult.results[searchType];
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
        // Use common formatting logic with clickable filename links
        searchResponse = methodResult.results.map((result, index) => {
          // Create clickable filename link in title
          let filename = result.source && result.source.includes('.') ? result.source : 
                        result.title.includes('.') ? result.title : `${result.title}.md`;
          
          // For Line Search results, extract filename from source (removes :lineNumber)
          if (filename && filename.includes(':')) {
            filename = filename.split(':')[0];
          }
          
          const docCollection = result.collection || collection || 'default';
          const filenameLink = `[${result.title}](http://localhost:56306/api/documents/${docCollection}/${encodeURIComponent(filename)}/view)`;
          
          return `**Result ${index + 1}: ${filenameLink}**\n${result.excerpt}\n`;
        }).join('\n---\n\n');
      } else if (searchType === 'ai-direct') {
        // For AI Direct, format all results with clickable filename links
        searchResponse = methodResult.results.map((result, index) => {
          // Create clickable filename link in title
          let filename = result.source || result.title.replace(' (No Match)', '').replace(' (Error)', '');
          
          // Clean up filename if it has line numbers
          if (filename && filename.includes(':')) {
            filename = filename.split(':')[0];
          }
          
          const docCollection = result.collection || collection || 'default';
          const filenameLink = `[${result.title}](http://localhost:56306/api/documents/${docCollection}/${encodeURIComponent(filename)}/view)`;
          
          return `**Result ${index + 1}: ${filenameLink}**\n${result.excerpt}\n---\n`;
        }).join('\n');
      } else if (searchType === 'ai-document-chat') {
        // For AI Document Chat, use the formatted response directly
        const firstResult = methodResult.results[0];
        searchResponse = firstResult.excerpt || firstResult.content || 'No content available';
        // Preserve feedback token for UI
        if (methodResult.feedbackToken) {
          feedbackToken = methodResult.feedbackToken;
          feedbackMeta = methodResult.feedbackMeta;
        }
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
            thinking: false,
            ...(tokenLimit && tokenLimit !== 'No Limit' ? { num_predict: parseInt(tokenLimit) } : {})
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }
      
      const result = await response.json();
      searchResponse = result.response || result.thinking || 'No response generated';
      
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
    const deviceClient = new DeviceLicenseClient();
    const systemInfo = await deviceClient.getSystemInfo();
    
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
      ...(feedbackToken && { feedbackToken, feedbackMeta }),
      ...(methodResult?.searchLog && { searchLog: methodResult.searchLog }),
      ...systemInfo
    };
    
    // Log the search activity
    try {
      const logData = {
        ...result,
        userEmail: req.user?.email,
        sessionId: req.sessionId,
        ipAddress: req.ip,
        systemPromptName,
        collectionName: collection,
        searchMethod: searchType,
        documentsFound: chunks ? chunks.length : (searchResponse ? 1 : 0),
        documentsSearched: collection ? 'unknown' : 0
      };
      await SearchLogger.logSearch(logData);
    } catch (logError) {
      logger.error('Failed to log search:', logError.message);
    }
    
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
