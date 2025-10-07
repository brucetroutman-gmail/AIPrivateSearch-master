import initSqlJs from 'sql.js';
import path from 'path';
import { secureFs } from './secureFileOps.mjs';

export class SqlJsWrapper {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.SQL = null;
  }

  async init() {
    this.SQL = await initSqlJs();
    
    // Create directory if it doesn't exist
    const dir = path.dirname(this.dbPath);
    try {
      await secureFs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    // Load existing database or create new one
    try {
      const data = await secureFs.readFile(this.dbPath);
      this.db = new this.SQL.Database(data);
    } catch (error) {
      // File doesn't exist, create new database
      this.db = new this.SQL.Database();
    }
  }

  exec(sql) {
    if (!this.db) throw new Error('Database not initialized');
    this.db.exec(sql);
    this.save();
  }

  prepare(sql) {
    if (!this.db) throw new Error('Database not initialized');
    
    return {
      run: async (...params) => {
        const stmt = this.db.prepare(sql);
        stmt.bind(params);
        stmt.step();
        stmt.free();
        await this.save();
        return { changes: 1 };
      },
      get: (...params) => {
        const stmt = this.db.prepare(sql);
        stmt.bind(params);
        const result = stmt.step() ? stmt.getAsObject() : null;
        stmt.free();
        return result;
      },
      all: (...params) => {
        const results = [];
        const stmt = this.db.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      }
    };
  }

  async save() {
    if (!this.db) return;
    const data = this.db.export();
    await secureFs.writeFile(this.dbPath, data);
  }

  async close() {
    if (this.db) {
      await this.save();
      this.db.close();
    }
  }
}