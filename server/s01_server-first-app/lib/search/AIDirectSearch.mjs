import { secureFs } from '../utils/secureFileOps.mjs';
import path from 'path';

export class AIDirectSearch {
  constructor() {
    this.name = 'AI Direct Search';
    this.description = 'Question-answering models for contextual understanding';
  }

  async search(query, options = {}) {
    const { collection = null, model = 'qwen2:0.5b', temperature = 0.3, contextSize = 1024, tokenLimit = null } = options;
    const results = [];
    
    try {
      const documentsPath = path.join(process.cwd(), '../../sources/local-documents');
      let collections = await this.getCollections(documentsPath);
      
      if (collection) {
        collections = collections.filter(c => c.name === collection);
      }
      
      for (const coll of collections) {
        const collectionResults = await this.searchInCollection(coll, query, options);
        results.push(...collectionResults);
      }
      
      // Separate matches from no-matches and sort each group
      const matches = results.filter(r => r.hasMatch).sort((a, b) => b.score - a.score);
      const noMatches = results.filter(r => !r.hasMatch).sort((a, b) => a.title.localeCompare(b.title));
      
      return {
        results: [...matches, ...noMatches],
        method: 'ai-direct',
        total: results.length,
        matchCount: matches.length,
        noMatchCount: noMatches.length
      };
    } catch (error) {
      throw new Error(`AI Direct search failed: ${error.message}`);
    }
  }

  async getCollections(documentsPath) {
    const collections = [];
    const entries = await secureFs.readdir(documentsPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const collectionPath = path.join(documentsPath, entry.name);
        const files = await secureFs.readdir(collectionPath);
        const documentFiles = files.filter(file => 
          !file.startsWith('META_') && 
          file.endsWith('.md')
        );
        
        collections.push({
          name: entry.name,
          path: collectionPath,
          files: documentFiles
        });
      }
    }
    
    return collections;
  }

  async searchInCollection(collection, query, options = {}) {
    // Process files in parallel for better performance
    const filePromises = collection.files.map(async (filename) => {
      const filePath = path.join(collection.path, filename);
      const content = await secureFs.readFile(filePath, 'utf-8');
      
      const aiResult = await this.performAISearch(
        content, 
        query, 
        filename, 
        options?.model || 'qwen2:0.5b',
        options?.temperature || 0.3,
        options?.contextSize || 1024,
        options?.tokenLimit || null
      );
      if (aiResult) {
        return {
          ...aiResult,
          collection: collection.name
        };
      }
      return null;
    });
    
    const results = await Promise.all(filePromises);
    return results.filter(result => result !== null);
  }

  async performAISearch(documentContent, query, filename, model = 'qwen2:0.5b', temperature = 0.3, contextSize = 1024, tokenLimit = null) {
    const options = {
      temperature: temperature,
      num_ctx: contextSize
    };
    
    if (tokenLimit && tokenLimit !== 'No Limit') {
      options.num_predict = parseInt(tokenLimit);
    }
    
    // Enhanced prompt for better relevance assessment
    const enhancedPrompt = `Document: ${filename}
Content: ${documentContent.substring(0, 1500)}

Question: ${query}

Instructions: Analyze this document and answer the question. If the document contains relevant information, provide a detailed answer. If the document does not contain relevant information, respond with "NO_MATCH: This document does not contain information about ${query}."

Answer:`;
    
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: enhancedPrompt,
        stream: false,
        options: options
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }
    
    const result = await response.json();
    const aiResponse = result.response || 'No response generated';
    
    // Determine if this is a match or no-match
    const isNoMatch = aiResponse.startsWith('NO_MATCH:');
    const relevanceScore = this.calculateRelevanceScore(query, documentContent, aiResponse, isNoMatch);
    
    return {
      id: `ai_${filename}_${Date.now()}`,
      title: isNoMatch ? `${filename} (No Match)` : `${filename}`,
      excerpt: aiResponse,
      score: relevanceScore,
      source: `Ollama ${model} analysis of ${filename}`,
      hasMatch: !isNoMatch
    };
  }

  generateAIResponse(query, context) {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('capital')) {
      if (context.toLowerCase().includes('paris')) {
        return 'Based on the document content, Paris is mentioned as the capital of France.';
      }
      return `The document contains references to "${query}" in governmental or financial contexts.`;
    }
    
    return `Based on document analysis, the content addresses "${query}" within the broader textual context.`;
  }

  calculateRelevanceScore(query, documentContent, aiResponse, isNoMatch) {
    if (isNoMatch) {
      return 0.1; // Low score for no matches
    }
    
    // Calculate relevance based on query terms in content and response quality
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentLower = documentContent.toLowerCase();
    const responseLower = aiResponse.toLowerCase();
    
    let contentMatches = 0;
    let responseMatches = 0;
    
    for (const word of queryWords) {
      if (contentLower.includes(word)) contentMatches++;
      if (responseLower.includes(word)) responseMatches++;
    }
    
    const contentScore = contentMatches / queryWords.length;
    const responseScore = responseMatches / queryWords.length;
    const responseLength = Math.min(aiResponse.length / 100, 1); // Longer responses get higher scores
    
    // Combine scores with weights
    const finalScore = (contentScore * 0.4) + (responseScore * 0.4) + (responseLength * 0.2);
    return Math.min(Math.max(finalScore, 0.5), 0.95); // Ensure matches get at least 0.5
  }
}