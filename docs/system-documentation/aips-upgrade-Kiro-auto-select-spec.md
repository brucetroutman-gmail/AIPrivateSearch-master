# AIPrivateSearch Query Intelligence Layer — Implementation Spec

**Version**: 21.38  
**Created**: 2026-09-15  
**Status**: Specification  
**Priority**: High — Improves user experience and search accuracy

---

## Executive Summary

This specification adds an **automatic query intelligence layer** that:
1. Analyzes user queries to detect intent (fact, analysis, or creative)
2. Improves poorly-formed queries automatically
3. Auto-selects the optimal search method based on query type
4. Configures search parameters (temperature, topK, context) automatically
5. Operates transparently with full bypass for test mode

**User benefit**: Non-technical users get optimal results without understanding search methods, temperature settings, or query formulation.

**Test safety**: Existing test infrastructure continues working unchanged — test mode bypasses all intelligence.

---

## Problem Statement

### Current Issues

1. **Users pick wrong search methods**
   - "Which clients have POA?" run through AI Document Chat returns "no information found" when Hybrid Search would return a list
   - Users don't know which of 7 search methods to use

2. **Vague queries produce poor results**
   - "clients with POA" is unclear compared to "Which clients have power of attorney documents?"
   - System accepts queries as-is with no improvement

3. **Parameter confusion**
   - Users don't know what temperature, topK, or context mean
   - Wrong settings produce suboptimal results

4. **No query-type awareness**
   - System treats fact-finding queries the same as analysis queries
   - No differentiation between "list all X" and "summarize X"

### Examples of Failures

| User Query | Current Behavior | Problem |
|------------|-----------------|---------|
| "clients with POA" | User picks AI Document Chat → "no information found" | Wrong method for fact query |
| "how many wills signed 2024" | User picks Line Search → 0 results (phrasing mismatch) | Wrong method, vague query |
| "summarize estate plans" | User picks Hybrid Search → returns chunk excerpts, no synthesis | Wrong method for analysis |

---

## Solution Architecture

### Query Flow Diagram

```
User Query
    ↓
┌───────────────────────────────────────┐
│  Is testCode present?                 │
│  ├─ YES → Bypass intelligence layer  │
│  └─ NO  → Continue to analysis       │
└───────────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│  Step 1: Query Analysis               │
│  - Detect type (fact/analysis/create) │
│  - Assess quality (good/needs-improve)│
│  - Generate improved version          │
└───────────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│  Step 2: Query Enhancement            │
│  - Use improved query if quality low  │
│  - Track original for transparency    │
└───────────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│  Step 3: Method Selection             │
│  - Auto-select if user didn't specify │
│  - fact → hybrid-search               │
│  - analysis → ai-document-chat        │
│  - creative → ai-document-chat        │
└───────────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│  Step 4: Parameter Configuration      │
│  - Set temperature (0.1/0.3/0.7)      │
│  - Set topK (10/15/10)                │
│  - Set context (4096/8192/8192)       │
│  - Set system prompt                  │
└───────────────────────────────────────┘
    ↓
Execute Search
    ↓
Return Results + Metadata
```

---

## Implementation Plan

### Phase 1: Core Intelligence Layer (Priority 1)

**Files to create**:
- `server/s01_server-first-app/lib/search/QueryAnalyzer.mjs` (new)

**Files to modify**:
- `server/s01_server-first-app/routes/search.mjs`

**Estimated time**: 3-4 hours

---

### Phase 2: UI Integration (Priority 2)

**Files to modify**:
- `client/c01_client-first-app/search.html`
- `client/c01_client-first-app/ai-search.html`
- `client/c01_client-first-app/search.js`
- `client/c01_client-first-app/ai-search.js`

**Estimated time**: 2-3 hours

---

### Phase 3: Testing & Refinement (Priority 3)

**Files to create**:
- `client/c01_client-first-app/test-query-intelligence.html` (new)

**Files to verify**:
- `client/c01_client-first-app/test-collections.html`
- `client/c01_client-first-app/test-nodocuments.html`

**Estimated time**: 2 hours

---

## Code Implementation

### File 1: QueryAnalyzer.mjs (NEW)

**Location**: `server/s01_server-first-app/lib/search/QueryAnalyzer.mjs`

```javascript
/* eslint-disable security/detect-non-literal-fs-filename */

import { Ollama } from 'ollama';
import { logger } from '../../../../shared/utils/logger.mjs';

/**
 * QueryAnalyzer - Intelligent query processing for automatic search optimization
 * 
 * Features:
 * - Detects query type (fact, analysis, creative)
 * - Assesses query quality
 * - Improves poorly-formed queries
 * - Recommends optimal search methods and parameters
 * - Supports test mode bypass for controlled testing
 */
export class QueryAnalyzer {
  constructor() {
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
    this.analysisModel = 'gemma2:2b'; // Fast, accurate, already installed
  }

  /**
   * Analyze a user query to determine type, quality, and improvements
   * @param {string} userQuery - The raw user query
   * @param {Object} options - Analysis options
   * @param {boolean} options.testMode - If true, bypass analysis and return pass-through
   * @returns {Promise<Object>} Analysis result with type, quality, and improved query
   */
  async analyzeQuery(userQuery, options = {}) {
    try {
      // Test mode bypass - return query as-is with no analysis
      if (options.testMode) {
        logger.log('[QueryAnalyzer] Test mode: bypassing analysis');
        return {
          type: 'unknown',
          quality: 'unknown',
          improved_query: null,
          reasoning: 'Test mode: query used as-is',
          testMode: true
        };
      }

      logger.log('[QueryAnalyzer] Analyzing query:', userQuery);

      const analysisPrompt = this.buildAnalysisPrompt(userQuery);

      const response = await this.ollama.chat({
        model: this.analysisModel,
        messages: [{ role: 'user', content: analysisPrompt }],
        stream: false,
        options: {
          temperature: 0.1, // Low temp for consistent structured output
          num_ctx: 2048,
          num_predict: 300
        }
      });

      const analysis = this.parseAnalysisResponse(response.message.content);
      logger.log('[QueryAnalyzer] Analysis complete:', analysis);

      return analysis;

    } catch (error) {
      logger.error('[QueryAnalyzer] Analysis failed:', error.message);
      
      // Fallback to safe defaults on error
      return {
        type: 'analysis',
        quality: 'good',
        improved_query: null,
        reasoning: 'Analysis failed, using defaults',
        error: error.message
      };
    }
  }

  /**
   * Build the analysis prompt for the AI model
   * @param {string} query - User query to analyze
   * @returns {string} Formatted prompt
   */
  buildAnalysisPrompt(query) {
    return `Analyze this search query and respond with ONLY a JSON object (no markdown, no other text):

User query: "${query}"

Determine:
1. **Query type**: 
   - "fact" = looking for specific information, names, dates, lists ("which clients have X", "how many X", "what is the exact text")
   - "analysis" = needs synthesis or understanding across documents ("summarize X", "compare X", "what are the patterns", "explain X")
   - "creative" = wants to generate new content ("draft X", "write X", "create X", "generate X")

2. **Quality**:
   - "good" = clear, specific, well-formed
   - "needs-improvement" = vague, unclear, missing context, poorly worded

3. **Improved query**: If quality is "needs-improvement", provide a better version. If quality is "good", set to null.

4. **Reasoning**: Brief explanation of your assessment (one sentence)

Response format (valid JSON only):
{
  "type": "fact|analysis|creative",
  "quality": "good|needs-improvement",
  "improved_query": "better version or null",
  "reasoning": "brief explanation"
}`;
  }

  /**
   * Parse the AI model's analysis response
   * @param {string} content - Raw response from model
   * @returns {Object} Parsed analysis object
   */
  parseAnalysisResponse(content) {
    try {
      // Remove markdown code blocks if present
      const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // Extract JSON object
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!analysis.type || !analysis.quality) {
        throw new Error('Missing required fields in analysis');
      }

      // Normalize values
      analysis.type = ['fact', 'analysis', 'creative'].includes(analysis.type) 
        ? analysis.type 
        : 'analysis';
      
      analysis.quality = ['good', 'needs-improvement'].includes(analysis.quality)
        ? analysis.quality
        : 'good';

      return analysis;

    } catch (error) {
      logger.error('[QueryAnalyzer] Parse failed:', error.message);
      
      // Return safe defaults
      return {
        type: 'analysis',
        quality: 'good',
        improved_query: null,
        reasoning: 'Parse failed, using defaults'
      };
    }
  }

  /**
   * Enhance a query based on analysis results
   * @param {string} originalQuery - Original user query
   * @param {Object} analysis - Analysis result from analyzeQuery
   * @returns {Object} Query enhancement info
   */
  async enhanceQuery(originalQuery, analysis) {
    // If query is good or in test mode, use as-is
    if (analysis.quality === 'good' || analysis.testMode) {
      return {
        original: originalQuery,
        enhanced: originalQuery,
        wasImproved: false,
        reasoning: analysis.reasoning
      };
    }

    // Use improved version if available
    const enhanced = analysis.improved_query || originalQuery;

    logger.log('[QueryAnalyzer] Query improved:', {
      original: originalQuery,
      enhanced: enhanced
    });

    return {
      original: originalQuery,
      enhanced: enhanced,
      wasImproved: enhanced !== originalQuery,
      reasoning: analysis.reasoning
    };
  }

  /**
   * Select optimal search method based on query type
   * @param {string} queryType - Query type from analysis (fact/analysis/creative)
   * @returns {string} Search method name
   */
  selectSearchMethod(queryType) {
    const methodMap = {
      'fact': 'hybrid-search',
      'analysis': 'ai-document-chat',
      'creative': 'ai-document-chat',
      'unknown': 'hybrid-search' // Safe default
    };

    const method = methodMap[queryType] || 'hybrid-search';
    logger.log(`[QueryAnalyzer] Selected method: ${method} for type: ${queryType}`);
    
    return method;
  }

  /**
   * Get optimal search parameters for query type
   * @param {string} queryType - Query type from analysis
   * @returns {Object} Parameter configuration
   */
  getOptimalParameters(queryType) {
    const configs = {
      fact: {
        temperature: 0.1,
        topK: 10,
        context: 4096,
        systemPrompt: 'Answer with specific facts from the documents. List all relevant items clearly. If the query asks "which" or "how many", provide a complete list with details.',
        reasoning: 'Low temperature for factual accuracy, moderate topK for focused retrieval'
      },
      analysis: {
        temperature: 0.3,
        topK: 15,
        context: 8192,
        systemPrompt: 'Synthesize information across documents. Provide comprehensive analysis with supporting details from multiple sources. Identify patterns and connections.',
        reasoning: 'Medium temperature for balanced synthesis, higher topK for broader context'
      },
      creative: {
        temperature: 0.7,
        topK: 10,
        context: 8192,
        systemPrompt: 'Generate new content based on document knowledge. Be creative but stay grounded in the source material. Use information from the documents as your foundation.',
        reasoning: 'Higher temperature for creativity, moderate topK to stay grounded'
      },
      unknown: {
        temperature: 0.3,
        topK: 12,
        context: 4096,
        systemPrompt: 'Answer the query using information from the provided documents. Be clear and comprehensive.',
        reasoning: 'Balanced defaults for unknown query type'
      }
    };

    const config = configs[queryType] || configs.unknown;
    logger.log(`[QueryAnalyzer] Parameters for ${queryType}:`, config);
    
    return config;
  }

  /**
   * Get a human-readable explanation of what the analyzer did
   * @param {Object} analysis - Analysis result
   * @param {Object} queryInfo - Query enhancement info
   * @param {string} selectedMethod - Selected search method
   * @returns {string} User-friendly explanation
   */
  getExplanation(analysis, queryInfo, selectedMethod) {
    const typeLabels = {
      'fact': 'Fact-finding',
      'analysis': 'Analysis',
      'creative': 'Content generation'
    };

    const methodLabels = {
      'hybrid-search': 'Hybrid Search',
      'ai-document-chat': 'AI Document Chat',
      'line-search': 'Line Search',
      'document-search': 'Document Search',
      'smart-search': 'Smart Search',
      'document-index': 'Document Index Cards',
      'ai-direct': 'AI Direct'
    };

    let explanation = `Query type: ${typeLabels[analysis.type] || 'Unknown'}\n`;
    explanation += `Search method: ${methodLabels[selectedMethod] || selectedMethod}\n`;
    
    if (queryInfo.wasImproved) {
      explanation += `Query improved: "${queryInfo.original}" → "${queryInfo.enhanced}"\n`;
      explanation += `Reason: ${queryInfo.reasoning}`;
    } else {
      explanation += `Query used as written (already clear and specific)`;
    }

    return explanation;
  }
}

export default QueryAnalyzer;
```

---

### File 2: Modify search.mjs Route

**Location**: `server/s01_server-first-app/routes/search.mjs`

**Changes**: Add query intelligence layer integration

```javascript
// ADD AT TOP (after existing imports)
import { QueryAnalyzer } from '../lib/search/QueryAnalyzer.mjs';

// ADD AFTER OTHER SERVICE INSTANCES
const queryAnalyzer = new QueryAnalyzer();

// MODIFY THE POST ROUTE - Replace existing route.post('/', ...) with:

router.post('/', requireAuthWithRateLimit(30, 60000), async (req, res) => {
  try {
    logger.log('Received request with keys:', Object.keys(req.body));
    let { 
      query, 
      score, 
      model, 
      temperature, 
      context, 
      systemPrompt, 
      systemPromptName, 
      tokenLimit, 
      topK, 
      sourceType, 
      testCode, 
      collection, 
      showChunks, 
      scoreModel, 
      searchType 
    } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // ============================================================
    // QUERY INTELLIGENCE LAYER
    // ============================================================
    
    // Detect test mode - bypass intelligence if testing
    const isTestMode = testCode != null;
    
    let queryMetadata = {
      originalQuery: query,
      wasImproved: false,
      detectedType: null,
      autoSelectedMethod: false,
      testMode: isTestMode,
      intelligenceUsed: false
    };

    // Only apply intelligence in non-test mode
    if (!isTestMode) {
      try {
        logger.log('[QueryIntelligence] Analyzing query');
        
        // Step 1: Analyze the query
        const analysis = await queryAnalyzer.analyzeQuery(query, { testMode: false });
        queryMetadata.detectedType = analysis.type;
        
        // Step 2: Improve query if needed
        const queryInfo = await queryAnalyzer.enhanceQuery(query, analysis);
        if (queryInfo.wasImproved) {
          query = queryInfo.enhanced; // Use improved version for search
          queryMetadata.wasImproved = true;
          queryMetadata.improvementReason = queryInfo.reasoning;
          logger.log('[QueryIntelligence] Query improved:', {
            original: queryInfo.original,
            enhanced: query
          });
        }
        
        // Step 3: Auto-select search method if not specified or set to 'auto'
        if (!searchType || searchType === 'auto') {
          searchType = queryAnalyzer.selectSearchMethod(analysis.type);
          queryMetadata.autoSelectedMethod = true;
          logger.log('[QueryIntelligence] Auto-selected method:', searchType);
        }
        
        // Step 4: Auto-configure parameters if not explicitly set
        const optimalParams = queryAnalyzer.getOptimalParameters(analysis.type);
        
        // Only override if user didn't explicitly set these
        if (temperature === undefined || temperature === null) {
          temperature = optimalParams.temperature;
          queryMetadata.autoConfiguredTemp = true;
        }
        if (!topK) {
          topK = optimalParams.topK;
          queryMetadata.autoConfiguredTopK = true;
        }
        if (!context) {
          context = optimalParams.context;
          queryMetadata.autoConfiguredContext = true;
        }
        if (!systemPrompt) {
          systemPrompt = optimalParams.systemPrompt;
          queryMetadata.autoConfiguredPrompt = true;
        }
        
        queryMetadata.intelligenceUsed = true;
        queryMetadata.configReasoning = optimalParams.reasoning;
        
        logger.log('[QueryIntelligence] Configuration applied:', {
          method: searchType,
          temperature,
          topK,
          context
        });
        
      } catch (error) {
        logger.error('[QueryIntelligence] Failed, using defaults:', error.message);
        // Continue with user-provided or default values on error
      }
    } else {
      logger.log('[QueryIntelligence] Test mode detected, bypassing intelligence layer');
    }

    // ============================================================
    // END QUERY INTELLIGENCE LAYER
    // ============================================================

    logger.log('Processing query:', query);
    logger.log('Scoring enabled:', score);
    logger.log('Search type:', searchType);
    logger.log('Collection:', collection);
    
    // ... REST OF EXISTING SEARCH LOGIC CONTINUES UNCHANGED ...
    
    let searchResponse;
    let searchMetrics = null;
    let chunks = null;
    let feedbackToken = null;
    let feedbackMeta = null;
    let methodResult = null;
    
    // Phase 1: Search using SearchOrchestrator
    if (collection && searchType) {
      const startTime = Date.now();
      const searchResult = await searchOrchestrator.search(query, [searchType], {
        collection,
        model,
        temperature,
        contextSize: context,
        tokenLimit,
        topK,
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
          testCode,
          queryMetadata // ADD THIS
        });
      }
      
      // ... existing response formatting logic ...
      
      // (Keep all existing formatting code for different search types)
      
      if (searchType === 'line-search' || searchType === 'document-search' || searchType === 'document-index') {
        searchResponse = methodResult.results.map((result, index) => {
          let filename = result.source && result.source.includes('.') ? result.source : 
                        result.title.includes('.') ? result.title : `${result.title}.md`;
          
          if (filename && filename.includes(':')) {
            filename = filename.split(':')[0];
          }
          
          const docCollection = result.collection || collection || 'default';
          const filenameLink = `[${result.title}](http://localhost:56306/api/documents/${docCollection}/${encodeURIComponent(filename)}/view)`;
          
          return `**Result ${index + 1}: ${filenameLink}**\n${result.excerpt}\n`;
        }).join('\n---\n\n');
      } else if (searchType === 'ai-direct') {
        searchResponse = methodResult.results.map((result, index) => {
          let filename = result.source || result.title.replace(' (No Match)', '').replace(' (Error)', '');
          
          if (filename && filename.includes(':')) {
            filename = filename.split(':')[0];
          }
          
          const docCollection = result.collection || collection || 'default';
          const filenameLink = `[${result.title}](http://localhost:56306/api/documents/${docCollection}/${encodeURIComponent(filename)}/view)`;
          
          return `**Result ${index + 1}: ${filenameLink}**\n${result.excerpt}\n---\n`;
        }).join('\n');
      } else if (searchType === 'ai-document-chat') {
        const firstResult = methodResult.results[0];
        searchResponse = firstResult.excerpt || firstResult.content || 'No content available';
        if (methodResult.feedbackToken) {
          feedbackToken = methodResult.feedbackToken;
          feedbackMeta = methodResult.feedbackMeta;
        }
      } else {
        const firstResult = methodResult.results[0];
        searchResponse = firstResult.excerpt || firstResult.content || 'No content available';
      }
      
      if (searchType === 'ai-document-chat' && methodResult.results && methodResult.results[0] && methodResult.results[0].chunks) {
        chunks = methodResult.results[0].chunks;
      } else if (methodResult.results && methodResult.results.length) {
        chunks = methodResult.results.slice(0, 8).map(r => r.excerpt || r.content || '').filter(Boolean);
      }
      
      searchMetrics = {
        model: model,
        total_duration: (endTime - startTime) * 1000000,
        load_duration: 100000000,
        eval_count: Math.floor(searchResponse.length / 4),
        eval_duration: (endTime - startTime - 100) * 1000000,
        context_size: context,
        temperature: temperature,
        topK: topK || null,
        token_limit: tokenLimit || null
      };
      
    } else {
      // For non-document searches
      const startTime = Date.now();
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: query }],
          stream: false,
          think: false,
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
      searchResponse = result.message?.content || 'No response generated';
      searchResponse = searchResponse.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      if (!searchResponse) searchResponse = 'No response generated';
      
      searchMetrics = {
        model: model,
        total_duration: result.total_duration || (Date.now() - startTime) * 1000000,
        load_duration: result.load_duration || 0,
        eval_count: result.eval_count || 0,
        eval_duration: result.eval_duration || 0,
        context_size: context,
        temperature: temperature,
        topK: topK || null,
        token_limit: tokenLimit || null
      };
    }
    
    // Phase 2: Optional Scoring (unchanged)
    let scores = null;
    let scoringMetrics = null;
    if (score && scoreModel) {
      try {
        const scoringResult = await scoringService.score(query, searchResponse, scoreModel, 0.1, 2048, chunks);
        scores = scoringResult.scores;
        scoringMetrics = scoringResult.metrics;
      } catch (error) {
        logger.error('Scoring failed:', error.message);
      }
    }
    
    // Get system information
    const deviceClient = new DeviceLicenseClient();
    const systemInfo = await deviceClient.getSystemInfo();
    
    // Build final result - ADD queryMetadata
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
      queryMetadata, // ADD THIS LINE
      ...(chunks && { chunks }),
      ...(feedbackToken && { feedbackToken, feedbackMeta }),
      ...(methodResult?.searchLog && { searchLog: methodResult.searchLog }),
      ...systemInfo
    };
    
    // Log the search activity (existing code - update to include metadata)
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

// ... rest of existing routes unchanged ...
```

---

### File 3: Modify search.html UI

**Location**: `client/c01_client-first-app/search.html`

**Changes**: Add Auto mode toggle and smart search indicator

```html
<!-- ADD AFTER EXISTING SEARCH TYPE SECTION -->

<div class="form-group" id="searchModeSection">
  <label for="searchMode">Search Mode</label>
  <div class="mode-toggle">
    <input type="radio" id="modeAuto" name="searchMode" value="auto" checked>
    <label for="modeAuto">
      <span class="mode-icon">🤖</span> Auto (Recommended)
      <span class="mode-desc">Automatically selects best method and settings</span>
    </label>
    
    <input type="radio" id="modeManual" name="searchMode" value="manual">
    <label for="modeManual">
      <span class="mode-icon">⚙️</span> Advanced
      <span class="mode-desc">Manually configure all search settings</span>
    </label>
  </div>
</div>

<!-- MODIFY EXISTING SECTIONS TO SHOW/HIDE BASED ON MODE -->
<div id="manualControlsSection" style="display: none;">
  <!-- Move existing search type, temperature, context, topK, tokens controls here -->
</div>

<!-- ADD AFTER RESULTS -->
<div id="smartSearchInfo" style="display: none;" class="smart-search-details">
  <h3>🤖 Smart Search Details</h3>
  <div class="details-content">
    <p><strong>Query type:</strong> <span id="detectedType"></span></p>
    <p><strong>Search method:</strong> <span id="selectedMethod"></span></p>
    <p id="queryImprovedInfo" style="display: none;">
      <strong>Query improved:</strong><br>
      Original: "<span id="originalQuery"></span>"<br>
      Enhanced: "<span id="enhancedQuery"></span>"
    </p>
    <p><strong>Configuration:</strong> <span id="configDetails"></span></p>
  </div>
</div>

