import { DocumentProcessor } from '../lib/documents/documentProcessor.mjs';

async function convertAllDocuments() {
  const processor = new DocumentProcessor();
  const collections = ['USA-History', 'My-Literature'];
  
  console.log('Converting documents to markdown format...\n');
  
  for (const collection of collections) {
    console.log(`Processing collection: ${collection}`);
    
    try {
      const results = await processor.convertCollectionFiles(collection);
      
      results.forEach(result => {
        if (result.success) {
          console.log(`  ✓ ${result.original} → ${result.converted}`);
        } else {
          console.log(`  ✗ ${result.original}: ${result.error}`);
        }
      });
      
      console.log(`Completed ${collection}: ${results.filter(r => r.success).length} files converted\n`);
    } catch (error) {
      console.error(`Error processing ${collection}:`, error.message);
    }
  }
  
  console.log('Conversion complete! Run "npm run process-docs" to index the new markdown files.');
}

convertAllDocuments().catch(console.error);