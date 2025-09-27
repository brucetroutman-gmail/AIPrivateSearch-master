import express from 'express';
import { CollectionManager } from '../lib/documents/collectionManager.mjs';
import { DocumentSearch } from '../lib/documents/documentSearch.mjs';
import { DocumentProcessor } from '../lib/documents/documentProcessor.mjs';
import { asyncHandler } from '../middleware/errorHandler.mjs';
import { requireAuth, requireAdminAuth } from '../middleware/auth.mjs';
import { UnifiedEmbeddingService } from '../lib/documents/unifiedEmbeddingService.mjs';
import loggerPkg from '../../../shared/utils/logger.mjs';
const { logger } = loggerPkg;
import { validatePath, validateFilename } from '../lib/utils/pathValidator.mjs';
import { secureFs } from '../lib/utils/secureFileOps.mjs';
import path from 'path';

const router = express.Router();
const collectionManager = new CollectionManager();
const documentProcessor = new DocumentProcessor();
const embeddingService = new UnifiedEmbeddingService();

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
  
  if (await secureFs.exists(collectionPath)) {
    return res.status(409).json({ error: 'Collection already exists' });
  }
  
  await secureFs.ensureDir(collectionPath);
  
  const readmeContent = `# ${name} Collection\n\nThis is a document collection for AI search and analysis.\n\nAdd your documents to this folder and use the Collections interface to convert and index them.\n`;
  await secureFs.writeFile(path.join(collectionPath, 'README.md'), readmeContent, 'utf8');
  
  res.json({ success: true, message: `Collection '${name}' created successfully` });
}));

router.delete('/collections/:collection', requireAdminAuth, asyncHandler(async (req, res) => {
  const collection = req.params.collection;
  
  try {
    // Remove all embeddings from local storage
    const localEmbeddingsPath = path.join(process.cwd(), 'data', 'embeddings', collection);
    if (await secureFs.exists(localEmbeddingsPath)) {
      await secureFs.remove(localEmbeddingsPath);
    }
    
    // Remove all embeddings from unified service
    try {
      const documents = await embeddingService.listDocuments(collection);
      for (const doc of documents) {
        await embeddingService.removeDocument(collection, doc.filename);
      }
    } catch (error) {
      logger.log(`Unified embeddings for collection ${collection} not found or already removed`);
    }
    
    // Remove collection folder and all files
    const baseDir = path.join(process.cwd(), '../../sources/local-documents');
    const collectionPath = validatePath(collection, baseDir);
    if (await secureFs.exists(collectionPath)) {
      await secureFs.remove(collectionPath);
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
    
    file.pipe(secureFs.createWriteStream(saveTo));
    
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
      await secureFs.writeFile(filePath, buffer);
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
        
        await secureFs.writeFile(outputPath, markdown, 'utf8');
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
async function processFiles(collection, files = null, vectorDB = 'local') {
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
      await documentSearch.indexDocument(filename, document.content, vectorDB);
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
  const { collection, vectorDB } = req.body;
  const result = await processFiles(collection, null, vectorDB);
  res.json({ success: true, ...result });
}));

router.post('/process-selected', requireAuth, asyncHandler(async (req, res) => {
  const { collection, files, vectorDB } = req.body;
  const result = await processFiles(collection, files, vectorDB);
  res.json({ success: true, ...result });
}));

// Embedding Operations
router.post('/collections/:collection/index/:filename', requireAuth, async (req, res) => {
  try {
    const document = await collectionManager.readDocument(req.params.collection, req.params.filename);
    
    const result = await embeddingService.processDocument(
      req.params.filename, 
      document.content, 
      req.params.collection
    );
    
    // Add helpful message about reuse
    if (result.reused) {
      result.message = 'Document already embedded, reused existing embeddings';
    } else {
      result.message = 'Document embedded successfully';
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Embedding operation failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/collections/:collection/index/:filename', requireAuth, async (req, res) => {
  try {
    const result = await embeddingService.removeDocument(req.params.collection, req.params.filename);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search Operations
router.post('/collections/:collection/search', requireAuth, async (req, res) => {
  try {
    const results = await embeddingService.findSimilarChunks(
      req.body.query, 
      req.params.collection, 
      req.body.limit || 5
    );
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/collections/:collection/indexed', requireAuth, async (req, res) => {
  try {
    const documents = await embeddingService.listDocuments(req.params.collection);
    
    const formattedDocs = documents.map(doc => ({
      filename: doc.filename,
      inLocal: false,
      inLanceDB: true, // Using unified SQLite service
      metadata: {}
    }));
    
    res.json({ documents: formattedDocs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/collections/:collection/embeddings-info', requireAuth, async (req, res) => {
  try {
    const chunkCounts = await embeddingService.getChunkCounts(req.params.collection);
    const stats = await embeddingService.getStats();
    
    const unifiedInfo = {
      documents: Object.entries(chunkCounts).map(([filename, chunks]) => ({
        filename,
        chunks
      })),
      totalChunks: Object.values(chunkCounts).reduce((sum, count) => sum + count, 0),
      globalStats: stats
    };
    
    res.json({ local: { documents: [], totalChunks: 0 }, lanceDB: unifiedInfo });
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