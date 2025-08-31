import { connect } from '@lancedb/lancedb';
import path from 'path';
import fs from 'fs-extra';
import { safeLog, safeError } from '../utils/safeLogger.mjs';

class LanceDBService {
  constructor() {
    this.db = null;
    this.dbPath = path.join(process.cwd(), 'data', 'lancedb');
    this.collections = new Set();
  }

  async initialize() {
    try {
      await fs.ensureDir(this.dbPath);
      this.db = await connect(this.dbPath);
      
      // Load existing collections
      const tableNames = await this.db.tableNames();
      tableNames.forEach(name => this.collections.add(name));
      
      console.log('LanceDB initialized at:', this.dbPath);
    } catch (error) {
      console.error('Failed to initialize LanceDB:', error);
      throw error;
    }
  }

  async createCollection(collectionName, documents) {
    if (!this.db) await this.initialize();
    
    try {
      const table = await this.db.createTable(collectionName, documents);
      safeLog('Created LanceDB collection:', collectionName);
      return table;
    } catch (error) {
      safeError('Failed to create collection:', error.message);
      throw error;
    }
  }

  async getCollection(collectionName) {
    if (!this.db) await this.initialize();
    
    try {
      return await this.db.openTable(collectionName);
    } catch (error) {
      safeLog('Collection not found in LanceDB');
      return null;
    }
  }

  async search(collectionName, queryVector, limit = 10) {
    if (!this.db) await this.initialize();
    
    try {
      const tableNames = await this.db.tableNames();
      if (!tableNames.includes(collectionName)) {
        console.log(`Collection ${collectionName} not found in LanceDB`);
        return [];
      }
      
      const table = await this.db.openTable(collectionName);
      const results = await table
        .search(queryVector)
        .limit(limit)
        .toArray();
      
      safeLog('LanceDB search found results:', results.length);
      return results;
    } catch (error) {
      safeError('LanceDB search failed:', error.message);
      return [];
    }
  }

  async listCollections() {
    if (!this.db) await this.initialize();
    
    try {
      return await this.db.tableNames();
    } catch (error) {
      safeError('Failed to list LanceDB collections:', error.message);
      return [];
    }
  }

  async listDocuments(collectionName) {
    if (!this.db) await this.initialize();
    
    try {
      const tableNames = await this.db.tableNames();
      if (!tableNames.includes(collectionName)) {
        return [];
      }
      
      const table = await this.db.openTable(collectionName);
      const allRecords = await table.query().select(['source', 'timestamp']).toArray();
      const uniqueFiles = new Map();
      
      allRecords.forEach(record => {
        if (!uniqueFiles.has(record.source)) {
          uniqueFiles.set(record.source, {
            filename: record.source,
            metadata: { processedAt: record.timestamp }
          });
        }
      });
      
      return Array.from(uniqueFiles.values());
    } catch (error) {
      safeError('Failed to list documents:', error.message);
      return [];
    }
  }

  async addDocument(collectionName, filename, chunks, embeddings) {
    if (!this.db) await this.initialize();
    
    try {
      const documents = chunks.map((chunk, index) => ({
        vector: embeddings[index],
        text: chunk,
        source: filename,
        chunkIndex: index,
        timestamp: new Date().toISOString()
      }));

      let table;
      try {
        table = await this.db.openTable(collectionName);
        await table.add(documents);
      } catch (error) {
        table = await this.db.createTable(collectionName, documents);
      }
      
      this.collections.add(collectionName);
      safeLog('Added chunks to LanceDB:', chunks.length);
    } catch (error) {
      safeError('Failed to add document to LanceDB:', error.message);
      throw error;
    }
  }

  async removeDocument(collectionName, filename) {
    if (!this.db) await this.initialize();
    
    try {
      const tableNames = await this.db.tableNames();
      if (!tableNames.includes(collectionName)) {
        console.log(`Collection ${collectionName} not found in LanceDB`);
        return { success: true };
      }
      
      const table = await this.db.openTable(collectionName);
      await table.delete(`source = "${filename}"`);
      safeLog('Removed document from LanceDB');
      return { success: true };
    } catch (error) {
      safeError('Failed to remove document from LanceDB:', error.message);
      throw error;
    }
  }

  async removeCollection(collectionName) {
    if (!this.db) await this.initialize();
    
    try {
      await this.db.dropTable(collectionName);
      safeLog('Removed LanceDB collection');
      return { success: true };
    } catch (error) {
      safeError('Failed to remove LanceDB collection:', error.message);
      return { success: true }; // Don't throw error if collection doesn't exist
    }
  }

  async getChunkCounts(collectionName) {
    if (!this.db) await this.initialize();
    
    try {
      const tableNames = await this.db.tableNames();
      if (!tableNames.includes(collectionName)) {
        return {};
      }
      
      const table = await this.db.openTable(collectionName);
      const allRecords = await table.query().select(['source']).toArray();
      
      const chunkCounts = {};
      allRecords.forEach(record => {
        chunkCounts[record.source] = (chunkCounts[record.source] || 0) + 1;
      });
      
      return chunkCounts;
    } catch (error) {
      safeError('Failed to get chunk counts:', error.message);
      return {};
    }
  }
}

export default new LanceDBService();