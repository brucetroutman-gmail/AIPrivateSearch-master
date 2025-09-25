import { CollectionManager } from '../lib/documents/collectionManager.mjs';
import { DocumentSearch } from '../lib/documents/documentSearch.mjs';
import { DocumentProcessor } from '../lib/documents/documentProcessor.mjs';
import { logger } from '../../../shared/utils/logger.mjs';
import { secureFs } from '../lib/utils/secureFileOps.mjs';
import path from 'path';

async function processAllCollections() {
  const collectionManager = new CollectionManager();
  const documentProcessor = new DocumentProcessor();
  const collections = await collectionManager.listCollections();
  
  // logger sanitizes all inputs to prevent log injection
  logger.log('Processing collections:', collections);
  
  for (const collection of collections) {
    // logger sanitizes all inputs to prevent log injection
    logger.log('Processing collection:', collection);
    
    // First, convert any non-markdown files
    await convertNonMarkdownFiles(collection, documentProcessor);
    
    const documentSearch = new DocumentSearch(collection);
    await documentSearch.initialize();
    
    const files = await collectionManager.getCollectionFiles(collection);
    // logger sanitizes all inputs to prevent log injection
    logger.log('Found files in collection:', files.length, collection);
    
    for (const filename of files) {
      try {
        // logger sanitizes all inputs to prevent log injection
        logger.log('Processing file:', filename);
        const document = await collectionManager.readDocument(collection, filename);
        const result = await documentSearch.indexDocument(filename, document.content);
        // logger sanitizes all inputs to prevent log injection
        logger.log('Indexed with chunks:', result.chunks, filename);
      } catch (error) {
        // logger sanitizes all inputs to prevent log injection
        logger.error('Error processing file:', filename, error.message);
      }
    }
  }
  
  // logger sanitizes all inputs to prevent log injection
  logger.log('Processing complete!');
}

async function convertNonMarkdownFiles(collection, processor) {
  const collectionPath = path.join(process.cwd(), '../../sources/local-documents', collection);
  const allFiles = await secureFs.readdir(collectionPath);
  
  const nonMdFiles = allFiles.filter(file => {
    const ext = path.extname(file).toLowerCase();
    const baseName = path.basename(file, ext);
    const mdExists = allFiles.includes(`${baseName}.md`);
    return processor.supportedFormats.includes(ext) && !mdExists;
  });
  
  if (nonMdFiles.length > 0) {
    // logger sanitizes all inputs to prevent log injection
    logger.log('Converting non-markdown files:', nonMdFiles.length);
    
    for (const file of nonMdFiles) {
      try {
        const filePath = path.join(collectionPath, file);
        const markdown = await processor.convertToMarkdown(filePath);
        const outputFile = file.replace(path.extname(file), '.md');
        const outputPath = path.join(collectionPath, outputFile);
        
        await secureFs.writeFile(outputPath, markdown, 'utf8');
        // logger sanitizes all inputs to prevent log injection
        logger.log('Converted file:', file, outputFile);
      } catch (error) {
        // logger sanitizes all inputs to prevent log injection
        logger.error('Error converting file:', file, error.message);
      }
    }
  }
}

processAllCollections().catch(err => {
  // logger sanitizes all inputs to prevent log injection
  logger.error('Script error:', err.message);
});