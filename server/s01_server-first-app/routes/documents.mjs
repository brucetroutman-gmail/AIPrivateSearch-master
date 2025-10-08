import express from 'express';
import multer from 'multer';
import { secureFs } from '../lib/utils/secureFileOps.mjs';
import { UnifiedEmbeddingService } from '../lib/documents/unifiedEmbeddingService.mjs';
import path from 'path';

const router = express.Router();
const embeddingService = new UnifiedEmbeddingService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Create new collection
router.post('/collections/create', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, error: 'Collection name is required' });
    }
    
    if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
      return res.status(400).json({ success: false, error: 'Collection name can only contain letters, numbers, hyphens, and underscores' });
    }
    
    const collectionPath = path.join('../../sources/local-documents', name);
    
    // Check if collection already exists
    try {
      await secureFs.stat(collectionPath);
      return res.status(409).json({ success: false, error: 'Collection already exists' });
    } catch (error) {
      // Collection doesn't exist, continue with creation
    }
    
    // Create collection directory
    await secureFs.mkdir(collectionPath, { recursive: true });
    
    res.json({ success: true, message: `Collection '${name}' created successfully` });
  } catch (error) {
    if (error.message.includes('Path traversal')) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload file to collection
router.post('/collections/:collection/upload', upload.single('file'), async (req, res) => {
  try {
    const { collection } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }
    
    const filename = req.file.originalname;
    const collectionPath = path.join('../../sources/local-documents', collection);
    const filePath = path.join(collectionPath, filename);
    
    // Ensure collection directory exists
    await secureFs.mkdir(collectionPath, { recursive: true });
    
    // Write file to disk
    await secureFs.writeFile(filePath, req.file.buffer);
    
    res.json({ success: true, message: `File '${filename}' uploaded successfully` });
  } catch (error) {
    if (error.message.includes('Path traversal')) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Convert selected documents to markdown
router.post('/convert-selected', async (req, res) => {
  try {
    const { collection, files } = req.body;
    
    if (!collection || !files || !Array.isArray(files)) {
      return res.status(400).json({ success: false, error: 'Collection and files array required' });
    }
    
    let converted = 0;
    const errors = [];
    
    for (const filename of files) {
      try {
        const ext = filename.split('.').pop().toLowerCase();
        
        // Skip files that are already markdown
        if (ext === 'md') {
          continue;
        }
        
        const sourcePath = path.join('../../sources/local-documents', collection, filename);
        const targetPath = path.join('../../sources/local-documents', collection, filename.replace(/\.[^.]+$/, '.md'));
        
        // Read source file
        const content = await secureFs.readFile(sourcePath, 'utf8');
        
        // Simple conversion - just wrap in markdown code block for non-text files
        let markdownContent;
        if (ext === 'txt') {
          markdownContent = content;
        } else {
          markdownContent = `# ${filename}\n\n\`\`\`\n${content}\n\`\`\``;
        }
        
        // Write markdown file
        await secureFs.writeFile(targetPath, markdownContent, 'utf8');
        converted++;
      } catch (error) {
        errors.push(`${filename}: ${error.message}`);
      }
    }
    
    if (errors.length > 0) {
      return res.json({ success: true, converted, errors });
    }
    
    res.json({ success: true, converted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get files in a collection
router.get('/collections/:collection/files', async (req, res) => {
  try {
    const { collection } = req.params;
    const collectionPath = path.join('../../sources/local-documents', collection);
    
    const files = await secureFs.readdir(collectionPath);
    const fileList = files.filter(file => !file.startsWith('.'));
    
    res.json({ files: fileList });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.status(500).json({ error: 'Failed to load collection files' });
  }
});

// Get indexed documents status
router.get('/collections/:collection/indexed', async (req, res) => {
  try {
    const { collection } = req.params;
    const documents = await embeddingService.listDocuments(collection);
    const chunkCounts = await embeddingService.getChunkCounts(collection);
    
    const indexedDocs = documents.map(doc => ({
      filename: doc.filename,
      inLanceDB: true,
      chunks: chunkCounts[doc.filename] || 0,
      processed_at: doc.processed_at
    }));
    
    res.json({ documents: indexedDocs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load indexed documents' });
  }
});

// Index/embed a document
router.post('/collections/:collection/index/:filename', async (req, res) => {
  try {
    const { collection, filename } = req.params;
    
    // Read the document content
    const filePath = path.join('../../sources/local-documents', collection, filename);
    const content = await secureFs.readFile(filePath, 'utf8');
    
    // Process with embedding service
    const result = await embeddingService.processDocument(filename, content, collection);
    
    res.json(result);
  } catch (error) {
    if (error.message.includes('Path traversal')) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    if (error.code === 'ENOENT') {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove document embeddings
router.delete('/collections/:collection/index/:filename', async (req, res) => {
  try {
    const { collection, filename } = req.params;
    const result = await embeddingService.removeDocument(collection, filename);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get embeddings info
router.get('/collections/:collection/embeddings-info', async (req, res) => {
  try {
    const { collection } = req.params;
    const documents = await embeddingService.listDocuments(collection);
    const chunkCounts = await embeddingService.getChunkCounts(collection);
    
    const totalChunks = Object.values(chunkCounts).reduce((sum, count) => sum + count, 0);
    
    res.json({
      lanceDB: {
        documents: documents.map(doc => ({
          filename: doc.filename,
          chunks: chunkCounts[doc.filename] || 0
        })),
        totalChunks
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get embeddings info' });
  }
});

// Search in collection
router.post('/collections/:collection/search', async (req, res) => {
  try {
    const { collection } = req.params;
    const { query, limit = 5 } = req.body;
    
    const results = await embeddingService.findSimilarChunks(query, collection, limit);
    
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Delete individual file
router.delete('/collections/:collection/files/:filename', async (req, res) => {
  try {
    const { collection, filename } = req.params;
    
    const filePath = path.join('../../sources/local-documents', collection, filename);
    await secureFs.unlink(filePath);
    
    res.json({ success: true });
  } catch (error) {
    if (error.message.includes('Path traversal')) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    if (error.code === 'ENOENT') {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete entire collection
router.delete('/collections/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    
    // Remove all embeddings for this collection
    const documents = await embeddingService.listDocuments(collection);
    for (const doc of documents) {
      await embeddingService.removeDocument(collection, doc.filename);
    }
    
    // Remove collection folder
    const collectionPath = path.join('../../sources/local-documents', collection);
    await secureFs.rmdir(collectionPath, { recursive: true });
    
    res.json({ success: true });
  } catch (error) {
    if (error.message.includes('Path traversal')) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// View document with line numbers and highlighting
router.get('/:collection/:filename/view', async (req, res) => {
  try {
    const { collection, filename } = req.params;
    const { line } = req.query;
    
    const filePath = path.join('../../sources/local-documents', collection, filename);
    const content = await secureFs.readFile(filePath, 'utf8');
    
    const lines = content.split('\n');
    const targetLine = line ? parseInt(line) : null;
    
    let html = `<!DOCTYPE html>
<html>
<head>
  <title>${filename}</title>
  <style>
    body { font-family: monospace; margin: 20px; background: #f5f5f5; color: #333; }
    .line { padding: 2px 5px; border-left: 3px solid transparent; }
    .line-number { color: #666; margin-right: 10px; user-select: none; }
    .highlight { background: yellow; border-left-color: #ff6b35; }
    .content { white-space: pre-wrap; }
    h1 { color: #333; }
    
    @media (prefers-color-scheme: dark) {
      body { background: #1a1a1a; color: #e0e0e0; }
      .line-number { color: #888; }
      .highlight { background: #4a4a00; color: #fff; border-left-color: #ff6b35; }
      h1 { color: #87ceeb; }
    }
  </style>
</head>
<body>
  <h1>${filename}</h1>
  <div class="document">`;
    
    lines.forEach((lineContent, index) => {
      const lineNum = index + 1;
      const isHighlight = targetLine && lineNum === targetLine;
      html += `<div class="line${isHighlight ? ' highlight' : ''}" id="line-${lineNum}">`;
      html += `<span class="line-number">${lineNum.toString().padStart(4, ' ')}:</span>`;
      html += `<span class="content">${lineContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`;
      html += `</div>`;
    });
    
    html += `</div>`;
    
    if (targetLine) {
      html += `<script>document.getElementById('line-${targetLine}').scrollIntoView({behavior: 'smooth', block: 'center'});</script>`;
    }
    
    html += `</body></html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    if (error.message.includes('Path traversal')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.status(500).json({ error: 'Failed to load document' });
  }
});

// Serve document files (must be last due to generic pattern)
router.get('/:collection/:filename', async (req, res) => {
  try {
    const { collection, filename } = req.params;
    
    // Get file extension
    const ext = filename.split('.').pop().toLowerCase();
    const allowedExtensions = ['md', 'txt', 'pdf', 'doc', 'docx'];
    
    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({ error: 'File type not supported' });
    }
    
    const filePath = path.join('../../sources/local-documents', collection, filename);
    
    // Set appropriate content type and read method based on file type
    if (ext === 'md' || ext === 'txt') {
      const content = await secureFs.readFile(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(content);
    } else {
      // Binary files (PDF, DOC, DOCX)
      const content = await secureFs.readFile(filePath);
      
      const contentTypes = {
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      
      res.setHeader('Content-Type', contentTypes[ext]);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.send(content);
    }
  } catch (error) {
    if (error.message.includes('Path traversal')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.status(500).json({ error: 'Failed to load document' });
  }
});

export default router;