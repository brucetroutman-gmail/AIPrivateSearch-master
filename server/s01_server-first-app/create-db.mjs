import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

const collectionPath = '../../sources/local-documents/Family-Documents';
const dbPath = path.join(collectionPath, 'index-cards.db');

// Initialize SQL.js
const SQL = await initSqlJs();

// Create database
const db = new SQL.Database();

// Create metadata table
db.exec(`
  CREATE TABLE metadata (
    docid TEXT PRIMARY KEY,
    filename TEXT,
    content TEXT
  )
`);

// Add sample data
const files = fs.readdirSync(collectionPath).filter(f => f.endsWith('.md') && !f.startsWith('META_'));
console.log('Processing files:', files);

for (const filename of files) {
  const filePath = path.join(collectionPath, filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  const docId = `Fam_${Math.floor(Math.random() * 900000) + 100000}`;
  
  const stmt = db.prepare('INSERT INTO metadata (docid, filename, content) VALUES (?, ?, ?)');
  stmt.run([docId, filename, content]);
  stmt.free();
  
  console.log(`Added: ${filename} (DocID: ${docId})`);
}

// Save database
const data = db.export();
fs.writeFileSync(dbPath, data);
db.close();

console.log(`Created: ${dbPath}`);