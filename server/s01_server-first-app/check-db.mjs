import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';

const dbPath = path.join(process.cwd(), '../../sources/local-documents/Medical-Practice/index-cards.db');

if (fs.existsSync(dbPath)) {
  const dbBuffer = fs.readFileSync(dbPath);
  const SQL = await initSqlJs();
  const db = new SQL.Database(dbBuffer);
  
  // Check all records
  const allResults = db.exec("SELECT docid, filename FROM document_index");
  console.log('All records in index-cards.db:');
  if (allResults.length > 0) {
    allResults[0].values.forEach(row => {
      console.log(`${row[0]} | ${row[1]}`);
    });
  } else {
    console.log('No records found');
  }
  
  db.close();
} else {
  console.log('Database file not found');
}