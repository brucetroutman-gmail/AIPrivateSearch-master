import path from 'path';
import { TraditionalSearch } from './TraditionalSearch.mjs';
import { MetadataSearch } from './MetadataSearch.mjs';
import { FullTextSearch } from './FullTextSearch.mjs';
import { VectorSearch } from './VectorSearch.mjs';
import { HybridSearch } from './HybridSearch.mjs';
import { AIDirectSearch } from './AIDirectSearch.mjs';
import { RAGSearch } from './RAGSearch.mjs';

export class SearchOrchestrator {
  constructor() {
    this.searchMethods = {
      traditional: new TraditionalSearch(),
      metadata: new MetadataSearch(),
      fulltext: new FullTextSearch(),
      vector: new VectorSearch(),
      hybrid: new HybridSearch(),
      'ai-direct': new AIDirectSearch(),
      rag: new RAGSearch()
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
    return await this.searchMethods.traditional.getCollections(
      path.join(process.cwd(), '../../sources/local-documents')
    ).then(collections => collections.map(c => c.name));
  }
}