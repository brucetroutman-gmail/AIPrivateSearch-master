
import { LineSearch } from './LineSearch.mjs';
import { DocumentIndex } from './DocumentIndex.mjs';
import { DocumentSearch } from './DocumentSearch.mjs';
import { SmartSearch } from './SmartSearch.mjs';
import { HybridSearch } from './HybridSearch.mjs';
import { AIDirectSearch } from './AIDirectSearch.mjs';
import { AIDocumentChat } from './AIDocumentChat.mjs';


export class SearchOrchestrator {
  constructor() {
    this.searchMethods = {
      'line-search': new LineSearch(),
      'document-index': new DocumentIndex(),
      'document-search': new DocumentSearch(),
      'smart-search': new SmartSearch(),
      'hybrid-search': new HybridSearch(),
      'ai-direct': new AIDirectSearch(),
      'ai-document-chat': new AIDocumentChat(),
    };
  }

  async search(query, methods = ['traditional'], options = {}) {
    const results = {};
    const timing = {};

    for (const method of methods) {
      if (!this.searchMethods[method]) {
        throw new Error(`Unknown search method: ${method}`);
      }

      const startTime = Date.now();
      try {
        results[method] = await this.searchMethods[method].search(query, options);
        timing[method] = Date.now() - startTime;
      } catch (error) {
        results[method] = { error: error.message, results: [] };
        timing[method] = Date.now() - startTime;
      }
    }

    return { results, timing };
  }

  async searchAll(query, options = {}) {
    const allMethods = Object.keys(this.searchMethods);
    return this.search(query, allMethods, options);
  }

  getAvailableMethods() {
    return Object.keys(this.searchMethods);
  }

  async getAvailableCollections() {
    try {
      const documentsPath = '../../sources/local-documents';
      const collections = await this.searchMethods['line-search'].getCollections(documentsPath);
      return collections.map(c => c.name);
    } catch (error) {
      console.error('Error loading collections:', error.message);
      return [];
    }
  }

  async indexCollectionMetadata(collection) {
    return await this.searchMethods.metadata.indexCollection(collection);
  }

  async cleanupMetaFiles(collection) {
    return await this.searchMethods.metadata.cleanupMetaFiles(collection);
  }

  async getDocumentMetadata(collection, filename) {
    return await this.searchMethods.metadata.getDocumentMetadata(collection, filename);
  }

  async updateMetadataComments(id, comments) {
    return await this.searchMethods.metadata.updateMetadataComments(id, comments);
  }

  async getMetadataStatus(collection) {
    return await this.searchMethods.metadata.getMetadataStatus(collection);
  }

  async updateAllMetadata(metadata) {
    return await this.searchMethods.metadata.updateAllMetadata(metadata);
  }
}