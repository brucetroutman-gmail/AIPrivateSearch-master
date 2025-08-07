re is a node js script, extract.js to convert word docx to text. 
const fs = require('fs');
const unzipper = require('unzipper');

const inputFile = process.argv[2]  './sources/fr40325_AIDocs_Project.docx';
const outputFile = inputFile.replace('.docx', '.md');

fs.createReadStream(inputFile)
  .pipe(unzipper.Parse())
  .on('entry', entry => {
    if (entry.path === 'word/document.xml') {
      let content = '';
      entry.on('data', data => content += data.toString());
      entry.on('end', () => {
        // Extract text between <w:t> tags
        const textMatches = content.match(/<w:t[^>]>([^<])</w:t>/g)  [];
        let markdown = '';

        // Process text matches
        textMatches.forEach(match => {
          const text = match.replace(/<[^>]+>/g, '');
          if (text.trim()) {
            markdown += text;
          }
        });

        // Add paragraph breaks
        markdown = markdown.replace(/[\r\n]+/g, '\n\n');

        // Write to output file
        fs.writeFileSync(outputFile, markdown);
        console.log(Converted to ${outputFile});
      });
    } else {
      entry.autodrain();
    }
  })
  .on('error', err => console.error('Error:', err));