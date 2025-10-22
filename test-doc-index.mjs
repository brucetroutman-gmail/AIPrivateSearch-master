import { DocumentIndex } from './server/s01_server-first-app/lib/search/DocumentIndex.mjs';

async function testDocIndex() {
  try {
    console.log('Testing document index creation...');
    const docIndex = new DocumentIndex();
    const result = await docIndex.indexSingleDocument('Federalist-Papers', 'The Federalist Papers.md');
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDocIndex();