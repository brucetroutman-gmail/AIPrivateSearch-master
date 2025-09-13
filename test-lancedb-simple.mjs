import { connect } from '@lancedb/lancedb';
import path from 'path';
import fs from 'fs-extra';

async function testLanceDB() {
  console.log('🧪 Testing LanceDB with simple data...');
  
  try {
    // Create test database
    const dbPath = path.join(process.cwd(), 'test-lancedb');
    await fs.ensureDir(dbPath);
    
    console.log('📁 Connecting to LanceDB...');
    const db = await connect(dbPath);
    
    // Create simple test data
    const testData = [
      {
        vector: new Array(384).fill(0.1), // Simple vector
        text: "This is a test document",
        source: "test.md",
        chunkIndex: 0,
        timestamp: new Date().toISOString()
      },
      {
        vector: new Array(384).fill(0.2), // Simple vector
        text: "This is another test document",
        source: "test2.md", 
        chunkIndex: 0,
        timestamp: new Date().toISOString()
      }
    ];
    
    console.log('📝 Creating table with test data...');
    const table = await db.createTable('test-collection', testData);
    
    console.log('✅ LanceDB test successful!');
    console.log(`   - Created table with ${testData.length} documents`);
    console.log(`   - Vector dimension: ${testData[0].vector.length}`);
    
    // Test search
    console.log('🔍 Testing search...');
    const queryVector = new Array(384).fill(0.15);
    const results = await table.search(queryVector).limit(2).toArray();
    
    console.log(`✅ Search successful! Found ${results.length} results`);
    
    // Cleanup
    await db.dropTable('test-collection');
    await fs.remove(dbPath);
    console.log('🧹 Cleanup complete');
    
  } catch (error) {
    console.error('❌ LanceDB test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testLanceDB();