import fs from 'fs/promises';
import path from 'path';
import lunr from 'lunr';

export class FullTextSearch {
  constructor() {
    this.name = 'Full-Text Search';
    this.description = 'Indexed search with ranking and stemming';
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
          title: `Full-Text: ${doc.filename}`,
          excerpt: this.extractExcerpt(doc.content, query),
          score: result.score,
          source: `Lunr Index - ${doc.filename}`
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
        const content = await fs.readFile(filePath, 'utf-8');
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

  extractExcerpt(content, query, maxLength = 200) {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    const queryIndex = contentLower.indexOf(queryLower);
    
    if (queryIndex === -1) {
      return content.substring(0, maxLength) + '...';
    }
    
    const start = Math.max(0, queryIndex - 50);
    const end = Math.min(content.length, queryIndex + maxLength - 50);
    
    return '...' + content.substring(start, end) + '...';
  }
}