import { AIDocumentChat } from './lib/search/AIDocumentChat.mjs';

const search = new AIDocumentChat();

console.log('Testing AI Document Chat with different queries...\n');

try {
  console.log('=== Testing phrase query: "which patients are prescribed lisinopril" ===');
  const result1 = await search.search('which patients are prescribed lisinopril', { 
    collection: 'Medical-Practice',
    topK: 5 
  });
  console.log('Phrase query result:', result1.results?.length > 0 ? 'SUCCESS' : 'FAILED');
  
  console.log('\n=== Testing single word query: "lisinopril" ===');
  const result2 = await search.search('lisinopril', { 
    collection: 'Medical-Practice',
    topK: 5 
  });
  console.log('Single word query result:', result2.results?.length > 0 ? 'SUCCESS' : 'FAILED');
  
} catch (error) {
  console.error('ERROR:', error.message);
}