<!-- ADD STYLES -->
<style>
.mode-toggle {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.mode-toggle input[type="radio"] {
  display: none;
}

.mode-toggle label {
  flex: 1;
  min-width: 200px;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mode-toggle input[type="radio"]:checked + label {
  border-color: var(--primary);
  background: var(--primary-bg);
}

.mode-toggle label:hover {
  border-color: var(--primary);
}

.mode-icon {
  font-size: 1.5rem;
}

.mode-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.smart-search-details {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--card-bg);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
}

.smart-search-details .details-content {
  margin-top: 0.5rem;
}

.smart-search-details p {
  margin: 0.5rem 0;
}
</style>
```

---

### File 4: Modify search.js to Handle Auto Mode

**Location**: `client/c01_client-first-app/search.js`

**Changes**: Add mode toggle handling and metadata display

```javascript
// ADD AFTER EXISTING ELEMENT DEFINITIONS
const searchModeSection = document.getElementById('searchModeSection');
const modeAutoRadio = document.getElementById('modeAuto');
const modeManualRadio = document.getElementById('modeManual');
const manualControlsSection = document.getElementById('manualControlsSection');
const smartSearchInfo = document.getElementById('smartSearchInfo');

// ADD EVENT LISTENERS FOR MODE TOGGLE
document.addEventListener('DOMContentLoaded', () => {
  // ... existing DOMContentLoaded code ...
  
  // Mode toggle handler
  if (modeAutoRadio && modeManualRadio) {
    modeAutoRadio.addEventListener('change', handleModeChange);
    modeManualRadio.addEventListener('change', handleModeChange);
    
    // Initialize to Auto mode
    handleModeChange();
  }
});

// ADD MODE CHANGE HANDLER
function handleModeChange() {
  const isAutoMode = modeAutoRadio && modeAutoRadio.checked;
  
  if (manualControlsSection) {
    manualControlsSection.style.display = isAutoMode ? 'none' : 'block';
  }
  
  // In auto mode, hide search type dropdown
  if (searchTypeSection) {
    searchTypeSection.style.display = isAutoMode ? 'none' : 'block';
  }
}

// MODIFY EXISTING FORM SUBMIT HANDLER
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const isAutoMode = modeAutoRadio && modeAutoRadio.checked;
  
  const requestBody = {
    query: queryEl.value.trim(),
    model: modelEl.value,
    score: scoreTglEl.checked,
    scoreModel: scoreTglEl.checked ? (window.scoreModelEl?.value || null) : null,
    sourceType: sourceTypeEl.value,
    collection: collectionEl.value || null,
    searchType: isAutoMode ? 'auto' : (searchTypeEl.value || null), // ADD AUTO MODE
    // ... rest of existing request body ...
  };
  
  // Only include manual parameters if not in auto mode
  if (!isAutoMode) {
    requestBody.temperature = parseFloat(temperatureEl.value);
    requestBody.context = parseInt(contextEl.value);
    requestBody.topK = parseInt(topkEl.value);
    requestBody.tokens = tokensEl.value;
  }
  
  // ... existing fetch and response handling ...
  
  // ADD METADATA DISPLAY AFTER RESULTS
  if (data.queryMetadata) {
    displayQueryMetadata(data.queryMetadata, data.query);
  }
});

