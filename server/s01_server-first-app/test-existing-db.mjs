import { connect } from '@lancedb/lancedb';
import path from 'path';
import fs from 'fs-extra';

async function testExistingDB() {
  console.log('🧪 Testing existing LanceDB database...');
  
  try {
    // Use the SAME path as the app
    const dbPath = path.join(process.cwd(), 'data', 'lancedb');
    console.log('📁 Database path:', dbPath);
    
    const db = await connect(dbPath);
    
    // List existing tables
    const tables = await db.tableNames();
    console.log('📋 Existing tables:', tables);
    
    // Try to access each table
    for (const tableName of tables) {
      try {
        const table = await db.openTable(tableName);
        const count = await table.countRows();
        console.log(`  ✅ ${tableName}: ${count} rows`);
      } catch (error) {
        console.log(`  ❌ ${tableName}: ERROR - ${error.message}`);
      }
    }
    
    console.log('✅ Existing database test complete');
    
  } catch (error) {
    console.error('❌ Existing database test failed:', error.message);
  }
}

testExistingDB();