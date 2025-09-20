import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

class DatabaseService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  initialize(dbPath = './data/metadata.db') {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Initialize SQLite database
      this.db = new Database(dbPath);
      
      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');
      
      // Create tables if they don't exist
      this.createTables();
      
      this.isInitialized = true;
      console.log('Database initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  createTables() {
    // Documents table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL UNIQUE,
        content TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Search history table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS search_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        method TEXT NOT NULL,
        results_count INTEGER DEFAULT 0,
        execution_time REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_documents_filename ON documents(filename);
      CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query);
    `);
  }

  getConnection() {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  // Document operations
  insertDocument(filename, filepath, content, metadata = null) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO documents (filename, filepath, content, metadata, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    return stmt.run(filename, filepath, content, JSON.stringify(metadata));
  }

  getDocument(id) {
    const stmt = this.db.prepare('SELECT * FROM documents WHERE id = ?');
    return stmt.get(id);
  }

  getAllDocuments() {
    const stmt = this.db.prepare('SELECT * FROM documents ORDER BY created_at DESC');
    return stmt.all();
  }

  searchDocuments(query) {
    const stmt = this.db.prepare(`
      SELECT * FROM documents 
      WHERE content LIKE ? OR filename LIKE ?
      ORDER BY created_at DESC
    `);
    const searchTerm = `%${query}%`;
    return stmt.all(searchTerm, searchTerm);
  }

  // Search history operations
  logSearch(query, method, resultsCount, executionTime) {
    const stmt = this.db.prepare(`
      INSERT INTO search_history (query, method, results_count, execution_time)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(query, method, resultsCount, executionTime);
  }

  getSearchHistory(limit = 100) {
    const stmt = this.db.prepare(`
      SELECT * FROM search_history 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  close() {
    if (this.db) {
      this.db.close();
      this.isInitialized = false;
      console.log('Database connection closed');
    }
  }

  // Health check
  isHealthy() {
    try {
      if (!this.db) return false;
      this.db.prepare('SELECT 1').get();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

// Create and export singleton instance
const databaseService = new DatabaseService();
export default databaseService;
