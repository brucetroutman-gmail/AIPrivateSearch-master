
import { LineSearch } from './LineSearch.mjs';
import { DocumentIndex } from './DocumentIndex.mjs';
import { DocumentSearch } from './DocumentSearch.mjs';
import { SmartSearch } from './SmartSearch.mjs';
import { HybridSearch } from './HybridSearch.mjs';
import { AIDirectSearch } from './AIDirectSearch.mjs';
import { AIDocumentChat } from './AIDocumentChat.mjs';
import { CollectionsUtil } from '../utils/collectionsUtil.mjs';


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
    return await CollectionsUtil.getCollectionNames();
  }

  async indexCollectionDocumentIndex(collection) {
    return await this.searchMethods['document-index'].indexCollection(collection);
  }

  async indexSingleDocument(collection, filename) {
    return await this.searchMethods['document-index'].indexSingleDocument(collection, filename);
  }

  async cleanupMetaFiles(collection) {
    return await this.searchMethods['document-index'].cleanupMetaFiles(collection);
  }

  async getDocumentIndex(collection, filename) {
    return await this.searchMethods['document-index'].getDocumentIndex(collection, filename);
  }

  async updateDocumentIndexComments(id, comments) {
    return await this.searchMethods['document-index'].updateDocumentIndexComments(id, comments);
  }

  async getDocumentIndexStatus(collection) {
    return await this.searchMethods['document-index'].getDocumentIndexStatus(collection);
  }

  async updateAllDocumentIndex(documentIndex) {
    return await this.searchMethods['document-index'].updateAllDocumentIndex(documentIndex);
  }
}