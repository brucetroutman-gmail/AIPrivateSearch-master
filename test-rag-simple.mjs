// Simple RAG test without embeddings
import fs from 'fs/promises';
import path from 'path';

async function testRAGBasics() {
  console.log('Testing RAG basics...');
  
  // Check if USA-History collection exists
  const collectionPath = path.join(process.cwd(), 'sources/local-documents/USA-History');
  
  try {
    const files = await fs.readdir(collectionPath);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    console.log(`Found ${mdFiles.length} .md files in USA-History:`);
    mdFiles.forEach(file => console.log(`  - ${file}`));
    
    // Test chunking on first file
    if (mdFiles.length > 0) {
      const firstFile = mdFiles[0];
      const filePath = path.join(collectionPath, firstFile);
      const content = await fs.readFile(filePath, 'utf-8');
      
      console.log(`\nTesting chunking on ${firstFile}:`);
      console.log(`File size: ${content.length} characters`);
      
      // Simple chunking (500 chars, 50 overlap)
      const chunks = [];
      let startChar = 0;
      const chunkSize = 500;
      const overlap = 50;
      
      while (startChar < content.length) {
        const endChar = Math.min(startChar + chunkSize, content.length);
        const chunkContent = content.substring(startChar, endChar);
        
        chunks.push({
          content: chunkContent,
          startChar,
          endChar,
          length: chunkContent.length
        });
        
        startChar += chunkSize - overlap;
      }
      
      console.log(`Created ${chunks.length} chunks`);
      console.log(`First chunk preview: "${chunks[0].content.substring(0, 100)}..."`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRAGBasics();