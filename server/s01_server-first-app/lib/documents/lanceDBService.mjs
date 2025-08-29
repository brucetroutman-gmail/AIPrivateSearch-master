import { connect } from '@lancedb/lancedb';
import path from 'path';
import fs from 'fs-extra';

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
      console.log(`Created LanceDB collection: ${collectionName}`);
      return table;
    } catch (error) {
      console.error(`Failed to create collection ${collectionName}:`, error);
      throw error;
    }
  }

  async getCollection(collectionName) {
    if (!this.db) await this.initialize();
    
    try {
      return await this.db.openTable(collectionName);
    } catch (error) {
      console.error(`Collection ${collectionName} not found in LanceDB`);
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
      
      console.log(`LanceDB search in ${collectionName} found ${results.length} results`);
      return results;
    } catch (error) {
      console.error(`Search failed in collection ${collectionName}:`, error);
      return [];
    }
  }

  async listCollections() {
    if (!this.db) await this.initialize();
    
    try {
      return await this.db.tableNames();
    } catch (error) {
      console.error('Failed to list LanceDB collections:', error);
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
      console.error(`Failed to list documents in ${collectionName}:`, error);
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
      console.log(`Added ${chunks.length} chunks for ${filename} to LanceDB collection ${collectionName}`);
    } catch (error) {
      console.error(`Failed to add document ${filename} to LanceDB:`, error);
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
      console.log(`Removed document ${filename} from LanceDB collection ${collectionName}`);
      return { success: true };
    } catch (error) {
      console.error(`Failed to remove document ${filename} from LanceDB:`, error);
      throw error;
    }
  }

  async removeCollection(collectionName) {
    if (!this.db) await this.initialize();
    
    try {
      await this.db.dropTable(collectionName);
      console.log(`Removed LanceDB collection: ${collectionName}`);
      return { success: true };
    } catch (error) {
      console.error(`Failed to remove LanceDB collection ${collectionName}:`, error);
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
      console.error(`Failed to get chunk counts for ${collectionName}:`, error);
      return {};
    }
  }
}

export default new LanceDBService();