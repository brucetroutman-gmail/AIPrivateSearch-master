#!/usr/bin/env node

import { UnifiedEmbeddingService } from './server/s01_server-first-app/lib/documents/unifiedEmbeddingService.mjs';

async function checkEmbeddings() {
  const embeddingService = new UnifiedEmbeddingService();
  
  try {
    const stats = await embeddingService.getStats();
    console.log('Embedding Database Stats:');
    console.log(`- Documents: ${stats.documents}`);
    console.log(`- Chunks: ${stats.chunks}`);
    console.log(`- Collections: ${stats.collections}`);
    
    const familyDocs = await embeddingService.listDocuments('Family-Documents');
    console.log(`\nFamily-Documents collection has ${familyDocs.length} documents:`);
    familyDocs.forEach(doc => {
      console.log(`- ${doc.filename}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkEmbeddings().catch(console.error);