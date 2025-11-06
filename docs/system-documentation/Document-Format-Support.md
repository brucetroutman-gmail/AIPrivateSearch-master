# Document Format Support

## Supported Input Formats

AIPrivateSearch now supports the following document formats for conversion to Markdown:

### Text-Based Formats
- **`.txt`** - Plain text files (native support)
- **`.md`** - Markdown files (native support)

### Microsoft Office Formats
- **`.docx`** - Microsoft Word documents (mammoth library)
- **`.doc`** - Legacy Microsoft Word documents (mammoth library)
- **`.pptx`** - Microsoft PowerPoint presentations (LibreOffice conversion)
- **`.ppt`** - Legacy Microsoft PowerPoint presentations (LibreOffice conversion)
- **`.xlsx`** - Microsoft Excel spreadsheets (LibreOffice conversion to CSV/table)
- **`.xls`** - Legacy Microsoft Excel spreadsheets (LibreOffice conversion to CSV/table)

### Other Document Formats
- **`.pdf`** - PDF documents (pdftotext utility)
- **`.epub`** - EPUB ebooks (pandoc converter)
- **`.rtf`** - Rich Text Format (LibreOffice conversion)
- **`.html`** / **`.htm`** - HTML files (native HTML parsing)
- **`.odt`** - OpenDocument Text (LibreOffice conversion)
- **`.ods`** - OpenDocument Spreadsheet (LibreOffice conversion)
- **`.odp`** - OpenDocument Presentation (LibreOffice conversion)
- **`.tex`** - LaTeX documents (pandoc conversion)

### Data Formats
- **`.json`** - JSON data files (native support)
- **`.yaml`** / **`.yml`** - YAML data files (native support)
- **`.xml`** - XML data files (native support)
- **`.csv`** - CSV data files (native support)
- **`.tsv`** - Tab-separated values (native support)

### Code Files
- **`.py`** - Python code (syntax highlighting)
- **`.js`** - JavaScript code (syntax highlighting)
- **`.java`** - Java code (syntax highlighting)
- **`.cpp`** / **`.c`** / **`.h`** - C/C++ code (syntax highlighting)
- **`.css`** - CSS stylesheets (syntax highlighting)
- **`.sql`** - SQL scripts (syntax highlighting)

### Log and Text Files
- **`.log`** - Log files (formatted as code blocks)
- **`.md`** - Markdown files (native support)

### Email Formats
- **`.eml`** - Email files (RFC 2822 format with header and body parsing)
- **`.msg`** - Microsoft Outlook email files (limited support - binary format)

### Unsupported Formats
- **`.key`** - Apple Keynote (not yet supported)
- **Image formats** - OCR processing not yet implemented

## Dependencies

### Required System Tools
1. **`pdftotext`** - For PDF text extraction
   ```bash
   # Usually included with poppler-utils
   brew install poppler
   ```

2. **`pandoc`** - For EPUB conversion
   ```bash
   brew install pandoc
   ```

3. **`LibreOffice`** - For Office formats (PowerPoint, Excel, RTF, ODT)
   ```bash
   brew install --cask libreoffice
   ```

### Node.js Libraries
- **`mammoth`** - For DOCX/DOC conversion (automatically installed)
- **`ollama`** - For AI processing (automatically installed)

## Conversion Process

1. **Upload** - Documents are uploaded to collection folders
2. **Convert** - Source documents are converted to Markdown format
3. **Process** - Markdown files are chunked and embedded for search
4. **Index** - AI-generated document index cards are created

## Special Handling

### Excel Files
- Converted to Markdown tables
- Limited to first 100 rows for performance
- Multiple sheets are combined

### PowerPoint Files
- Text content extracted from slides
- Slide structure preserved where possible
- Images and graphics are not processed

### HTML Files
- Scripts and styles are removed
- HTML tags are stripped
- Common entities are decoded
- Text content is preserved

### Email Files (.eml)
- Email headers are extracted (From, To, CC, Subject, Date)
- Message body is parsed from plain text or HTML content
- Multipart messages are handled appropriately
- Attachment names are listed (content not extracted)
- RFC 2822 format compliance

### Email Files (.msg)
- Microsoft Outlook binary format
- Limited support due to proprietary structure
- Recommendation to export to .eml format first

## Error Handling

If a document cannot be converted:
- An error message is included in the Markdown output
- The original file is preserved
- Processing continues with other documents
- Dependency installation instructions are provided

## Performance Notes

- LibreOffice conversions may take 30-60 seconds per file
- Large Excel files are limited to 100 rows for performance
- PDF extraction speed depends on document complexity
- Batch processing is used to avoid overwhelming the system

## Usage

Simply upload supported files to any collection - the system will automatically detect the format and convert appropriately. All converted files are saved as `.md` files alongside the originals.

## Format Support Summary

**Total supported formats**: 32+ input formats → Markdown conversion

### Format Categories
- **Office Documents**: 8 formats (Word, PowerPoint, Excel, OpenDocument)
- **Text & Markup**: 6 formats (TXT, MD, HTML, RTF, LaTeX, Log)
- **Data Files**: 5 formats (JSON, YAML, XML, CSV, TSV)
- **Code Files**: 7 formats (Python, JavaScript, Java, C/C++, CSS, SQL)
- **Email Files**: 2 formats (EML with full parsing, MSG with limited support)
- **Specialized**: 4 formats (PDF, EPUB, ODS, ODP)
- **Unsupported**: Clear error messages with format recommendations and conversion suggestions