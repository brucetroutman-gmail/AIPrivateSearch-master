import fs from 'fs/promises';
import path from 'path';

export class MetadataSearch {
  constructor() {
    this.name = 'Metadata Search';
    this.description = 'Structured queries using document metadata';
  }

  async search(query, options = {}) {
    const { collection = null } = options;
    const results = [];
    
    try {
      const documentsPath = path.join(process.cwd(), '../../sources/local-documents');
      let metadataFiles = await this.getMetadataFiles(documentsPath);
      
      if (collection) {
        metadataFiles = metadataFiles.filter(f => f.collection === collection);
      }
      
      for (const metaFile of metadataFiles) {
        const metadata = await this.parseMetadataFile(metaFile.path);
        if (this.matchesMetadata(metadata, query, options)) {
          results.push({
            id: metaFile.name,
            title: `Document: ${metadata.title || metaFile.name}`,
            excerpt: this.formatMetadataExcerpt(metadata),
            score: this.calculateMetadataScore(metadata, query),
            source: metaFile.name,
            metadata
          });
        }
      }
      
      return {
        results: results.sort((a, b) => b.score - a.score),
        method: 'metadata',
        total: results.length
      };
    } catch (error) {
      throw new Error(`Metadata search failed: ${error.message}`);
    }
  }

  async getMetadataFiles(documentsPath) {
    const metadataFiles = [];
    const entries = await fs.readdir(documentsPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const collectionPath = path.join(documentsPath, entry.name);
        const files = await fs.readdir(collectionPath);
        const metaFiles = files.filter(file => file.startsWith('META_'));
        
        for (const metaFile of metaFiles) {
          metadataFiles.push({
            name: metaFile,
            path: path.join(collectionPath, metaFile),
            collection: entry.name
          });
        }
      }
    }
    
    return metadataFiles;
  }

  async parseMetadataFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const metadata = {};
    
    // Parse markdown-style metadata
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('**') && trimmed.includes(':**')) {
        const [key, ...valueParts] = trimmed.replace(/\*\*/g, '').split(':');
        metadata[key.toLowerCase().trim()] = valueParts.join(':').trim();
      }
    }
    
    return metadata;
  }

  matchesMetadata(metadata, query, options = {}) {
    const queryLower = query.toLowerCase();
    
    // Search in all metadata fields
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string' && value.toLowerCase().includes(queryLower)) {
        return true;
      }
    }
    
    return false;
  }

  calculateMetadataScore(metadata, query) {
    const queryLower = query.toLowerCase();
    let score = 0;
    let matches = 0;
    
    // Higher weight for title matches
    if (metadata.title && metadata.title.toLowerCase().includes(queryLower)) {
      score += 0.4;
      matches++;
    }
    
    // Medium weight for tags/categories
    if (metadata.tags && metadata.tags.toLowerCase().includes(queryLower)) {
      score += 0.3;
      matches++;
    }
    
    if (metadata.category && metadata.category.toLowerCase().includes(queryLower)) {
      score += 0.3;
      matches++;
    }
    
    // Lower weight for other fields
    const otherFields = ['author', 'description', 'summary'];
    for (const field of otherFields) {
      if (metadata[field] && metadata[field].toLowerCase().includes(queryLower)) {
        score += 0.1;
        matches++;
      }
    }
    
    return Math.min(score, 1.0);
  }

  formatMetadataExcerpt(metadata) {
    const parts = [];
    
    if (metadata.category) parts.push(`Category: ${metadata.category}`);
    if (metadata.tags) parts.push(`Tags: ${metadata.tags}`);
    if (metadata.author) parts.push(`Author: ${metadata.author}`);
    if (metadata['last modified']) parts.push(`Modified: ${metadata['last modified']}`);
    
    return parts.join(', ');
  }
}