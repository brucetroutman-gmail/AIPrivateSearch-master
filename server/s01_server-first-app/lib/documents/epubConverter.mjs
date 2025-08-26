import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class EpubConverter {
  constructor() {
    this.checkDependencies();
  }

  checkDependencies() {
    try {
      execSync('which pandoc', { stdio: 'ignore' });
    } catch (error) {
      console.warn('Pandoc not found. Install with: brew install pandoc');
    }
  }

  async convertEpubToMarkdown(epubPath, outputDir = null) {
    try {
      const epubFile = path.resolve(epubPath);
      
      if (!fs.existsSync(epubFile)) {
        throw new Error(`EPUB file not found: ${epubFile}`);
      }

      // Set output directory to same as EPUB file if not specified
      const targetDir = outputDir || path.dirname(epubFile);
      const baseName = path.basename(epubFile, '.epub');
      const outputFile = path.join(targetDir, `${baseName}.md`);

      console.log(`Converting ${epubFile} to ${outputFile}`);

      // Use pandoc to convert EPUB to Markdown
      const command = `pandoc "${epubFile}" -t markdown -o "${outputFile}"`;
      
      execSync(command, { stdio: 'inherit' });

      // Verify output file was created
      if (fs.existsSync(outputFile)) {
        const stats = fs.statSync(outputFile);
        console.log(`✅ Conversion successful: ${outputFile} (${Math.round(stats.size / 1024)}KB)`);
        return outputFile;
      } else {
        throw new Error('Output file was not created');
      }

    } catch (error) {
      console.error('EPUB conversion failed:', error.message);
      throw error;
    }
  }

  async convertAllEpubsInDirectory(dirPath) {
    try {
      const files = fs.readdirSync(dirPath);
      const epubFiles = files.filter(file => file.toLowerCase().endsWith('.epub'));
      
      if (epubFiles.length === 0) {
        console.log('No EPUB files found in directory');
        return [];
      }

      console.log(`Found ${epubFiles.length} EPUB file(s) to convert`);
      const results = [];

      for (const epubFile of epubFiles) {
        const epubPath = path.join(dirPath, epubFile);
        try {
          const outputFile = await this.convertEpubToMarkdown(epubPath);
          results.push({ success: true, input: epubPath, output: outputFile });
        } catch (error) {
          results.push({ success: false, input: epubPath, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('Directory processing failed:', error.message);
      throw error;
    }
  }
}

export default EpubConverter;