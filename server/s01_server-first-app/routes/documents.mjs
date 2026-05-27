 
 
import express from 'express';
import multer from 'multer';
import { secureFs } from '../lib/utils/secureFileOps.mjs';
import { UnifiedEmbeddingService } from '../lib/documents/unifiedEmbeddingService.mjs';
import { DocumentProcessor } from '../lib/documents/documentProcessor.mjs';
import { CollectionsUtil } from '../lib/utils/collectionsUtil.mjs';
import path from 'path';
import XLSX from 'xlsx';

const router = express.Router();
const embeddingService = new UnifiedEmbeddingService();
const documentProcessor = new DocumentProcessor();

// Validate file content before accepting upload
async function validateFile(filename, buffer) {
  const ext = path.extname(filename).toLowerCase();
  const content = buffer.toString('utf8');

  if (ext === '.json') {
    // Strip DocID header in both formats before parsing
    const clean = content
      .replace(/^\[\s*\nDocID:\s*[^\n]+\n/, '[\n')
      .replace(/^DocID:\s*[^\n]+\n?/, '')
      .trim();
    try { JSON.parse(clean); } catch (e) {
      return `Invalid JSON: ${e.message}. Please fix the file and re-upload.`;
    }
  }

  if (ext === '.csv' || ext === '.tsv') {
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length === 0) return 'File is empty.';
    const sep = ext === '.tsv' ? '\t' : ',';
    const colCount = lines[0].split(sep).length;
    const badLine = lines.slice(1).findIndex(l => l.split(sep).length !== colCount);
    if (badLine >= 0) return `Inconsistent column count at line ${badLine + 2}. Please check the file.`;
  }

  if (ext === '.md' || ext === '.txt') {
    if (content.trim().length === 0) return 'File is empty.';
  }

  return null; // valid
}

// Get all collections
router.get('/collections', async (req, res) => {
  try {
    const collections = await CollectionsUtil.getCollectionNames();
    res.json({ collections });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load collections' });
  }
});

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
    
    const collectionPath = path.join(CollectionsUtil.getCollectionsPath(), name);
    
    // Check if collection already exists
    try {
      await secureFs.stat(collectionPath);
      return res.status(409).json({ success: false, error: 'Collection already exists' });
    } catch (error) {
      // Collection doesn't exist, continue with creation
    }
    
    // Create collection directory and manifest
    await secureFs.mkdir(collectionPath, { recursive: true });
    await CollectionsUtil.createManifest(name);
    
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
    const collectionPath = path.join(CollectionsUtil.getCollectionsPath(), collection);
    const filePath = path.join(collectionPath, filename);
    
    // Validate file content before accepting
    const ext = path.extname(filename).toLowerCase();
    const textExts = ['.json', '.csv', '.tsv', '.md', '.txt'];
    if (textExts.includes(ext)) {
      const validationError = await validateFile(filename, req.file.buffer);
      if (validationError) {
        return res.status(400).json({ success: false, error: `Validation failed for '${filename}': ${validationError}` });
      }
    }

    // Ensure collection directory exists
    await secureFs.mkdir(collectionPath, { recursive: true });
    
    // Write file to disk
    await secureFs.writeFile(filePath, req.file.buffer);

    // Add to manifest
    await CollectionsUtil.addToManifest(collection, filePath, filename);

    // If source is already .md, set convertedFile immediately
    if (ext === '.md') {
      const baseName = path.basename(filename, ext);
      await CollectionsUtil.updateConvertedFile(collection, baseName, filename);
    }
    
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
        
        const sourcePath = path.join(CollectionsUtil.getCollectionsPath(), collection, filename);

        // Validate file before converting
        const fileBuffer = await secureFs.readFile(sourcePath);
        const validationError = await validateFile(filename, fileBuffer);
        if (validationError) {
          errors.push(`ERROR: Badly formed file '${filename}' — ${validationError} Please fix and re-upload.`);
          continue;
        }
        
        // Convert all files to Markdown using DocumentProcessor
        const targetPath = path.join(CollectionsUtil.getCollectionsPath(), collection, filename.replace(/\.[^.]+$/, '.md'));
        const markdownContent = await documentProcessor.convertToMarkdown(sourcePath);
        
        // Write markdown file
        await secureFs.writeFile(targetPath, markdownContent, 'utf8');

        // Update manifest convertedFile
        const baseName = filename.substring(0, filename.lastIndexOf('.')) || filename;
        const convertedFilename = baseName + '.md';
        await CollectionsUtil.updateConvertedFile(collection, baseName, convertedFilename);

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

    const manifest = await CollectionsUtil.readManifest(collection);
    if (!manifest) {
      return res.status(409).json({ 
        error: 'Collection has no manifest (collection.json). Please delete and recreate this collection.',
        legacy: true
      });
    }

    const files = manifest.documents.map(doc => ({
      name: doc.name,
      sourcePath: doc.sourcePath,
      sourceExt: doc.sourceExt,
      convertedFile: doc.convertedFile,
      addedAt: doc.addedAt,
      id: doc.id
    }));
    return res.json({ files, manifest: true });
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
    const collectionPath = path.join(CollectionsUtil.getCollectionsPath(), collection);

    // Prefer converted .md over raw source file
    const ext = path.extname(filename).toLowerCase();
    const baseName = path.basename(filename, ext);
    const mdFilename = baseName + '.md';
    const mdPath = path.join(collectionPath, mdFilename);

    let embedFilename = filename;
    let filePath = path.join(collectionPath, filename);

    if (ext !== '.md') {
      try {
        await secureFs.stat(mdPath);
        embedFilename = mdFilename;
        filePath = mdPath;
        console.log(`[embed] Using converted .md for ${filename} -> ${mdFilename}`);
      } catch { /* no .md version, embed source file as-is */ }
    }

    const content = await secureFs.readFile(filePath, 'utf8');
    const result = await embeddingService.processDocument(embedFilename, content, collection);
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

