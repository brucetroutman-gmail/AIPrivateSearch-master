import fs from 'fs-extra';
import path from 'path';

export class DocumentProcessor {
  constructor() {
    this.supportedFormats = ['.txt', '.pdf'];
  }

  async convertToMarkdown(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.txt':
        return await this.processText(filePath);
      case '.pdf':
        return await this.processPDF(filePath);
      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  async processText(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const filename = path.basename(filePath, '.txt');
    
    return `# ${filename}\n\n${content}`;
  }

  async processPDF(filePath) {
    // For now, return placeholder - PDF processing requires additional dependencies
    const filename = path.basename(filePath, '.pdf');
    return `# ${filename}\n\n[PDF content - requires pdf-parse dependency for full processing]`;
  }

  async convertCollectionFiles(collection) {
    const collectionPath = path.join(process.cwd(), '../../sources/local-documents', collection);
    const files = await fs.readdir(collectionPath);
    const results = [];

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (this.supportedFormats.includes(ext)) {
        try {
          const filePath = path.join(collectionPath, file);
          const markdown = await this.convertToMarkdown(filePath);
          const outputFile = file.replace(ext, '.md');
          const outputPath = path.join(collectionPath, outputFile);
          
          await fs.writeFile(outputPath, markdown, 'utf8');
          results.push({ original: file, converted: outputFile, success: true });
        } catch (error) {
          results.push({ original: file, error: error.message, success: false });
        }
      }
    }

    return results;
  }
}