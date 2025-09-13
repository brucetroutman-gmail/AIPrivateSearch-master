import { connect } from '@lancedb/lancedb';
import path from 'path';
import fs from 'fs-extra';

async function testBatchProcessing() {
  console.log('🧪 Testing batch processing approach...');
  
  try {
    // Use a separate test database to avoid conflicts
    const dbPath = path.join(process.cwd(), 'test-batch-db');
    await fs.ensureDir(dbPath);
    
    const db = await connect(dbPath);
    
    // Create test data in small batches (as suggested in the document)
    const batchSize = 3; // Very small batches
    const testChunks = [
      "This is chunk 1 of marine poem",
      "This is chunk 2 of marine poem", 
      "This is chunk 3 of marine poem",
      "This is chunk 4 of marine poem",
      "This is chunk 5 of marine poem"
    ];
    
    console.log(`📝 Processing ${testChunks.length} chunks in batches of ${batchSize}...`);
    
    let table;
    let totalProcessed = 0;
    
    // Process in small batches
    for (let i = 0; i < testChunks.length; i += batchSize) {
      const batch = testChunks.slice(i, i + batchSize);
      console.log(`  Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} items`);
      
      // Create documents for this batch
      const documents = batch.map((chunk, index) => ({
        vector: new Array(768).fill(0.1 + (i + index) * 0.01), // 768 dimensions
        text: chunk,
        source: "marine-poem.md",
        chunkIndex: i + index,
        timestamp: new Date().toISOString()
      }));
      
      // Add to table (create on first batch)
      if (!table) {
        table = await db.createTable('test-marine', documents);
        console.log('  ✅ Created table with first batch');
      } else {
        await table.add(documents);
        console.log('  ✅ Added batch to existing table');
      }
      
      totalProcessed += batch.length;
      
      // Small delay between batches (as suggested)
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`✅ Successfully processed ${totalProcessed} chunks in batches`);
    
    // Test search
    console.log('🔍 Testing search...');
    const queryVector = new Array(768).fill(0.15);
    const results = await table.search(queryVector).limit(3).toArray();
    console.log(`✅ Search found ${results.length} results`);
    
    // Cleanup
    await db.dropTable('test-marine');
    await fs.remove(dbPath);
    console.log('🧹 Cleanup complete');
    
  } catch (error) {
    console.error('❌ Batch processing test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testBatchProcessing();