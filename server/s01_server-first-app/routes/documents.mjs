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

router.post('/collections/create', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Collection name is required' });
    }
    
    // Validate collection name
    if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
      return res.status(400).json({ error: 'Collection name can only contain letters, numbers, hyphens, and underscores' });
    }
    
    const collectionPath = path.join(process.cwd(), '../../sources/local-documents', name);
    
    // Check if collection already exists
    if (await fs.pathExists(collectionPath)) {
      return res.status(409).json({ error: 'Collection already exists' });
    }
    
    // Create the directory
    await fs.ensureDir(collectionPath);
    
    // Create a README file
    const readmeContent = `# ${name} Collection\n\nThis is a document collection for AI search and analysis.\n\nAdd your documents to this folder and use the Collections interface to convert and index them.\n`;
    await fs.writeFile(path.join(collectionPath, 'README.md'), readmeContent, 'utf8');
    
    res.json({ success: true, message: `Collection '${name}' created successfully` });
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

router.post('/collections/:collection/files/:filename/open', async (req, res) => {
  try {
    const filePath = path.join(process.cwd(), '../../sources/local-documents', req.params.collection, req.params.filename);
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

router.post('/collections/:collection/upload', async (req, res) => {
  try {
    const busboy = (await import('busboy')).default;
    const bb = busboy({ headers: req.headers });
    
    bb.on('file', (name, file, info) => {
      const { filename } = info;
      const collectionPath = path.join(process.cwd(), '../../sources/local-documents', req.params.collection);
      const saveTo = path.join(collectionPath, filename);
      
      file.pipe(fs.createWriteStream(saveTo));
      
      file.on('end', () => {
        res.json({ success: true, filename });
      });
    });
    
    bb.on('error', (err) => {
      res.status(500).json({ success: false, error: err.message });
    });
    
    req.pipe(bb);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/collections/:collection/upload-chunk', async (req, res) => {
  try {
    const busboy = (await import('busboy')).default;
    const bb = busboy({ headers: req.headers });
    
    let filename, chunkIndex, totalChunks, chunkData;
    
    bb.on('field', (name, val) => {
      if (name === 'filename') filename = val;
      if (name === 'chunkIndex') chunkIndex = parseInt(val);
      if (name === 'totalChunks') totalChunks = parseInt(val);
    });
    
    bb.on('file', (name, file, info) => {
      const chunks = [];
      file.on('data', (data) => chunks.push(data));
      file.on('end', () => {
        chunkData = Buffer.concat(chunks);
      });
    });
    
    bb.on('finish', async () => {
      try {
        const collectionPath = path.join(process.cwd(), '../../sources/local-documents', req.params.collection);
        const tempDir = path.join(collectionPath, '.chunks');
        await fs.ensureDir(tempDir);
        
        const chunkFile = path.join(tempDir, `${filename}.${chunkIndex}`);
        await fs.writeFile(chunkFile, chunkData);
        
        // If this is the last chunk, combine all chunks
        if (chunkIndex === totalChunks - 1) {
          const finalFile = path.join(collectionPath, filename);
          const writeStream = fs.createWriteStream(finalFile);
          
          for (let i = 0; i < totalChunks; i++) {
            const chunkPath = path.join(tempDir, `${filename}.${i}`);
            const chunkBuffer = await fs.readFile(chunkPath);
            writeStream.write(chunkBuffer);
            await fs.remove(chunkPath);
          }
          
          writeStream.end();
          await fs.remove(tempDir);
        }
        
        res.json({ success: true, chunkIndex, totalChunks });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    req.pipe(bb);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});



router.post('/collections/:collection/files/:filename', async (req, res) => {
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

router.post('/convert-selected', async (req, res) => {
  try {
    const { collection, files } = req.body;
    const collectionPath = path.join(process.cwd(), '../../sources/local-documents', collection);
    let converted = 0;
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      
      // Skip MD files - no conversion needed
      if (ext === '.md') {
        continue;
      }
      
      // Only convert PDF and TXT files
      if (ext === '.pdf' || ext === '.txt') {
        try {
          const filePath = path.join(collectionPath, file);
          const markdown = await documentProcessor.convertToMarkdown(filePath);
          const outputFile = file.replace(ext, '.md');
          const outputPath = path.join(collectionPath, outputFile);
          
          await fs.writeFile(outputPath, markdown, 'utf8');
          converted++;
        } catch (error) {
          console.error(`Error converting ${file}:`, error.message);
        }
      }
    }
    
    res.json({ success: true, converted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Document Processing
router.post('/process', async (req, res) => {
  try {
    const { collection } = req.body;
    
    const documentSearch = new DocumentSearch(collection);
    await documentSearch.initialize();
    
    const files = await collectionManager.getCollectionFiles(collection);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    let processed = 0;
    
    for (const filename of mdFiles) {
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

router.post('/process-selected', async (req, res) => {
  try {
    const { collection, files } = req.body;
    
    const documentSearch = new DocumentSearch(collection);
    await documentSearch.initialize();
    
    let processed = 0;
    const total = files.length;
    
    for (let i = 0; i < files.length; i++) {
      const filename = files[i];
      try {
        const document = await collectionManager.readDocument(collection, filename);
        await documentSearch.indexDocument(filename, document.content);
        processed++;
      } catch (error) {
        console.error(`Error processing ${filename}:`, error.message);
      }
    }
    
    res.json({ success: true, processed, total });
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
    
    // Estimate chunks based on content length (roughly 500 chars per chunk)
    const estimatedChunks = Math.ceil(document.content.length / 500);
    
    const result = await documentSearch.indexDocument(req.params.filename, document.content);
    
    // Add chunk information to result
    result.estimatedChunks = estimatedChunks;
    result.actualChunks = result.chunks || estimatedChunks;
    
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