import { NLPAnalytics } from './server/s01_server-first-app/lib/nlp/NLPAnalytics.mjs';
import fs from 'fs';

async function testNLPDirect() {
  try {
    const nlp = new NLPAnalytics();
    
    // Read a sample of the Federalist Papers
    const content = fs.readFileSync('/Users/Shared/AIPrivateSearch/sources/local-documents/Federalist-Papers/The Federalist Papers.md', 'utf-8');
    const sample = content.substring(0, 5000); // First 5000 characters
    
    console.log('Testing NLP Analytics directly...\n');
    
    const entities = nlp.extractEntities(sample);
    console.log('ENTITIES:');
    console.log('People:', entities.people);
    console.log('Organizations:', entities.organizations);
    console.log('Locations:', entities.locations);
    
    const dates = nlp.extractDates(sample);
    console.log('\nDATES:', dates);
    
    const keyPhrases = nlp.extractKeyPhrases(sample);
    console.log('\nKEY PHRASES:', keyPhrases);
    
    const fullAnalysis = nlp.analyzeText(sample);
    console.log('\nFULL ANALYSIS:');
    console.log('Entities People:', fullAnalysis.entities.people);
    console.log('Dates:', fullAnalysis.dates);
    console.log('Key Phrases:', fullAnalysis.keyPhrases);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testNLPDirect();