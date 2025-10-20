// Test Doc Index creation
import { DocumentIndex } from './server/s01_server-first-app/lib/search/DocumentIndex.mjs';

async function test() {
  try {
    const docIndex = new DocumentIndex();
    console.log('Testing single document indexing...');
    
    const result = await docIndex.indexSingleDocument('USA-History', 'Declaration of Independence.md');
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();