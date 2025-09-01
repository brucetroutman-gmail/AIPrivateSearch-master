import { CollectionManager } from '../lib/documents/collectionManager.mjs';
import { DocumentSearch } from '../lib/documents/documentSearch.mjs';
import { DocumentProcessor } from '../lib/documents/documentProcessor.mjs';
import { safeLog, safeError } from '../lib/utils/safeLogger.mjs';
import fs from 'fs-extra';
import path from 'path';

async function processAllCollections() {
  const collectionManager = new CollectionManager();
  const documentProcessor = new DocumentProcessor();
  const collections = await collectionManager.listCollections();
  
  safeLog('Processing collections:', collections);
  
  for (const collection of collections) {
    safeLog('Processing collection:', collection);
    
    // First, convert any non-markdown files
    await convertNonMarkdownFiles(collection, documentProcessor);
    
    const documentSearch = new DocumentSearch(collection);
    await documentSearch.initialize();
    
    const files = await collectionManager.getCollectionFiles(collection);
    safeLog('Found files in collection:', files.length, collection);
    
    for (const filename of files) {
      try {
        safeLog('Processing file:', filename);
        const document = await collectionManager.readDocument(collection, filename);
        const result = await documentSearch.indexDocument(filename, document.content);
        safeLog('Indexed with chunks:', result.chunks, filename);
      } catch (error) {
        safeError('Error processing file:', filename, error.message);
      }
    }
  }
  
  safeLog('Processing complete!');
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
    safeLog('Converting non-markdown files:', nonMdFiles.length);
    
    for (const file of nonMdFiles) {
      try {
        const filePath = path.join(collectionPath, file);
        const markdown = await processor.convertToMarkdown(filePath);
        const outputFile = file.replace(path.extname(file), '.md');
        const outputPath = path.join(collectionPath, outputFile);
        
        await fs.writeFile(outputPath, markdown, 'utf8');
        safeLog('Converted file:', file, outputFile);
      } catch (error) {
        safeError('Error converting file:', file, error.message);
      }
    }
  }
}

processAllCollections().catch(err => safeError('Script error:', err.message));