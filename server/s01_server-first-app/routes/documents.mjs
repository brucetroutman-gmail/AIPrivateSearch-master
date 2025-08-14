import express from 'express';
import { CollectionManager } from '../lib/documents/collectionManager.mjs';
import { DocumentSearch } from '../lib/documents/documentSearch.mjs';
import { DocumentProcessor } from '../lib/documents/documentProcessor.mjs';
import fs from 'fs-extra';
import path from 'path';

const router = express.Router();
const collectionManager = new CollectionManager();
const documentProcessor = new DocumentProcessor();

// CRUD Operations
router.get('/collections', async (req, res) => {
  try {
    const collections = await collectionManager.listCollections();
    res.json({ collections });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/collections/:collection/files', async (req, res) => {
  try {
    const files = await collectionManager.getCollectionFiles(req.params.collection);
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/collections/:collection/files/:filename', async (req, res) => {
  try {
    const document = await collectionManager.readDocument(req.params.collection, req.params.filename);
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/collections/:collection/files/:filename', async (req, res) => {
  try {
    const result = await collectionManager.createDocument(req.params.collection, req.params.filename, req.body.content);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/collections/:collection/files/:filename', async (req, res) => {
  try {
    const result = await collectionManager.updateDocument(req.params.collection, req.params.filename, req.body.content);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/collections/:collection/files/:filename', async (req, res) => {
  try {
    const result = await collectionManager.deleteDocument(req.params.collection, req.params.filename);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Document Conversion
router.post('/convert', async (req, res) => {
  try {
    const { collection } = req.body;
    const results = await documentProcessor.convertCollectionFiles(collection);
    const converted = results.filter(r => r.success).length;
    
    res.json({ success: true, converted, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Document Processing
router.post('/process', async (req, res) => {
  try {
    const { collection } = req.body;
    
    // First convert any non-markdown files
    await convertNonMarkdownFiles(collection);
    
    // Then process and index
    const documentSearch = new DocumentSearch(collection);
    await documentSearch.initialize();
    
    const files = await collectionManager.getCollectionFiles(collection);
    let processed = 0;
    
    for (const filename of files) {
      try {
        const document = await collectionManager.readDocument(collection, filename);
        await documentSearch.indexDocument(filename, document.content);
        processed++;
      } catch (error) {
        console.error(`Error processing ${filename}:`, error.message);
      }
    }
    
    res.json({ success: true, processed });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Embedding Operations
router.post('/collections/:collection/index/:filename', async (req, res) => {
  try {
    const documentSearch = new DocumentSearch(req.params.collection);
    await documentSearch.initialize();
    
    const document = await collectionManager.readDocument(req.params.collection, req.params.filename);
    const result = await documentSearch.indexDocument(req.params.filename, document.content);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/collections/:collection/index/:filename', async (req, res) => {
  try {
    const documentSearch = new DocumentSearch(req.params.collection);
    await documentSearch.initialize();
    
    const result = await documentSearch.removeDocument(req.params.filename);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search Operations
router.post('/collections/:collection/search', async (req, res) => {
  try {
    const documentSearch = new DocumentSearch(req.params.collection);
    await documentSearch.initialize();
    
    const results = await documentSearch.searchDocuments(req.body.query, req.body.limit || 5);
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/collections/:collection/indexed', async (req, res) => {
  try {
    const documentSearch = new DocumentSearch(req.params.collection);
    await documentSearch.initialize();
    
    const documents = await documentSearch.listIndexedDocuments();
    res.json({ documents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function
async function convertNonMarkdownFiles(collection) {
  const collectionPath = path.join(process.cwd(), '../../sources/local-documents', collection);
  const allFiles = await fs.readdir(collectionPath);
  
  const nonMdFiles = allFiles.filter(file => {
    const ext = path.extname(file).toLowerCase();
    const baseName = path.basename(file, ext);
    const mdExists = allFiles.includes(`${baseName}.md`);
    return documentProcessor.supportedFormats.includes(ext) && !mdExists;
  });
  
  for (const file of nonMdFiles) {
    try {
      const filePath = path.join(collectionPath, file);
      const markdown = await documentProcessor.convertToMarkdown(filePath);
      const outputFile = file.replace(path.extname(file), '.md');
      const outputPath = path.join(collectionPath, outputFile);
      
      await fs.writeFile(outputPath, markdown, 'utf8');
    } catch (error) {
      console.error(`Error converting ${file}:`, error.message);
    }
  }
}

export default router;