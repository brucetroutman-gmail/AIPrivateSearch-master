import { DocumentIndex } from './server/s01_server-first-app/lib/search/DocumentIndex.mjs';

async function testNLP() {
  try {
    const docIndex = new DocumentIndex();
    console.log('Testing enhanced NLP analytics...');
    
    const result = await docIndex.indexSingleDocument('Federalist-Papers', 'The Federalist Papers.md');
    console.log('Enhanced index card created:', result);
    
    // Read the updated index card
    const indexCard = await docIndex.getDocumentIndex('Federalist-Papers', 'The Federalist Papers.md');
    console.log('\n=== ENHANCED INDEX CARD ===');
    console.log(`DocID: ${indexCard.doc_id}`);
    console.log(`Title: ${indexCard.title}`);
    console.log(`Author: ${indexCard.author}`);
    console.log(`Entities: ${indexCard.entities}`);
    console.log(`Dates: ${indexCard.dates_mentioned}`);
    console.log(`Key Phrases: ${indexCard.key_phrases}`);
    console.log(`Word Count: ${indexCard.word_count}`);
    console.log(`Reading Time: ${indexCard.reading_time} minutes`);
    console.log(`Unique Words: ${indexCard.unique_word_count}`);
    console.log(`Average Sentence Length: ${indexCard.average_sentence_length}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testNLP();