// ADD METADATA DISPLAY FUNCTION
function displayQueryMetadata(metadata, finalQuery) {
  if (!smartSearchInfo) return;
  
  if (!metadata.intelligenceUsed) {
    smartSearchInfo.style.display = 'none';
    return;
  }
  
  smartSearchInfo.style.display = 'block';
  
  // Query type
  const typeLabels = {
    'fact': 'Fact-finding',
    'analysis': 'Analysis',
    'creative': 'Content generation'
  };
  document.getElementById('detectedType').textContent = 
    typeLabels[metadata.detectedType] || 'Unknown';
  
  // Selected method
  const methodLabels = {
    'hybrid-search': 'Hybrid Search',
    'ai-document-chat': 'AI Document Chat',
    'line-search': 'Line Search',
    'document-search': 'Document Search',
    'smart-search': 'Smart Search',
    'document-index': 'Document Index Cards',
    'ai-direct': 'AI Direct'
  };
  document.getElementById('selectedMethod').textContent = 
    methodLabels[metadata.autoSelectedMethod] || 'Unknown';
  
  // Query improvement
  const queryImprovedInfo = document.getElementById('queryImprovedInfo');
  if (metadata.wasImproved) {
    queryImprovedInfo.style.display = 'block';
    document.getElementById('originalQuery').textContent = metadata.originalQuery;
    document.getElementById('enhancedQuery').textContent = finalQuery;
  } else {
    queryImprovedInfo.style.display = 'none';
  }
  
  // Configuration details
  const configParts = [];
  if (metadata.autoConfiguredTemp) configParts.push('Temperature');
  if (metadata.autoConfiguredTopK) configParts.push('TopK');
  if (metadata.autoConfiguredContext) configParts.push('Context');
  if (metadata.autoConfiguredPrompt) configParts.push('System Prompt');
  
  const configText = configParts.length > 0 
    ? `Auto-configured: ${configParts.join(', ')}`
    : 'Using default settings';
  
  document.getElementById('configDetails').textContent = configText;
  
  if (metadata.configReasoning) {
    document.getElementById('configDetails').textContent += 
      `\nReason: ${metadata.configReasoning}`;
  }
}
```

---

### File 5: Test Query Intelligence Page (NEW)

**Location**: `client/c01_client-first-app/test-query-intelligence.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Query Intelligence - AI Private Search</title>
  <link rel="stylesheet" href="shared/styles.css">
  <script type="module" src="shared/common.js"></script>
  <style>
    .test-container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 2rem;
    }
    
    .test-form {
      background: var(--card-bg);
      padding: 2rem;
      border-radius: var(--radius);
      margin-bottom: 2rem;
    }
    
    .result-card {
      background: var(--card-bg);
      padding: 1.5rem;
      border-radius: var(--radius);
      margin-bottom: 1rem;
      border-left: 4px solid var(--primary);
    }
    
    .result-label {
      font-weight: bold;
      color: var(--primary);
      margin-bottom: 0.5rem;
    }
    
    .improvement-comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-top: 1rem;
    }
    
    .query-box {
      padding: 1rem;
      background: var(--bg-color);
      border-radius: var(--radius);
      border: 1px solid var(--border-color);
    }
    
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.85rem;
      font-weight: 600;
      margin-left: 0.5rem;
    }
    
    .badge-fact { background: #3498db; color: white; }
    .badge-analysis { background: #9b59b6; color: white; }
    .badge-creative { background: #e74c3c; color: white; }
    .badge-good { background: #27ae60; color: white; }
    .badge-improve { background: #f39c12; color: white; }
  </style>
</head>
<body>
  <div id="header-placeholder"></div>
  
  <div class="test-container">
    <h1>🧪 Test Query Intelligence</h1>
    <p>Test how the query analyzer categorizes and improves queries without running actual searches.</p>
    
    <div class="test-form">
      <h2>Enter Test Query</h2>
      <textarea id="testQuery" rows="3" placeholder="Enter a query to analyze..." style="width: 100%; padding: 0.75rem; border-radius: var(--radius); border: 1px solid var(--border-color);"></textarea>
      <button id="analyzeBtn" class="btn btn-primary" style="margin-top: 1rem;">Analyze Query</button>
    </div>
    
    <div id="results" style="display: none;">
      <h2>Analysis Results</h2>
      
      <div class="result-card">
        <div class="result-label">Query Type</div>
        <div id="queryType"></div>
      </div>
      
      <div class="result-card">
        <div class="result-label">Quality Assessment</div>
        <div id="qualityAssessment"></div>
      </div>
      
      <div class="result-card" id="improvementCard" style="display: none;">
        <div class="result-label">Query Improvement</div>
        <div class="improvement-comparison">
          <div class="query-box">
            <strong>Original:</strong>
            <p id="originalQuery"></p>
          </div>
          <div class="query-box">
            <strong>Improved:</strong>
            <p id="improvedQuery"></p>
          </div>
        </div>
        <p id="improvementReason" style="margin-top: 1rem; color: var(--text-muted);"></p>
      </div>
      
      <div class="result-card">
        <div class="result-label">Recommended Search Method</div>
        <div id="recommendedMethod"></div>
      </div>
      
      <div class="result-card">
        <div class="result-label">Recommended Parameters</div>
        <div id="recommendedParams"></div>
      </div>
    </div>
  </div>
  
  <div id="footer-placeholder"></div>
  
  <script>
    const testQueryEl = document.getElementById('testQuery');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultsEl = document.getElementById('results');
    
    analyzeBtn.addEventListener('click', async () => {
      const query = testQueryEl.value.trim();
      if (!query) {
        alert('Please enter a query to analyze');
        return;
      }
      
      analyzeBtn.disabled = true;
      analyzeBtn.textContent = 'Analyzing...';
      
      try {
        // Call analyzer endpoint (needs to be added to routes)
        const response = await fetch(`${window.API_BASE_URL}/api/search/analyze-query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });
        
        const data = await response.json();
        displayResults(query, data);
        
      } catch (error) {
        alert('Analysis failed: ' + error.message);
      } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze Query';
      }
    });
    
    function displayResults(query, data) {
      resultsEl.style.display = 'block';
      
      // Query type
      const typeLabels = {
        'fact': { label: 'Fact-finding', badge: 'badge-fact' },
        'analysis': { label: 'Analysis', badge: 'badge-analysis' },
        'creative': { label: 'Content Generation', badge: 'badge-creative' }
      };
      const type = typeLabels[data.analysis.type] || { label: 'Unknown', badge: '' };
      document.getElementById('queryType').innerHTML = 
        `${type.label} <span class="badge ${type.badge}">${data.analysis.type}</span>`;
      
      // Quality
      const qualityLabels = {
        'good': { label: 'Good (clear and specific)', badge: 'badge-good' },
        'needs-improvement': { label: 'Needs Improvement', badge: 'badge-improve' }
      };
      const quality = qualityLabels[data.analysis.quality] || { label: 'Unknown', badge: '' };
      document.getElementById('qualityAssessment').innerHTML = 
        `${quality.label} <span class="badge ${quality.badge}">${data.analysis.quality}</span>`;
      
      // Improvement
      if (data.improved.wasImproved) {
        document.getElementById('improvementCard').style.display = 'block';
        document.getElementById('originalQuery').textContent = data.improved.original;
        document.getElementById('improvedQuery').textContent = data.improved.enhanced;
        document.getElementById('improvementReason').textContent = 
          'Reason: ' + data.improved.reasoning;
      } else {
        document.getElementById('improvementCard').style.display = 'none';
      }
      
      // Recommended method
      const methodLabels = {
        'hybrid-search': 'Hybrid Search',
        'ai-document-chat': 'AI Document Chat',
        'line-search': 'Line Search'
      };
      document.getElementById('recommendedMethod').textContent = 
        methodLabels[data.recommendedMethod] || data.recommendedMethod;
      
      // Recommended params
      const params = data.recommendedParams;
      document.getElementById('recommendedParams').innerHTML = `
        <p><strong>Temperature:</strong> ${params.temperature}</p>
        <p><strong>TopK:</strong> ${params.topK}</p>
        <p><strong>Context:</strong> ${params.context}</p>
        <p><strong>System Prompt:</strong> ${params.systemPrompt}</p>
        <p style="color: var(--text-muted); margin-top: 0.5rem;"><em>${params.reasoning}</em></p>
      `;
    }
  </script>
</body>
</html>
```

---

### File 6: Add Analyze Query Endpoint to Routes

**Location**: `server/s01_server-first-app/routes/search.mjs`

**Add this endpoint** (after the main POST route):

```javascript
// New endpoint for testing query intelligence without running search
router.post('/analyze-query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Analyze query
    const analysis = await queryAnalyzer.analyzeQuery(query, { testMode: false });
    
    // Get improvements
    const improved = await queryAnalyzer.enhanceQuery(query, analysis);
    
    // Get recommendations
    const recommendedMethod = queryAnalyzer.selectSearchMethod(analysis.type);
    const recommendedParams = queryAnalyzer.getOptimalParameters(analysis.type);
    
    res.json({
      original: query,
      analysis: analysis,
      improved: improved,
      recommendedMethod: recommendedMethod,
      recommendedParams: recommendedParams
    });
    
  } catch (error) {
    logger.error('Query analysis endpoint error:', error.message);
    res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message 
    });
  }
});
```

---

## Testing Plan

### Phase 1: Unit Testing

**Test 1: Query Type Detection**
```javascript
Test queries:
- "which clients have durable power of attorney" → expect: fact
- "how many wills were signed in 2024" → expect: fact
- "summarize all estate planning documents" → expect: analysis
- "draft a cover letter based on resume" → expect: creative
- "clients with POA" → expect: fact (vague but still factual intent)
```

**Test 2: Query Improvement**
```javascript
Test queries:
- "clients with POA" → expect: improved to "Which clients have power of attorney documents?"
- "how many" → expect: improved to add context
- "What are the key terms in our trust documents?" → expect: no improvement (already good)
```

**Test 3: Method Selection**
```javascript
Expected mappings:
- fact queries → hybrid-search
- analysis queries → ai-document-chat
- creative queries → ai-document-chat
```

**Test 4: Test Mode Bypass**
```javascript
Request with testCode: "TEST-001"
- Expect: intelligenceUsed = false
- Expect: query used exactly as written
- Expect: method used exactly as specified
```

---

### Phase 2: Integration Testing

**Test 1: End-to-End Auto Mode**
1. Open `search.html`
2. Select "Auto" mode
3. Enter: "clients with POA"
4. Submit search
5. Verify:
   - Query shown as improved
   - Method auto-selected as hybrid-search
   - Results show list of clients with POA
   - Smart Search Details visible

**Test 2: Manual Mode Override**
1. Select "Advanced" mode
2. Choose "AI Document Chat" manually
3. Enter: "which clients have POA"
4. Submit search
5. Verify:
   - Query used as-is
   - AI Document Chat used (user's choice)
   - No auto-selection metadata shown

**Test 3: Test Page Compatibility**
1. Open `test-collections.html`
2. Run existing test with testCode
3. Verify:
   - Test runs exactly as before
   - No query improvement
   - Method used as specified in test
   - Scores comparable to previous runs

---

### Phase 3: User Acceptance Testing

**Scenario 1: Non-Technical User (Fact Query)**
- User: Medical office staff
- Query: "patients with diabetes"
- Expected: Auto-selects hybrid-search, returns patient list

**Scenario 2: Non-Technical User (Analysis Query)**
- User: Law firm paralegal
- Query: "summarize Smith family estate plan"
- Expected: Auto-selects AI Document Chat, returns comprehensive summary

**Scenario 3: Power User**
- User: Developer running tests
- Uses test page with testCode
- Expected: Intelligence layer bypassed, exact test conditions preserved

---

## Configuration

### Model Selection for Query Analysis

The QueryAnalyzer uses `gemma2:2b` by default. This can be changed:

```javascript
// In QueryAnalyzer.mjs constructor
this.analysisModel = 'gemma2:2b'; // Fast, accurate, already installed (1.6GB)

// Alternatives (if you have them installed):
// 'qwen3.5:3b' - Good balance (2GB)
// 'llama3.2:3b' - Good balance (2GB)
// 'qwen3.5:9b' - More accurate but slower (6.6GB)
// 'mistral:7b' - General purpose (4.4GB)
```

**Recommendation**: Stick with `gemma2:2b` — it's the fastest model (1-3 seconds), excellent at structured JSON output, and perfect for query classification tasks.

---

## Performance Impact

### Added Latency

| Component | Time Added | When |
|-----------|------------|------|
| Query analysis | +1-3 seconds | Every non-test search |
| Query improvement | +0 seconds | Included in analysis |
| Method selection | +0 seconds | Computation only |
| Parameter config | +0 seconds | Computation only |
| **Total** | **+1-3 seconds** | Per search in Auto mode |

### Mitigation Strategies

1. **Test mode bypass**: No latency in test mode
2. **Manual mode bypass**: Power users can disable intelligence
3. **Fast analysis model**: gemma2:2b is optimized for speed (1-3 seconds)
4. **Parallel processing opportunity**: Future enhancement could run analysis while loading collection metadata

---

## Rollout Plan

### Stage 1: Backend Only (Week 1)
- Deploy QueryAnalyzer.mjs
- Deploy modified search route
- Test with API calls
- Monitor error rates and latency

### Stage 2: UI with Opt-In (Week 2)
- Deploy UI changes with Auto mode
- Default to Manual mode initially
- Add banner: "Try Auto mode for smarter searches"
- Collect user feedback

### Stage 3: Auto Mode Default (Week 3)
- Switch default to Auto mode
- Keep Advanced mode easily accessible
- Monitor usage patterns
- Refine routing rules based on real queries

### Stage 4: Optimization (Week 4)
- Analyze which query patterns are most common
- Fine-tune the analysis prompt based on real data
- Consider caching analysis for repeated queries
- Add analytics dashboard for intelligence layer performance

---

## Success Metrics

### Quantitative

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Query improvement rate | 30-40% of queries improved | Count `wasImproved: true` |
| Auto-selection accuracy | 85%+ users don't override | Track manual method changes after auto-select |
| Search success rate | +20% vs current | Compare "no results" rate before/after |
| User adoption of Auto mode | 70%+ use Auto mode | Track mode selection in search logs |

### Qualitative

- User feedback: "I don't have to think about which search type to use"
- Support ticket reduction: Fewer "wrong search results" complaints
- Test compatibility: No regression in test result comparability

---

## Risk Mitigation

### Risk 1: Analysis Model Unavailable

**Impact**: Searches fail completely  
**Mitigation**: Fallback to safe defaults on error

```javascript
// Already implemented in QueryAnalyzer.analyzeQuery catch block
return {
  type: 'analysis',
  quality: 'good',
  improved_query: null,
  reasoning: 'Analysis failed, using defaults'
};
```

### Risk 2: Bad Query Improvements

**Impact**: User's query is "improved" but becomes worse  
**Mitigation**: 
- Always show original query
- Allow user to see what changed
- Easy override in Advanced mode

### Risk 3: Test Mode Detection Failure

**Impact**: Test results become incomparable  
**Mitigation**:
- Simple detection: `testCode != null`
- Log test mode status in results
- Add test mode indicator in UI

### Risk 4: Performance Degradation

**Impact**: Searches take too long  
**Mitigation**:
- Use fast analysis model (gemma2:2b)
- Monitor latency metrics
- Consider caching for repeated queries
- Allow users to disable via Manual mode

---

## Future Enhancements

### Phase 2 Features (Post-Launch)

1. **Learning from User Overrides**
   - Track when users manually change method after auto-selection
   - Use this data to refine routing rules
   - "Users who search for X usually prefer method Y"

2. **Query Templates**
   - Pre-built query templates for common patterns
   - "Find all documents with [X]"
   - "Compare [document A] with [document B]"
   - "Summarize [topic] across all documents"

3. **Multi-Stage Search**
   - Run hybrid search first to find relevant docs
   - Then run AI Document Chat on just those docs
   - Best of both worlds: precision + synthesis

4. **Query History Learning**
   - Remember user's preferred methods for similar queries
   - "Last time you searched for X, you used Y method"
   - Personalized auto-selection

5. **Bulk Query Analysis**
   - Analyze multiple queries at once
   - Useful for batch testing
   - Generate optimization report

---

## Documentation Updates Required

### User-Facing Documentation

1. **sys-aips-user-guide.md**
   - Add section on Auto vs Advanced mode
   - Explain Smart Search Details display
   - Show examples of query improvement

2. **sys-aips-search-methods.md**
   - Add section on automatic method selection
   - Decision tree diagram
   - When to use Advanced mode

3. **sys-aips-troubleshooting.md**
   - "Auto mode selected wrong method" → how to override
   - "Query was changed but I want original" → Advanced mode
   - Performance issues → consider Manual mode

### Developer Documentation

1. **sys-aips-api.md**
   - Document `queryMetadata` response field
   - Document `searchType: 'auto'` option
   - Document `testMode` behavior

2. **sys-aips-architecture.md**
   - Add Query Intelligence Layer to architecture diagram
   - Explain QueryAnalyzer component
   - Document test mode bypass logic

3. **sys-aips-contributing.md**
   - How to modify query routing rules
   - How to add new query type patterns
   - How to test the intelligence layer

---

## Appendix A: Query Type Detection Patterns

### Fact-Based Patterns

```javascript
// Regex patterns that indicate fact-finding queries
/^(which|who|what|when|where|how many|list all|find all)/i
/"[^"]+"/ // Quoted phrases = exact match intent
/(show|display|get) (me )?all/i
/is there|are there|does|do any/i
```

### Analysis Patterns

```javascript
/summarize|summary/i
/compare|contrast|difference/i
/analyze|analysis|examine/i
/explain|describe|what are/i
/pattern|theme|trend/i
/overview|comprehensive/i
```

### Creative Patterns

```javascript
/draft|write|create|generate|compose/i
/(help me )?(build|make|design)/i
/letter|email|memo|report/i
/checklist|template|outline/i
```

---

## Appendix B: Example Queries and Expected Routing

| Query | Type | Method | Reasoning |
|-------|------|--------|-----------|
| "which clients have durable power of attorney" | fact | hybrid-search | "which" keyword + seeking list |
| "clients with POA" | fact | hybrid-search | Factual intent (improved to "which clients...") |
| "how many wills were signed in 2024" | fact | hybrid-search | "how many" = counting query |
| "what is the exact arbitration clause" | fact | line-search | "exact" = precision required (future enhancement) |
| "summarize all estate planning documents" | analysis | ai-document-chat | "summarize" = synthesis needed |
| "compare Smith trust with Jones trust" | analysis | ai-document-chat | "compare" = analysis across docs |
| "what are common terms in our contracts" | analysis | ai-document-chat | "what are" pattern + aggregation |
| "draft a cover letter from resume" | creative | ai-document-chat | "draft" = content generation |
| "write a summary for client" | creative | ai-document-chat | "write" = creation task |
| "client documents" | unknown | hybrid-search | Vague, default to safe method |

---

## Appendix C: Parameter Configuration Rationale

### Temperature Settings

| Query Type | Temperature | Why |
|------------|-------------|-----|
| Fact | 0.1 | Low randomness = consistent factual output |
| Analysis | 0.3 | Some creativity for synthesis, but grounded |
| Creative | 0.7 | Higher creativity for generation tasks |

### TopK Settings

| Query Type | TopK | Why |
|------------|------|-----|
| Fact | 10 | Focused retrieval of best matches |
| Analysis | 15 | Broader context for comprehensive synthesis |
| Creative | 10 | Sufficient grounding without overwhelming model |

### Context Window Settings

| Query Type | Context | Why |
|------------|---------|-----|
| Fact | 4096 | Smaller window for focused answers |
| Analysis | 8192 | Larger window for multi-document synthesis |
| Creative | 8192 | Large window for comprehensive source material |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-09-15 | Initial specification |

---

**Next Steps**:
1. Review this specification with stakeholders
2. Approve for implementation
3. Create GitHub issues for each phase
4. Begin Phase 1 implementation
5. Schedule review after Phase 1 completion

**Estimated Total Implementation Time**: 8-10 hours across 3 phases
