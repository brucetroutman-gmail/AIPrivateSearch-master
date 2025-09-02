// Node.js script to convert Word docx to text
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const { logger } = require('../../shared/utils/logger.js');

// Path validation function
function validatePath(userPath, allowedDir) {
  const cleanPath = userPath.replace(/\0/g, '');
  const normalizedPath = path.normalize(cleanPath);
  
  if (normalizedPath.includes('..') || normalizedPath.startsWith('/')) {
    throw new Error('Invalid path');
  }
  
  const safePath = path.join(allowedDir, normalizedPath);
  const resolvedPath = path.resolve(safePath);
  const resolvedAllowedDir = path.resolve(allowedDir);
  
  if (!resolvedPath.startsWith(resolvedAllowedDir)) {
    throw new Error('Path outside allowed directory');
  }
  
  return resolvedPath;
}

const allowedDir = path.join(__dirname, '../../sources');
const inputArg = process.argv[2] || './sources/fr40325_AIDocs_Project.docx';

try {
  const inputFile = validatePath(inputArg, allowedDir);
  const outputFile = inputFile.replace('.docx', '.md');

  fs.createReadStream(inputFile)
    .pipe(unzipper.Parse())
    .on('entry', entry => {
      if (entry.path === 'word/document.xml') {
        let content = '';
        entry.on('data', data => content += data.toString());
        entry.on('end', () => {
          const textMatches = content.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
          let markdown = '';

          textMatches.forEach(match => {
            const text = match.replace(/<[^>]+>/g, '');
            if (text.trim()) {
              markdown += text;
            }
          });

          markdown = markdown.replace(/[\r\n]+/g, '\n\n');
          fs.writeFileSync(outputFile, markdown);
          logger.log(`Converted to ${path.basename(outputFile)}`);
        });
      } else {
        entry.autodrain();
      }
    })
    .on('error', err => {
      logger.error('Error:', err);
    });
} catch (error) {
  logger.error('Path validation error:', error.message);
  process.exit(1);
}