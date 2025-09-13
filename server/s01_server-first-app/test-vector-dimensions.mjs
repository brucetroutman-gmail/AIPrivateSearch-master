import { connect } from '@lancedb/lancedb';
import path from 'path';

async function checkVectorDimensions() {
  console.log('🧪 Checking existing vector dimensions...');
  
  try {
    const dbPath = path.join(process.cwd(), 'data', 'lancedb');
    const db = await connect(dbPath);
    
    const table = await db.openTable('USA-History');
    const sample = await table.query().limit(1).toArray();
    
    if (sample.length > 0 && sample[0].vector) {
      console.log(`📏 Existing vector dimension: ${sample[0].vector.length}`);
      console.log(`📄 Sample document:`, {
        source: sample[0].source,
        vectorLength: sample[0].vector.length,
        text: sample[0].text?.substring(0, 50) + '...'
      });
    } else {
      console.log('❌ No vectors found in existing data');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkVectorDimensions();