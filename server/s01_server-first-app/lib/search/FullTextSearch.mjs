import { secureFs } from '../utils/secureFileOps.mjs';
import path from 'path';
import lunr from 'lunr';

export class FullTextSearch {
  constructor() {
    this.name = 'Document Search';
    this.description = 'Document-wide search with ranking and Boolean logic';
    this.index = null;
    this.documents = new Map();
  }

  async search(query, options = {}) {
    const { collection = null } = options;
    
    try {
      await this.buildIndex(collection);
      
      if (!this.index) {
        return { results: [], method: 'fulltext', total: 0 };
      }
      
      const searchResults = this.index.search(query);
      const results = searchResults.map(result => {
        const doc = this.documents.get(result.ref);
        return {
          id: result.ref,
          title: `Document Search: ${doc.filename}`,
          excerpt: this.extractExcerpt(doc.content, query),
          score: result.score,
          source: `Lunr Index - ${doc.filename}`,
          documentPath: `http://localhost:3001/api/documents/${doc.collection}/${doc.filename}`
        };
      });
      
      return {
        results,
        method: 'fulltext',
        total: results.length
      };
    } catch (error) {
      throw new Error(`Full-text search failed: ${error.message}`);
    }
  }

  async buildIndex(collection) {
    const documentsPath = path.join(process.cwd(), '../../sources/local-documents');
    let collections = await this.getCollections(documentsPath);
    
    if (collection) {
      collections = collections.filter(c => c.name === collection);
    }
    
    this.documents.clear();
    const docs = [];
    
    for (const coll of collections) {
      for (const filename of coll.files) {
        const filePath = path.join(coll.path, filename);
        const content = await secureFs.readFile(filePath, 'utf-8');
        const docId = `${coll.name}_${filename}`;
        
        const doc = {
          id: docId,
          filename,
          content,
          collection: coll.name
        };
        
        this.documents.set(docId, doc);
        docs.push({
          id: docId,
          title: filename,
          body: content
        });
      }
    }
    
    this.index = lunr(function() {
      this.ref('id');
      this.field('title', { boost: 10 });
      this.field('body');
      
      docs.forEach(doc => this.add(doc));
    });
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

  extractExcerpt(content, query, maxLength = 300) {
    const queryTerms = this.parseQueryTerms(query);
    const contentLower = content.toLowerCase();
    const matches = [];
    
    // Find all matches for each query term
    queryTerms.forEach(term => {
      const termLower = term.toLowerCase();
      let index = 0;
      while ((index = contentLower.indexOf(termLower, index)) !== -1) {
        matches.push({
          term,
          start: index,
          end: index + term.length,
          context: this.getContextAroundMatch(content, index, term.length)
        });
        index += term.length;
      }
    });
    
    if (matches.length === 0) {
      return content.substring(0, maxLength) + '...';
    }
    
    // Sort matches by position and take the best ones
    matches.sort((a, b) => a.start - b.start);
    
    // Create excerpt with highlighted terms
    const bestMatch = matches[0];
    const contextStart = Math.max(0, bestMatch.start - 100);
    const contextEnd = Math.min(content.length, bestMatch.start + maxLength);
    
    let excerpt = content.substring(contextStart, contextEnd);
    
    // Highlight all query terms in the excerpt with colored background
    queryTerms.forEach(term => {
      const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
      excerpt = excerpt.replace(regex, '<mark class="search-highlight">$1</mark>');
    });
    
    // Add ellipsis if needed
    if (contextStart > 0) excerpt = '...' + excerpt;
    if (contextEnd < content.length) excerpt = excerpt + '...';
    
    return excerpt;
  }
  
  parseQueryTerms(query) {
    // Handle Boolean operators and extract individual terms
    return query
      .replace(/[+\-"~*]/g, ' ') // Remove Lunr operators
      .replace(/\b(AND|OR|NOT)\b/gi, ' ') // Remove Boolean operators
      .split(/\s+/)
      .filter(term => term.length > 2) // Only terms longer than 2 chars
      .slice(0, 5); // Limit to 5 terms for performance
  }
  
  getContextAroundMatch(content, matchStart, matchLength) {
    const start = Math.max(0, matchStart - 50);
    const end = Math.min(content.length, matchStart + matchLength + 50);
    return content.substring(start, end);
  }
  
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}