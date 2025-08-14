import { CollectionManager } from '../lib/documents/collectionManager.mjs';
import { DocumentSearch } from '../lib/documents/documentSearch.mjs';
import { DocumentProcessor } from '../lib/documents/documentProcessor.mjs';
import fs from 'fs-extra';
import path from 'path';

async function processAllCollections() {
  const collectionManager = new CollectionManager();
  const documentProcessor = new DocumentProcessor();
  const collections = await collectionManager.listCollections();
  
  console.log('Processing collections:', collections);
  
  for (const collection of collections) {
    console.log(`\nProcessing collection: ${collection}`);
    
    // First, convert any non-markdown files
    await convertNonMarkdownFiles(collection, documentProcessor);
    
    const documentSearch = new DocumentSearch(collection);
    await documentSearch.initialize();
    
    const files = await collectionManager.getCollectionFiles(collection);
    console.log(`Found ${files.length} markdown files in ${collection}`);
    
    for (const filename of files) {
      try {
        console.log(`  Processing: ${filename}`);
        const document = await collectionManager.readDocument(collection, filename);
        const result = await documentSearch.indexDocument(filename, document.content);
        console.log(`    ✓ Indexed with ${result.chunks} chunks`);
      } catch (error) {
        console.error(`    ✗ Error processing ${filename}:`, error.message);
      }
    }
  }
  
  console.log('\nProcessing complete!');
}

async function convertNonMarkdownFiles(collection, processor) {
  const collectionPath = path.join(process.cwd(), '../../sources/local-documents', collection);
  const allFiles = await fs.readdir(collectionPath);
  
  const nonMdFiles = allFiles.filter(file => {
    const ext = path.extname(file).toLowerCase();
    const baseName = path.basename(file, ext);
    const mdExists = allFiles.includes(`${baseName}.md`);
    return processor.supportedFormats.includes(ext) && !mdExists;
  });
  
  if (nonMdFiles.length > 0) {
    console.log(`  Converting ${nonMdFiles.length} non-markdown files...`);
    
    for (const file of nonMdFiles) {
      try {
        const filePath = path.join(collectionPath, file);
        const markdown = await processor.convertToMarkdown(filePath);
        const outputFile = file.replace(path.extname(file), '.md');
        const outputPath = path.join(collectionPath, outputFile);
        
        await fs.writeFile(outputPath, markdown, 'utf8');
        console.log(`    ✓ Converted: ${file} → ${outputFile}`);
      } catch (error) {
        console.error(`    ✗ Error converting ${file}:`, error.message);
      }
    }
  }
}

processAllCollections().catch(console.error);