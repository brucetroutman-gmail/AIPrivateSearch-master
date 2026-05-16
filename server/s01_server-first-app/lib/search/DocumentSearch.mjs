 
 
import { secureFs } from '../utils/secureFileOps.mjs';
import { CollectionsUtil } from '../utils/collectionsUtil.mjs';
import { HighlightFormatter } from '../utils/highlightFormatter.mjs';
import path from 'path';
import lunr from 'lunr';

export class DocumentSearch {
  constructor() {
    this.name = 'Document Search';
    this.description = 'Document-wide search with ranking and Boolean logic';
    this.index = null;
    this.documents = new Map();
  }

  async search(query, options = {}) {
    const { collection = null } = options;
    const useWildcards = true; // Always use wildcard/substring matching
    

    try {
      await this.buildIndex(collection);
      
      if (!this.index) {
        return { results: [], method: 'document-search', total: 0 };
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
          source: doc.filename,
          collection: doc.collection,
          documentPath: `/api/documents/${doc.collection}/${encodeURIComponent(doc.filename)}/view?line=${matchData.lineNumber}&search=${encodeURIComponent(query)}`
        };
      });
      
      return {
        results,
        method: 'document-search',
        total: results.length
      };
    } catch (error) {
      throw new Error(`Full-text search failed: ${error.message}`);
    }
  }

  async buildIndex(collection) {
    let collections = await this.getCollections(CollectionsUtil.getCollectionsPath());
    
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
          !file.startsWith('DOCIDX_') && 
          (file.endsWith('.md') || file.endsWith('.json'))
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
    
    // Find all matches and return the best one with context
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const term of allTerms) {
        const actualMatch = this.findActualMatchInLine(line, term, useWildcards);
        
        if (actualMatch) {
          // Include context lines (before and after)
          const contextLines = [];
          const prevLine = i > 0 ? lines[i - 1] : null;
          const nextLine = i < lines.length - 1 ? lines[i + 1] : null;
          
          if (prevLine) contextLines.push({ lineNumber: i, line: prevLine });
          contextLines.push({ lineNumber: i + 1, line: line, isMatch: true });
          if (nextLine) contextLines.push({ lineNumber: i + 2, line: nextLine });
          
          return {
            lineNumber: i + 1,
            line: line,
            matchedTerm: term,
            actualMatch: actualMatch,
            contextLines: contextLines
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
    const highlightedLine = matchData.actualMatch ? 
      HighlightFormatter.highlightMatches(matchData.line, matchData.actualMatch) :
      matchData.line;
    
    return `**Result ${resultIndex}: ${filename}**\n${matchData.lineNumber}: ${highlightedLine}\n`;
  }
  
  formatMatchedLine(matchData, useWildcards = false) {
    if (matchData.contextLines) {
      // Format with context lines
      return matchData.contextLines.map(contextLine => {
        if (contextLine.isMatch) {
          // Highlight the matched line
          const highlightedLine = matchData.actualMatch ? 
            HighlightFormatter.highlightMatches(contextLine.line, matchData.actualMatch, useWildcards) :
            contextLine.line;
          return `${contextLine.lineNumber}: ${highlightedLine}`;
        } else {
          // Regular context line
          return `${contextLine.lineNumber}: ${contextLine.line}`;
        }
      }).join('\n');
    } else {
      // Fallback to single line format
      const highlightedLine = matchData.actualMatch ? 
        HighlightFormatter.highlightMatches(matchData.line, matchData.actualMatch, useWildcards) :
        matchData.line;
      
      return `${matchData.lineNumber}: ${highlightedLine}`;
    }
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