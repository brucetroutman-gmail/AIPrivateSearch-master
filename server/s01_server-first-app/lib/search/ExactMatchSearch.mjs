import { secureFs } from '../utils/secureFileOps.mjs';
import path from 'path';
import { createInterface } from 'readline';

export class ExactMatchSearch {
  constructor() {
    this.name = 'Line Search';
    this.description = 'Line-by-line search with context and Boolean logic';
  }

  async search(query, options = {}) {
    const { caseSensitive = false, wholeWords = false, collection = null } = options;
    const results = [];
    
    try {
      const documentsPath = '../../sources/local-documents';
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
    
    try {
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
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('Documents directory not found:', documentsPath);
        return [];
      }
      throw error;
    }
  }

  async searchInCollection(collection, query, options) {
    const results = [];
    
    for (const filename of collection.files) {
      const filePath = path.join(collection.path, filename);
      const fileResults = await this.searchInFile(filePath, query, options, collection);
      results.push(...fileResults.map(result => ({
        ...result,
        collection: collection.name
      })));
    }
    
    return results;
  }

  async searchInFile(filePath, query, options, collection) {
    const results = [];
    const fileStream = secureFs.createReadStream(filePath);
    const rl = createInterface({ input: fileStream });
    
    const lines = [];
    let lineNumber = 0;
    
    // First pass: collect all lines
    for await (const line of rl) {
      lineNumber++;
      lines.push({ number: lineNumber, text: line });
    }
    
    // Second pass: find matches and add context
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (this.matchesQuery(line.text, query, options)) {
        const contextLines = [];
        
        // Add 2 lines before
        for (let j = Math.max(0, i - 2); j < i; j++) {
          contextLines.push(`${lines[j].number}: ${lines[j].text}`);
        }
        
        // Add the matching line
        contextLines.push(`${line.number}: ${line.text} ← MATCH`);
        
        // Add 2 lines after
        for (let j = i + 1; j <= Math.min(lines.length - 1, i + 2); j++) {
          contextLines.push(`${lines[j].number}: ${lines[j].text}`);
        }
        
        results.push({
          id: `${path.basename(filePath)}_${line.number}`,
          title: path.basename(filePath),
          excerpt: this.highlightQueryTerms(contextLines.join('\n'), query),
          score: this.calculateRelevanceScore(line.text, query),
          source: `${path.basename(filePath)}:${line.number}`,
          lineNumber: line.number,
          documentPath: `http://localhost:3001/api/documents/${collection.name}/${path.basename(filePath)}/view?line=${line.number}`
        });
      }
    }
    
    return results;
  }

  matchesQuery(text, query, options) {
    let searchText = options.caseSensitive ? text : text.toLowerCase();
    let searchQuery = options.caseSensitive ? query : query.toLowerCase();
    
    // Handle Boolean logic
    if (this.hasBooleanOperators(searchQuery)) {
      return this.evaluateBooleanQuery(searchText, searchQuery, options);
    }
    
    if (options.wholeWords) {
      const regex = new RegExp(`\\b${this.escapeRegex(searchQuery)}\\b`, 'gi');
      return regex.test(searchText);
    }
    
    return searchText.includes(searchQuery);
  }
  
  hasBooleanOperators(query) {
    return /\b(and|or|not)\b/i.test(query) || /[&|!]/.test(query);
  }
  
  evaluateBooleanQuery(text, query, options) {
    // Normalize boolean operators
    let normalizedQuery = query
      .replace(/\band\b/gi, '&')
      .replace(/\bor\b/gi, '|')
      .replace(/\bnot\b/gi, '!')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Split by OR first (lowest precedence)
    const orTerms = normalizedQuery.split('|');
    
    for (const orTerm of orTerms) {
      if (this.evaluateAndNotExpression(text, orTerm.trim(), options)) {
        return true;
      }
    }
    
    return false;
  }
  
  evaluateAndNotExpression(text, expression, options) {
    // Split by AND
    const andTerms = expression.split('&');
    
    for (const term of andTerms) {
      const trimmedTerm = term.trim();
      
      if (trimmedTerm.startsWith('!')) {
        // NOT operation
        const notTerm = trimmedTerm.substring(1).trim();
        if (this.termMatches(text, notTerm, options)) {
          return false; // If NOT term is found, this AND expression fails
        }
      } else {
        // Regular term
        if (!this.termMatches(text, trimmedTerm, options)) {
          return false; // If required term not found, this AND expression fails
        }
      }
    }
    
    return true; // All AND conditions met
  }
  
  termMatches(text, term, options) {
    if (options.wholeWords) {
      const regex = new RegExp(`\\b${this.escapeRegex(term)}\\b`, 'gi');
      return regex.test(text);
    }
    return text.includes(term);
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

  extractExcerpt(text, query, maxLength = 200) {
    if (text.length <= maxLength) {
      return text;
    }
    
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const queryIndex = textLower.indexOf(queryLower);
    
    if (queryIndex === -1) {
      return text.substring(0, maxLength) + '...';
    }
    
    const start = Math.max(0, queryIndex - 50);
    const end = Math.min(text.length, queryIndex + maxLength - 50);
    
    let excerpt = text.substring(start, end);
    if (start > 0) excerpt = '...' + excerpt;
    if (end < text.length) excerpt = excerpt + '...';
    
    return excerpt;
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  highlightQueryTerms(text, query) {
    const queryTerms = this.parseQueryTerms(query);
    let highlightedText = text;
    
    // Highlight all query terms
    queryTerms.forEach(term => {
      const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="search-highlight">$1</mark>');
    });
    
    return highlightedText;
  }
  
  parseQueryTerms(query) {
    // Handle Boolean operators and extract individual terms
    return query
      .replace(/[&|!]/g, ' ') // Remove Boolean operators
      .replace(/\b(AND|OR|NOT)\b/gi, ' ') // Remove Boolean words
      .split(/\s+/)
      .filter(term => term.length > 1) // Only terms longer than 1 char
      .slice(0, 5); // Limit to 5 terms for performance
  }
}