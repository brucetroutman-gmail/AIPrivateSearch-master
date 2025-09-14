import express from 'express';
import { CollectionManager } from '../lib/documents/collectionManager.mjs';
import { DocumentSearch } from '../lib/documents/documentSearch.mjs';
import { DocumentProcessor } from '../lib/documents/documentProcessor.mjs';
import { asyncHandler } from '../middleware/errorHandler.mjs';
import { requireAuth, requireAdminAuth } from '../middleware/auth.mjs';
import lanceDBService from '../lib/documents/lanceDBService.mjs';
import loggerPkg from '../../../shared/utils/logger.mjs';
const { logger } = loggerPkg;
import { validatePath, validateFilename } from '../lib/utils/pathValidator.mjs';
import fs from 'fs-extra';
import path from 'path';

const router = express.Router();
const collectionManager = new CollectionManager();
const documentProcessor = new DocumentProcessor();

// CRUD Operations
router.get('/collections', requireAuth, asyncHandler(async (req, res) => {
  const collections = await collectionManager.listCollections();
  res.json({ collections });
}));

router.post('/collections/create', requireAuth, asyncHandler(async (req, res) => {
  const { name } = req.body;
  
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Collection name is required' });
  }
  
  if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
    return res.status(400).json({ error: 'Collection name can only contain letters, numbers, hyphens, and underscores' });
  }
  
  const baseDir = path.join(process.cwd(), '../../sources/local-documents');
  const collectionPath = validatePath(name, baseDir);
  
  if (await fs.pathExists(collectionPath)) {
    return res.status(409).json({ error: 'Collection already exists' });
  }
  
  await fs.ensureDir(collectionPath);
  
  const readmeContent = `# ${name} Collection\n\nThis is a document collection for AI search and analysis.\n\nAdd your documents to this folder and use the Collections interface to convert and index them.\n`;
  await fs.writeFile(path.join(collectionPath, 'README.md'), readmeContent, 'utf8');
  
  res.json({ success: true, message: `Collection '${name}' created successfully` });
}));

