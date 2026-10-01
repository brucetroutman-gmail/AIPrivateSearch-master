 
 
import { secureFs } from '../utils/secureFileOps.mjs';
import { CollectionsUtil } from '../utils/collectionsUtil.mjs';
import { SetupGuidance } from '../utils/setupGuidance.mjs';
import path from 'path';
import natural from 'natural';
const { TfIdf } = natural;
import { LineSearch } from './LineSearch.mjs';
import { SmartSearch } from './SmartSearch.mjs';

export class HybridSearch {
  constructor() {
    this.name = 'Hybrid Search';
    this.description = 'Combined traditional and vector methods';
    this.traditionalSearch = new LineSearch();
    this.vectorSearch = new SmartSearch();
    this.tfidf = new TfIdf();
    this.documents = new Map();
    this.indexedCollection = null;
  }

  async search(query, options = {}) {
    const { collection = null, keywordWeight = 0.3, semanticWeight = 0.7, topK = 5 } = options;
    
    try {
      console.log(`Hybrid search for: "${query}" in ${collection}`);
      
      await this.ensureInitialized(collection);
      
      // Get results from both methods
      const keywordResults = await this.getKeywordResults(query, collection, topK * 2);
      const semanticResults = await this.getSemanticResults(query, collection, topK * 2);
      
      // Check if no semantic results due to missing embeddings
      if (semanticResults.length === 0 && keywordResults.length === 0) {
        return SetupGuidance.createHybridEmbeddingsRequiredResult(collection);
      }
      
      // Combine and rerank results
      const combinedResults = this.combineResults(
        keywordResults,
        semanticResults,
        keywordWeight,
        semanticWeight
      );
      
      return {
        results: combinedResults.slice(0, topK).map(doc => {
          const documentPath = `http://localhost:56306/api/documents/${doc.collection}/${encodeURIComponent(doc.filename)}/view`;
          const scoreBreakdown = `**Hybrid Score: ${Math.round(doc.hybridScore * 100)}%**\n` +
            `Keyword: ${Math.round(doc.keywordScore * 100)}% × ${keywordWeight} + ` +
            `Semantic: ${Math.round(doc.semanticScore * 100)}% × ${semanticWeight}`;
          const contentExcerpt = doc.content.substring(0, 200) + '...';
          const formattedExcerpt = `${scoreBreakdown}\n\n${contentExcerpt}\n\n[View Document](${documentPath})`;
          
          return {
            id: doc.id,
            title: doc.filename.replace('.md', '').replace(/[_-]/g, ' '),
            excerpt: formattedExcerpt,
            score: doc.hybridScore,
            source: doc.filename,
            breakdown: {
              keyword: doc.keywordScore,
              semantic: doc.semanticScore,
              weights: { keywordWeight, semanticWeight }
            }
          };
        }),
        method: 'hybrid-search',
        total: combinedResults.length
      };
    } catch (error) {
      throw new Error(`Hybrid search failed: ${error.message}`);
    }
  }

  async ensureInitialized(collection) {
    // Re-index whenever the collection changes. This instance is a shared singleton
    // in SearchOrchestrator, so a once-only guard would serve a stale index (and a
    // desynced TF-IDF) for every collection after the first.
    if (this.indexedCollection !== collection) {
      await this.indexCollection(collection);
      this.indexedCollection = collection;
    }
  }

  async indexCollection(collection) {
    const collectionPath = path.join(CollectionsUtil.getCollectionsPath(), collection);
    
    const files = await secureFs.readdir(collectionPath);
    const documentFiles = files.filter(file => 
      !file.startsWith('DOCIDX_') && 
      (file.endsWith('.md') || file.endsWith('.json'))
    );
    
    console.log(`Indexing ${documentFiles.length} documents for hybrid search`);

    // Fresh state scoped to this collection so TF-IDF document positions line up
    // exactly with this.documents iteration order.
    this.documents = new Map();
    this.tfidf = new TfIdf();

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
      
      // Add to TF-IDF index (position matches insertion order in this.documents)
      this.tfidf.addDocument(content);
    }
  }

  async getKeywordResults(query, collection, limit) {
    const results = [];
    const queryTerms = query.toLowerCase().split(/\s+/);
    // documents only ever contains the current collection now, so array position
    // equals the TF-IDF document index.
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
    
    // Check if embeddings are missing
    if (vectorResults.results.length === 1 && vectorResults.results[0].id === 'setup_embeddings') {
      return []; // Return empty array so hybrid search can still work with keyword results
    }
    
    return vectorResults.results.map(result => ({
      id: result.id,
      // Use the raw source filename (not the display title) so the hybrid merge key
      // matches the keyword path, which also keys on the raw filename.
      filename: result.source || result.title,
      title: result.title,
      content: result.excerpt.replace('...', ''), // Remove truncation marker
      collection,
      semanticScore: result.score
    }));
  }

  combineResults(keywordResults, semanticResults, keywordWeight, semanticWeight) {
    const combinedScores = new Map();

    // Merge on a stable per-document identity (normalized filename), NOT the two
    // different synthetic ids produced by the keyword path (`${collection}_${filename}`)
    // and the semantic path (`vector_${chunkId}`), which never matched before.
    const docKeyOf = (r) => (r.filename || r.source || '').replace(/\.md$/i, '');

    // Normalize keyword scores (0-1 range)
    const maxKeywordScore = Math.max(...keywordResults.map(r => r.keywordScore), 0.001);
    keywordResults.forEach(result => {
      const key = docKeyOf(result);
      if (!key) return;
      const normalizedScore = result.keywordScore / maxKeywordScore;
      combinedScores.set(key, {
        ...result,
        keywordScore: normalizedScore,
        semanticScore: 0
      });
    });

    // Add semantic scores (already 0-1 range). Multiple chunks can map to the same
    // document — keep the document's best (highest) semantic score (per-document dedup).
    semanticResults.forEach(result => {
      const key = docKeyOf(result);
      if (!key) return;
      const existing = combinedScores.get(key);
      if (existing) {
        existing.semanticScore = Math.max(existing.semanticScore, result.semanticScore);
      } else {
        combinedScores.set(key, {
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