// Delete individual file — removes from manifest only, source file stays on disk
router.delete('/collections/:collection/files/:filename', async (req, res) => {
  try {
    const { collection, filename } = req.params;

    const manifest = await CollectionsUtil.readManifest(collection);
    if (!manifest) {
      return res.status(409).json({ success: false, error: 'Collection has no manifest. Please delete and recreate this collection.', legacy: true });
    }

    await CollectionsUtil.removeFromManifest(collection, filename);

    // Delete converted .md file from collection folder if it exists
    const baseName = filename.substring(0, filename.lastIndexOf('.')) || filename;
    const mdPath = path.join(CollectionsUtil.getCollectionsPath(), collection, `${baseName}.md`);
    try { await secureFs.unlink(mdPath); } catch { /* md may not exist */ }

    return res.json({ success: true });
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
    const collectionPath = path.join(CollectionsUtil.getCollectionsPath(), collection);
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
    const { line, search } = req.query;
    
    const filePath = path.join(CollectionsUtil.getCollectionsPath(), collection, filename);
    const content = await secureFs.readFile(filePath, 'utf8');
    
    const lines = content.split('\n');
    const targetLine = line ? parseInt(line) : null;
    const searchTerm = search ? search.trim() : null;
    
    // Build regex for search term highlighting
    let searchRegex = null;
    let firstMatchLine = null;
    if (searchTerm) {
      const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      searchRegex = new RegExp(`(${escaped})`, 'gi');
    }
    
    let html = `<!DOCTYPE html>
<html>
<head>
  <title>${filename}</title>
  <style>
    body { font-family: monospace; margin: 20px; background: #f5f5f5; color: #333; }
    .line { padding: 2px 5px; border-left: 3px solid transparent; }
    .line-number { color: #666; margin-right: 10px; user-select: none; }
    .highlight { background: #fffde0; border-left-color: #ff6b35; }
    .search-match mark { background: #ffeb3b; padding: 1px 2px; border-radius: 2px; }
    .content { white-space: pre-wrap; }
    h1 { color: #333; }
    
    @media (prefers-color-scheme: dark) {
      body { background: #1a1a1a; color: #e0e0e0; }
      .line-number { color: #888; }
      .highlight { background: #3a3a00; border-left-color: #ff6b35; }
      .search-match mark { background: #b8860b; color: #fff; }
      h1 { color: #87ceeb; }
    }
  </style>
</head>
<body>
  <h1>${filename}</h1>
  <div class="document">`;
    
    lines.forEach((lineContent, index) => {
      const lineNum = index + 1;
      const escapedContent = lineContent.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      // Check if this line contains the search term
      let hasMatch = false;
      let displayContent = escapedContent;
      if (searchRegex) {
        // Test against original text (case-insensitive)
        if (searchRegex.test(lineContent)) {
          hasMatch = true;
          if (!firstMatchLine) firstMatchLine = lineNum;
          // Apply highlighting to the escaped content
          const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          displayContent = escapedContent.replace(new RegExp(`(${escapedTerm})`, 'gi'), '<mark>$1</mark>');
        }
        searchRegex.lastIndex = 0; // Reset regex state
      }
      
      const isTargetLine = targetLine && lineNum === targetLine;
      const lineClass = (isTargetLine || hasMatch) ? 'line highlight' + (hasMatch ? ' search-match' : '') : 'line';
      
      html += `<div class="${lineClass}" id="line-${lineNum}">`;
      html += `<span class="line-number">${lineNum.toString().padStart(4, ' ')}:</span>`;
      html += `<span class="content">${displayContent}</span>`;
      html += `</div>`;
    });
    
    html += `</div>`;
    
    // Scroll to target line, or first match if no line specified
    const scrollTarget = targetLine || firstMatchLine;
    if (scrollTarget) {
      html += `<script>document.getElementById('line-${scrollTarget}').scrollIntoView({behavior: 'smooth', block: 'center'});</script>`;
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
    const allowedExtensions = [
      'md', 'txt', 'json', 'csv', 'tsv', 'yaml', 'yml', 'xml', 'html', 'htm',
      'py', 'js', 'java', 'cpp', 'c', 'h', 'css', 'sql', 'log', 'eml', 'tex',
      'rtf', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'epub'
    ];
    
    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({ error: 'File type not supported' });
    }
    
    const filePath = path.join(CollectionsUtil.getCollectionsPath(), collection, filename);
    
    // Set appropriate content type and read method based on file type
    const textExtensions = ['md', 'txt', 'json', 'csv', 'tsv', 'yaml', 'yml', 'xml', 'html', 'htm', 'py', 'js', 'java', 'cpp', 'c', 'h', 'css', 'sql', 'log', 'eml', 'tex', 'rtf'];
    
    if (textExtensions.includes(ext)) {
      const content = await secureFs.readFile(filePath, 'utf8');
      
      const contentTypes = {
        json: 'application/json; charset=utf-8',
        csv: 'text/csv; charset=utf-8',
        tsv: 'text/tab-separated-values; charset=utf-8',
        yaml: 'application/x-yaml; charset=utf-8',
        yml: 'application/x-yaml; charset=utf-8',
        xml: 'application/xml; charset=utf-8',
        html: 'text/html; charset=utf-8',
        htm: 'text/html; charset=utf-8',
        js: 'application/javascript; charset=utf-8',
        css: 'text/css; charset=utf-8',
        py: 'text/x-python; charset=utf-8',
        java: 'text/x-java-source; charset=utf-8',
        cpp: 'text/x-c++src; charset=utf-8',
        c: 'text/x-csrc; charset=utf-8',
        h: 'text/x-chdr; charset=utf-8',
        sql: 'application/sql; charset=utf-8',
        tex: 'application/x-latex; charset=utf-8',
        rtf: 'application/rtf; charset=utf-8',
        eml: 'message/rfc822; charset=utf-8'
      };
      
      res.setHeader('Content-Type', contentTypes[ext] || 'text/plain; charset=utf-8');
      res.send(content);
    } else {
      // Binary files (PDF, DOC, DOCX)
      const content = await secureFs.readFile(filePath);
      
      const contentTypes = {
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ppt: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        odt: 'application/vnd.oasis.opendocument.text',
        ods: 'application/vnd.oasis.opendocument.spreadsheet',
        odp: 'application/vnd.oasis.opendocument.presentation',
        epub: 'application/epub+zip'
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