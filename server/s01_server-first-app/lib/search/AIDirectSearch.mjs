import fs from 'fs/promises';
import path from 'path';

export class AIDirectSearch {
  constructor() {
    this.name = 'AI Direct Search';
    this.description = 'Question-answering models for contextual understanding';
  }

  async search(query, options = {}) {
    const { collection = null, model = 'qwen2:0.5b' } = options;
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
      
      return {
        results: results.sort((a, b) => b.score - a.score),
        method: 'ai-direct',
        total: results.length
      };
    } catch (error) {
      throw new Error(`AI Direct search failed: ${error.message}`);
    }
  }

  async getCollections(documentsPath) {
    const collections = [];
    const entries = await fs.readdir(documentsPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const collectionPath = path.join(documentsPath, entry.name);
        const files = await fs.readdir(collectionPath);
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
      const content = await fs.readFile(filePath, 'utf-8');
      
      const aiResult = await this.performAISearch(content, query, filename, options?.model || 'qwen2:0.5b');
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

  async performAISearch(documentContent, query, filename, model = 'qwen2:0.5b') {
    try {
      // Use Ollama for actual AI inference
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          prompt: `Document: ${filename}\n\nContent: ${documentContent.substring(0, 1500)}\n\nQuestion: ${query}\n\nAnswer briefly based on the document content:`,
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 100
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      return {
        id: `ai_${filename}_${Date.now()}`,
        title: `AI Analysis: ${filename}`,
        excerpt: result.response || 'No response generated',
        score: 0.85,
        source: `Ollama ${model} analysis of ${filename}`
      };
    } catch (error) {
      throw new Error(`Ollama API unavailable: ${error.message}`);
    }
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

  calculateAIConfidence(query, context) {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contextLower = context.toLowerCase();
    
    let matches = 0;
    for (const word of queryWords) {
      if (contextLower.includes(word)) {
        matches++;
      }
    }
    
    const baseScore = matches / queryWords.length;
    return Math.min(baseScore + 0.2, 0.95);
  }
}