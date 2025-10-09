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
    const { collection = null, useWildcards = false } = options;
    
    try {
      await this.buildIndex(collection);
      
      if (!this.index) {
        return { results: [], method: 'fulltext', total: 0 };
      }
      
      // Store original query terms for highlighting (before wildcard conversion)
      this.lastQueryTerms = this.parseQueryTerms(query);
      
      // Convert query to wildcard format if enabled
      const searchQuery = useWildcards ? this.buildWildcardQuery(query) : query;
      let searchResults = this.index.search(searchQuery);
      
      // For wildcard searches, also do manual substring matching to catch cases like "rifle" in "trifle"
      if (useWildcards) {
        const manualResults = this.performManualWildcardSearch(this.lastQueryTerms[0]);
        // Combine and deduplicate results
        const combinedResults = new Map();
        searchResults.forEach(result => combinedResults.set(result.ref, result));
        manualResults.forEach(result => {
          if (!combinedResults.has(result.ref)) {
            combinedResults.set(result.ref, result);
          }
        });
        searchResults = Array.from(combinedResults.values());
      }
      const results = searchResults.map((result, index) => {
        const doc = this.documents.get(result.ref);
        const matchedTerms = this.extractMatchedTerms(result) || this.lastQueryTerms;
        const matchData = this.findMatchesInDocument(doc.content, matchedTerms, useWildcards);
        
        return {
          id: result.ref,
          title: doc.filename,
          excerpt: this.formatMatchedLine(matchData, useWildcards),
          score: result.score,
          source: `Document Search - ${doc.filename}`,
          documentPath: `http://localhost:3001/api/documents/${doc.collection}/${doc.filename}/view?line=${matchData.lineNumber}`
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
    
    // Store original query terms for fallback highlighting
    this.lastQueryTerms = [];
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

  findMatchesInDocument(content, matchedTerms, useWildcards = false) {
    const lines = content.split('\n');
    
    // For wildcard searches, prioritize original query terms over Lunr's matched terms
    const allTerms = useWildcards ? this.lastQueryTerms : [...new Set([...matchedTerms, ...this.lastQueryTerms])];
    
    // Find all matches and return the best one
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const term of allTerms) {
        const actualMatch = this.findActualMatchInLine(line, term, useWildcards);
        
        if (actualMatch) {
          return {
            lineNumber: i + 1,
            line: line,
            matchedTerm: term,
            actualMatch: actualMatch
          };
        }
      }
    }
    
    return { lineNumber: 1, line: lines[0] || '', matchedTerm: allTerms[0] || '', actualMatch: '' };
  }
  
  findActualMatchInLine(line, term, useWildcards = false) {
    const words = line.match(/\b\w+\b/g) || [];
    const termLower = term.toLowerCase();
    
    if (useWildcards) {
      // For wildcards, find any word containing the term
      const containsMatch = words.find(word => {
        const wordLower = word.toLowerCase();
        return wordLower.includes(termLower);
      });
      return containsMatch || null;
    } else {
      // For exact matching, only match whole words
      const exactMatch = words.find(word => word.toLowerCase() === termLower);
      return exactMatch || null;
    }
  }
  
  formatAsLineSearchResult(matchData, filename, collection, resultIndex) {
    // Highlight the actual matched word
    let highlightedLine = matchData.line;
    if (matchData.actualMatch) {
      const regex = new RegExp(`\\b(${this.escapeRegex(matchData.actualMatch)})\\b`, 'gi');
      highlightedLine = highlightedLine.replace(regex, '<mark class="search-highlight">$1</mark>');
    }
    
    return `**Result ${resultIndex}: ${filename}**\n${matchData.lineNumber}: ${highlightedLine}\n`;
  }
  
  formatMatchedLine(matchData, useWildcards = false) {
    // Highlight the actual matched word
    let highlightedLine = matchData.line;
    if (matchData.actualMatch) {
      if (useWildcards) {
        // For wildcards, highlight the entire matched word
        const regex = new RegExp(`\\b(${this.escapeRegex(matchData.actualMatch)})\\b`, 'gi');
        highlightedLine = highlightedLine.replace(regex, '<mark class="search-highlight">$1</mark>');
      } else {
        // For exact matching, use word boundaries
        const regex = new RegExp(`\\b(${this.escapeRegex(matchData.actualMatch)})\\b`, 'gi');
        highlightedLine = highlightedLine.replace(regex, '<mark class="search-highlight">$1</mark>');
      }
    }
    
    return `${matchData.lineNumber}: ${highlightedLine}`;
  }
  
  extractMatchedTerms(lunrResult) {
    const matchedTerms = [];
    
    // Extract terms from Lunr's match metadata if available
    if (lunrResult.matchData && lunrResult.matchData.metadata) {
      Object.keys(lunrResult.matchData.metadata).forEach(term => {
        matchedTerms.push(term);
      });
    }
    
    // If no match data, return null to use fallback
    return matchedTerms.length > 0 ? matchedTerms : null;
  }


  

  
  buildWildcardQuery(query) {
    // For wildcard searches, use a simpler approach that works better with Lunr
    const terms = query
      .replace(/[+\-"~]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 0);
    
    const wildcardTerms = [];
    
    for (let i = 0; i < terms.length; i++) {
      const term = terms[i];
      
      // Keep Boolean operators as-is
      if (/^(AND|OR|NOT)$/i.test(term)) {
        wildcardTerms.push(term);
      } else {
        // Use prefix wildcard which works reliably in Lunr
        // This will match words starting with the term
        wildcardTerms.push(`${term}*`);
        // Also search for the exact term
        wildcardTerms.push(`OR ${term}`);
      }
    }
    
    return wildcardTerms.join(' ');
  }
  
  parseQueryTerms(query) {
    // For the original query, just extract the main search terms
    // Don't process the wildcard-expanded query
    return query
      .replace(/[+\-"~*()]/g, ' ')
      .replace(/\b(AND|OR|NOT)\b/gi, ' ')
      .split(/\s+/)
      .filter(term => term.length > 1 && !/^(and|or|not)$/i.test(term))
      .slice(0, 5);
  }
  
  getContextAroundMatch(content, matchStart, matchLength) {
    const start = Math.max(0, matchStart - 50);
    const end = Math.min(content.length, matchStart + matchLength + 50);
    return content.substring(start, end);
  }
  
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  performManualWildcardSearch(searchTerm) {
    const results = [];
    const termLower = searchTerm.toLowerCase();
    
    // Search through all documents for substring matches
    for (const [docId, doc] of this.documents) {
      const content = doc.content.toLowerCase();
      const words = content.match(/\b\w+\b/g) || [];
      
      // Check if any word contains the search term as substring
      const hasSubstringMatch = words.some(word => 
        word.includes(termLower) && word !== termLower
      );
      
      if (hasSubstringMatch) {
        results.push({
          ref: docId,
          score: 0.5 // Lower score than exact matches
        });
      }
    }
    
    return results;
  }
}