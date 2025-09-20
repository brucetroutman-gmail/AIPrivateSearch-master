import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseConfig {
  constructor() {
    this.dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/metadata.db');
    this.db = null;
  }

  async initialize() {
    try {
      this.db = new Database(this.dbPath);
      
      // Enable WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 1000000');
      this.db.pragma('temp_store = MEMORY');
      
      await this.createTables();
      logger.info('Database initialized successfully');
      
      return this.db;
    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  async createTables() {
    const createDocumentsTable = `
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE NOT NULL,
        filepath TEXT NOT NULL,
        title TEXT,
        content TEXT,
        metadata TEXT,
        word_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        indexed_at DATETIME,
        file_hash TEXT,
        file_size INTEGER DEFAULT 0
      )
    `;

    const createChunksTable = `
      CREATE TABLE IF NOT EXISTS chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER NOT NULL,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        word_count INTEGER DEFAULT 0,
        embedding_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
      )
    `;

    const createSearchHistoryTable = `
      CREATE TABLE IF NOT EXISTS search_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        search_method TEXT NOT NULL,
        results_count INTEGER DEFAULT 0,
        execution_time INTEGER DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id TEXT,
        filters TEXT
      )
    `;

    const createIndexesTable = `
      CREATE TABLE IF NOT EXISTS search_indexes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        index_name TEXT UNIQUE NOT NULL,
        index_type TEXT NOT NULL,
        status TEXT DEFAULT 'building',
        document_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      )
    `;

    // Create indexes for better performance
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_documents_filename ON documents(filename)',
      'CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at)',
      'CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id)',
      'CREATE INDEX IF NOT EXISTS idx_search_history_timestamp ON search_history(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_search_history_method ON search_history(search_method)'
    ];

    try {
      this.db.exec(createDocumentsTable);
      this.db.exec(createChunksTable);
      this.db.exec(createSearchHistoryTable);
      this.db.exec(createIndexesTable);
      
      createIndexes.forEach(indexSQL => {
        this.db.exec(indexSQL);
      });

      logger.info('Database tables and indexes created successfully');
    } catch (error) {
      logger.error('Failed to create database tables:', error);
      throw error;
    }
  }

  getConnection() {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      logger.info('Database connection closed');
    }
  }
}

export const databaseConfig = new DatabaseConfig();
export default databaseConfig;
