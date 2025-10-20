// Read Doc Index Card
import { DocumentIndex } from './server/s01_server-first-app/lib/search/DocumentIndex.mjs';

async function readDocIndex() {
  try {
    const docIndex = new DocumentIndex();
    console.log('Reading Doc Index Card for Declaration of Independence...\n');
    
    const result = await docIndex.getDocumentIndex('USA-History', 'Declaration of Independence.md');
    
    if (result) {
      console.log('=== DOC INDEX CARD ===');
      console.log(`DocID: ${result.doc_id}`);
      console.log(`Title: ${result.title}`);
      console.log(`Document Type: ${result.document_type}`);
      console.log(`Category: ${result.category}`);
      console.log(`Summary: ${result.summary}`);
      console.log(`Topics: ${result.topics}`);
      console.log(`Keywords: ${result.keywords}`);
      console.log(`Importance Level: ${result.importance_level}`);
      console.log(`Complexity Score: ${result.complexity_score}`);
      console.log(`Word Count: ${result.word_count}`);
      console.log(`Reading Time: ${result.reading_time} minutes`);
      console.log(`Language: ${result.language}`);
      console.log(`Sentiment: ${result.sentiment}`);
      console.log(`\nEmpty Fields:`);
      console.log(`Author: "${result.author}"`);
      console.log(`Entities: "${result.entities}"`);
      console.log(`Dates Mentioned: "${result.dates_mentioned}"`);
      console.log(`Amounts Mentioned: "${result.amounts_mentioned}"`);
      console.log(`Action Items: "${result.action_items}"`);
      console.log(`Key Phrases: "${result.key_phrases}"`);
    } else {
      console.log('No Doc Index Card found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

readDocIndex();