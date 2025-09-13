import { connect } from '@lancedb/lancedb';
import path from 'path';

async function testUSAHistory() {
  console.log('🧪 Testing USA-History collection specifically...');
  
  try {
    const dbPath = path.join(process.cwd(), 'data', 'lancedb');
    const db = await connect(dbPath);
    
    // Try to add to USA-History (same as app does)
    const testDoc = {
      vector: new Array(64).fill(0.1),
      text: "Test marine poem content",
      source: "marine-poem.md",
      chunkIndex: 0,
      timestamp: new Date().toISOString()
    };
    
    console.log('📝 Adding test document to USA-History...');
    const table = await db.openTable('USA-History');
    await table.add([testDoc]);
    
    console.log('✅ Successfully added to USA-History!');
    
    // Test search
    console.log('🔍 Testing search...');
    const queryVector = new Array(64).fill(0.15);
    const results = await table.search(queryVector).limit(1).toArray();
    console.log(`✅ Search found ${results.length} results`);
    
  } catch (error) {
    console.error('❌ USA-History test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testUSAHistory();