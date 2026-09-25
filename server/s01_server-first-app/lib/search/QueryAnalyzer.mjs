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
