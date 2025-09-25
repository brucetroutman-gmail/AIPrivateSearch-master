import { secureFs } from '../utils/secureFileOps.mjs';
import path from 'path';
import natural from 'natural';
const { TfIdf } = natural;
import { TraditionalSearch } from './TraditionalSearch.mjs';
import { VectorSearchSimple } from './VectorSearchSimple.mjs';

export class HybridSearch {
  constructor() {
    this.name = 'Hybrid Search';
    this.description = 'Combined traditional and vector methods';
    this.traditionalSearch = new TraditionalSearch();
    this.vectorSearch = new VectorSearchSimple();
    this.tfidf = new TfIdf();
    this.documents = new Map();
    this.initialized = false;
  }

  async search(query, options = {}) {
    const { collection = null, keywordWeight = 0.3, semanticWeight = 0.7, topK = 5 } = options;
    
    try {
      console.log(`Hybrid search for: "${query}" in ${collection}`);
      
      await this.ensureInitialized(collection);
      
      // Get results from both methods
      const keywordResults = await this.getKeywordResults(query, collection, topK * 2);
      const semanticResults = await this.getSemanticResults(query, collection, topK * 2);
      
      // Combine and rerank results
      const combinedResults = this.combineResults(
        keywordResults,
        semanticResults,
        keywordWeight,
        semanticWeight
      );
      
      return {
        results: combinedResults.slice(0, topK).map(doc => ({
          id: doc.id,
          title: doc.filename,
          excerpt: doc.content.substring(0, 200) + '...',
          score: doc.hybridScore,
          source: doc.filename,
          breakdown: {
            keyword: doc.keywordScore,
            semantic: doc.semanticScore,
            weights: { keywordWeight, semanticWeight }
          }
        })),
        method: 'hybrid',
        total: combinedResults.length
      };
    } catch (error) {
      throw new Error(`Hybrid search failed: ${error.message}`);
    }
  }

  async ensureInitialized(collection) {
    if (!this.initialized) {
      await this.indexCollection(collection);
      this.initialized = true;
    }
  }

  async indexCollection(collection) {
    const documentsPath = path.join(process.cwd(), '../../sources/local-documents');
    const collectionPath = path.join(documentsPath, collection);
    
    const files = await secureFs.readdir(collectionPath);
    const documentFiles = files.filter(file => 
      file.endsWith('.md') && !file.startsWith('META_')
    );
    
    console.log(`Indexing ${documentFiles.length} documents for hybrid search`);
    
    for (const filename of documentFiles) {
      const filePath = path.join(collectionPath, filename);
      const content = await secureFs.readFile(filePath, 'utf-8');
      
      const documentId = `${collection}_${filename}`;
      this.documents.set(documentId, {
        id: documentId,
        filename,
        content,
        collection
      });
      
      // Add to TF-IDF index
      this.tfidf.addDocument(content);
    }
  }

  async getKeywordResults(query, collection, limit) {
    const results = [];
    const queryTerms = query.toLowerCase().split(/\s+/);
    const documentArray = Array.from(this.documents.values());
    
    documentArray.forEach((document, index) => {
      if (document.collection !== collection) return;
      
      let score = 0;
      
      // TF-IDF scoring
      queryTerms.forEach(term => {
        score += this.tfidf.tfidf(term, index);
      });
      
      // Exact match bonus
      if (document.content.toLowerCase().includes(query.toLowerCase())) {
        score += 0.5;
      }
      
      // Word match bonus
      const contentWords = document.content.toLowerCase().split(/\s+/);
      queryTerms.forEach(term => {
        if (contentWords.includes(term)) {
          score += 0.2;
        }
      });
      
      if (score > 0) {
        results.push({
          ...document,
          keywordScore: score
        });
      }
    });
    
    return results
      .sort((a, b) => b.keywordScore - a.keywordScore)
      .slice(0, limit);
  }

  async getSemanticResults(query, collection, limit) {
    const vectorResults = await this.vectorSearch.search(query, { collection, topK: limit });
    
    return vectorResults.results.map(result => ({
      id: result.id,
      filename: result.title,
      content: result.excerpt.replace('...', ''), // Remove truncation marker
      collection,
      semanticScore: result.score
    }));
  }

  combineResults(keywordResults, semanticResults, keywordWeight, semanticWeight) {
    const combinedScores = new Map();
    
    // Normalize keyword scores (0-1 range)
    const maxKeywordScore = Math.max(...keywordResults.map(r => r.keywordScore), 0.001);
    keywordResults.forEach(result => {
      const normalizedScore = result.keywordScore / maxKeywordScore;
      combinedScores.set(result.id, {
        ...result,
        keywordScore: normalizedScore,
        semanticScore: 0
      });
    });
    
    // Add semantic scores (already 0-1 range)
    semanticResults.forEach(result => {
      const existing = combinedScores.get(result.id);
      if (existing) {
        existing.semanticScore = result.semanticScore;
      } else {
        combinedScores.set(result.id, {
          ...result,
          keywordScore: 0,
          semanticScore: result.semanticScore
        });
      }
    });
    
    // Calculate hybrid scores
    return Array.from(combinedScores.values())
      .map(item => ({
        ...item,
        hybridScore: (item.keywordScore * keywordWeight) + (item.semanticScore * semanticWeight)
      }))
      .sort((a, b) => b.hybridScore - a.hybridScore);
  }
}