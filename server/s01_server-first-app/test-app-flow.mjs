// Test the EXACT same flow as the app uses
import lanceDBService from './lib/documents/lanceDBService.mjs';
import { DocumentSearch } from './lib/documents/documentSearch.mjs';

async function testAppFlow() {
  console.log('🧪 Testing EXACT app flow...');
  
  try {
    // Step 1: Initialize DocumentSearch (same as app)
    const documentSearch = new DocumentSearch('USA-History');
    await documentSearch.initialize();
    
    // Step 2: Test content (marine poem)
    const testContent = `Marine Poem
    
The sea calls to me
With waves of blue and white
A sailor's heart beats true`;
    
    console.log('📝 Calling indexDocument (same as app)...');
    
    // Step 3: Call indexDocument (EXACT same as app)
    const result = await documentSearch.indexDocument('marine-poem.md', testContent);
    
    console.log('✅ App flow test result:', result);
    
  } catch (error) {
    console.error('❌ App flow test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAppFlow();