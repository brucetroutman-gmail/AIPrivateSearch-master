import fs from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

export class TraditionalSearch {
  constructor() {
    this.name = 'Traditional Text Search';
    this.description = 'File-based grep-like search for exact matches';
  }

  async search(query, options = {}) {
    const { caseSensitive = false, wholeWords = false, collection = null } = options;
    const results = [];
    
    try {
      const documentsPath = path.join(process.cwd(), '../../sources/local-documents');
      let collections = await this.getCollections(documentsPath);
      
      if (collection) {
        collections = collections.filter(c => c.name === collection);
      }
      
      for (const coll of collections) {
        const collectionResults = await this.searchInCollection(coll, query, { caseSensitive, wholeWords });
        results.push(...collectionResults);
      }
      
      return {
        results: results.sort((a, b) => b.score - a.score),
        method: 'traditional',
        total: results.length
      };
    } catch (error) {
      throw new Error(`Traditional search failed: ${error.message}`);
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

  async searchInCollection(collection, query, options) {
    const results = [];
    
    for (const filename of collection.files) {
      const filePath = path.join(collection.path, filename);
      const fileResults = await this.searchInFile(filePath, query, options);
      results.push(...fileResults.map(result => ({
        ...result,
        collection: collection.name
      })));
    }
    
    return results;
  }

  async searchInFile(filePath, query, options) {
    const results = [];
    const fileStream = createReadStream(filePath);
    const rl = createInterface({ input: fileStream });
    
    let lineNumber = 0;
    for await (const line of rl) {
      lineNumber++;
      if (this.matchesQuery(line, query, options)) {
        results.push({
          id: `${path.basename(filePath)}_${lineNumber}`,
          title: path.basename(filePath),
          excerpt: line.trim(),
          score: this.calculateRelevanceScore(line, query),
          source: `${path.basename(filePath)}:${lineNumber}`,
          lineNumber
        });
      }
    }
    
    return results;
  }

  matchesQuery(text, query, options) {
    let searchText = options.caseSensitive ? text : text.toLowerCase();
    let searchQuery = options.caseSensitive ? query : query.toLowerCase();
    
    if (options.wholeWords) {
      const regex = new RegExp(`\\b${this.escapeRegex(searchQuery)}\\b`, 'gi');
      return regex.test(searchText);
    }
    
    return searchText.includes(searchQuery);
  }

  calculateRelevanceScore(text, query) {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Exact match gets highest score
    if (textLower === queryLower) return 1.0;
    
    // Count occurrences
    const occurrences = (textLower.match(new RegExp(this.escapeRegex(queryLower), 'g')) || []).length;
    const maxScore = Math.min(occurrences * 0.3, 0.9);
    
    // Bonus for query at start of line
    if (textLower.startsWith(queryLower)) {
      return Math.min(maxScore + 0.1, 1.0);
    }
    
    return maxScore;
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}