router.delete('/collections/:collection', requireAdminAuth, asyncHandler(async (req, res) => {
  const collection = req.params.collection;
  
  try {
    // Remove all embeddings from LanceDB
    try {
      await lanceDBService.removeCollection(collection);
    } catch (error) {
      // logger sanitizes all inputs to prevent log injection
      logger.log(`LanceDB collection ${collection} not found or already removed`);
    }
    
    // Remove collection folder and all files
    const baseDir = path.join(process.cwd(), '../../sources/local-documents');
    const collectionPath = validatePath(collection, baseDir);
    if (await fs.pathExists(collectionPath)) {
      await fs.remove(collectionPath);
    }
    
    res.json({ success: true, message: `Collection '${collection}' removed successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

router.get('/collections/:collection/files', requireAuth, async (req, res) => {
  try {
    const files = await collectionManager.getCollectionFiles(req.params.collection);
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/collections/:collection/files/:filename', requireAuth, async (req, res) => {
  try {
    const document = await collectionManager.readDocument(req.params.collection, req.params.filename);
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/collections/:collection/files/:filename/open', requireAuth, async (req, res) => {
  try {
    const baseDir = path.join(process.cwd(), '../../sources/local-documents');
    const collectionDir = validatePath(req.params.collection, baseDir);
    const filename = validateFilename(req.params.filename);
    const filePath = path.join(collectionDir, filename);
    const { exec } = await import('child_process');
    exec(`open "${filePath}"`, (error) => {
      if (error) {
        res.json({ success: false, error: error.message });
      } else {
        res.json({ success: true });
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/collections/:collection/upload', requireAuth, asyncHandler(async (req, res) => {
  const busboy = (await import('busboy')).default;
  const bb = busboy({ headers: req.headers });
  
  bb.on('file', (name, file, info) => {
    const { filename } = info;
    const baseDir = path.join(process.cwd(), '../../sources/local-documents');
    const collectionPath = validatePath(req.params.collection, baseDir);
    const safeFilename = validateFilename(filename);
    const saveTo = path.join(collectionPath, safeFilename);
    
    file.pipe(fs.createWriteStream(saveTo));
    
    file.on('end', () => {
      res.json({ success: true, filename });
    });
  });
  
  bb.on('error', (err) => {
    res.status(500).json({ success: false, error: err.message });
  });
  
  req.pipe(bb);
}));





router.post('/collections/:collection/files/:filename', requireAuth, async (req, res) => {
  try {
    let content = req.body.content;
    
    // Handle base64 encoded files
    if (req.body.encoding === 'base64') {
      const buffer = Buffer.from(content, 'base64');
      const filePath = path.join(process.cwd(), '../../sources/local-documents', req.params.collection, req.params.filename);
      await fs.writeFile(filePath, buffer);
      res.json({ success: true, path: filePath });
    } else {
      // Handle text content (existing functionality)
      const result = await collectionManager.createDocument(req.params.collection, req.params.filename, content);
      res.json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/collections/:collection/files/:filename', requireAuth, async (req, res) => {
  try {
    const result = await collectionManager.updateDocument(req.params.collection, req.params.filename, req.body.content);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/collections/:collection/files/:filename', requireAuth, async (req, res) => {
  try {
    const result = await collectionManager.deleteDocument(req.params.collection, req.params.filename);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Shared conversion utility
async function convertFiles(collection, files = null) {
  const collectionPath = path.join(process.cwd(), '../../sources/local-documents', collection);
  let converted = 0;
  const results = [];
  
  // If no files specified, convert all files in collection
  if (!files) {
    const conversionResults = await documentProcessor.convertCollectionFiles(collection);
    return { converted: conversionResults.filter(r => r.success).length, results: conversionResults };
  }
  
  // Convert selected files
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    
    if (ext === '.md') continue;
    
    if (ext === '.pdf' || ext === '.txt') {
      try {
        const filePath = path.join(collectionPath, file);
        const markdown = await documentProcessor.convertToMarkdown(filePath);
        const outputFile = file.replace(ext, '.md');
        const outputPath = path.join(collectionPath, outputFile);
        
        await fs.writeFile(outputPath, markdown, 'utf8');
        converted++;
        results.push({ file, success: true });
      } catch (error) {
        // logger sanitizes all inputs to prevent log injection
        logger.error('Error converting file:', file, error.message);
        results.push({ file, success: false, error: error.message });
      }
    }
  }
  
  return { converted, results };
}

// Document Conversion
router.post('/convert', requireAuth, asyncHandler(async (req, res) => {
  const { collection } = req.body;
  const result = await convertFiles(collection);
  res.json({ success: true, ...result });
}));

router.post('/convert-selected', requireAuth, asyncHandler(async (req, res) => {
  const { collection, files } = req.body;
  const result = await convertFiles(collection, files);
  res.json({ success: true, ...result });
}));

// Shared processing utility
async function processFiles(collection, files = null) {
  const documentSearch = new DocumentSearch(collection);
  await documentSearch.initialize();
  
  let filesToProcess;
  if (!files) {
    const allFiles = await collectionManager.getCollectionFiles(collection);
    filesToProcess = allFiles.filter(file => file.endsWith('.md'));
  } else {
    filesToProcess = files;
  }
  
  let processed = 0;
  const total = filesToProcess.length;
  
  for (const filename of filesToProcess) {
    try {
      const document = await collectionManager.readDocument(collection, filename);
      await documentSearch.indexDocument(filename, document.content);
      processed++;
    } catch (error) {
      // logger sanitizes all inputs to prevent log injection
      logger.error('Error processing file:', filename, error.message);
    }
  }
  
  return { processed, total };
}

// Document Processing
router.post('/process', requireAuth, asyncHandler(async (req, res) => {
  const { collection } = req.body;
  const result = await processFiles(collection, null);
  res.json({ success: true, ...result });
}));

router.post('/process-selected', requireAuth, asyncHandler(async (req, res) => {
  const { collection, files } = req.body;
  const result = await processFiles(collection, files);
  res.json({ success: true, ...result });
}));

// Embedding Operations
router.post('/collections/:collection/index/:filename', requireAuth, async (req, res) => {
  try {
    const documentSearch = new DocumentSearch(req.params.collection);
    await documentSearch.initialize();
    
    const document = await collectionManager.readDocument(req.params.collection, req.params.filename);
    
    // Estimate chunks based on content length (roughly 500 chars per chunk)
    const estimatedChunks = Math.ceil(document.content.length / 500);
    
    const result = await documentSearch.indexDocument(req.params.filename, document.content);
    
    // Add chunk information to result
    result.estimatedChunks = estimatedChunks;
    result.actualChunks = result.chunks || estimatedChunks;
    
    res.json(result);
  } catch (error) {
    logger.error('Embedding operation failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/collections/:collection/index/:filename', requireAuth, async (req, res) => {
  try {
    await lanceDBService.removeDocument(req.params.collection, req.params.filename);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search Operations
router.post('/collections/:collection/search', requireAuth, async (req, res) => {
  try {
    const documentSearch = new DocumentSearch(req.params.collection);
    await documentSearch.initialize();
    
    const results = await documentSearch.searchDocuments(req.body.query, req.body.limit || 5);
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/collections/:collection/indexed', requireAuth, async (req, res) => {
  try {
    const lanceDocs = await lanceDBService.listDocuments(req.params.collection);
    
    logger.log('Collection indexed docs - LanceDB:', lanceDocs.length);
    
    const documents = lanceDocs.map(doc => ({
      filename: doc.filename,
      inLanceDB: true,
      metadata: doc.metadata || {}
    }));
    
    res.json({ documents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/collections/:collection/embeddings-info', requireAuth, async (req, res) => {
  try {
    const lanceDocs = await lanceDBService.listDocuments(req.params.collection);
    const lanceChunks = await lanceDBService.getChunkCounts(req.params.collection);
    
    const lanceInfo = {
      documents: Object.entries(lanceChunks).map(([filename, chunks]) => ({
        filename,
        chunks
      })),
      totalChunks: Object.values(lanceChunks).reduce((sum, count) => sum + count, 0)
    };
    
    res.json({ lanceDB: lanceInfo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate individual document metadata
router.post('/collections/:collection/generate-document-metadata', requireAuth, asyncHandler(async (req, res) => {
  try {
    const { collection } = req.params;
    const result = await documentProcessor.generateDocumentMetadata(collection);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}));

// Generate collection metadata
router.post('/collections/:collection/generate-metadata', requireAuth, asyncHandler(async (req, res) => {
  try {
    const { collection } = req.params;
    const result = await documentProcessor.generateCollectionMetadata(collection);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}));



export default router;