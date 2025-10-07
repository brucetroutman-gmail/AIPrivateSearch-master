import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

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
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Load existing database or create new one
    if (fs.existsSync(this.dbPath)) {
      const data = fs.readFileSync(this.dbPath);
      this.db = new this.SQL.Database(data);
    } else {
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
      run: (...params) => {
        const stmt = this.db.prepare(sql);
        stmt.bind(params);
        stmt.step();
        stmt.free();
        this.save();
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

  save() {
    if (!this.db) return;
    const data = this.db.export();
    fs.writeFileSync(this.dbPath, data);
  }

  close() {
    if (this.db) {
      this.save();
      this.db.close();
    }
  }
}