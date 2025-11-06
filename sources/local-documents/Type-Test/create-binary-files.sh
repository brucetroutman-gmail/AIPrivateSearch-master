#!/bin/bash

# Script to create binary format files for Type-Test collection
# Run this script to generate the remaining file formats

echo "Creating binary format files for Type-Test collection..."

# Create a simple PDF using pandoc (if available)
if command -v pandoc &> /dev/null; then
    echo "Creating sample.pdf..."
    echo "# Sample PDF Document

This is a sample PDF document created for testing PDF processing capabilities in AIPrivateSearch.

## Features
- Portable Document Format
- Cross-platform compatibility  
- Preserves formatting
- Searchable text content

This document tests PDF text extraction functionality." | pandoc -o sample.pdf
    echo "✓ sample.pdf created"
else
    echo "⚠ pandoc not found - cannot create PDF"
fi

# Create RTF file
echo "Creating sample.rtf..."
cat > sample.rtf << 'EOF'
{\rtf1\ansi\deff0 {\fonttbl {\f0 Times New Roman;}}
\f0\fs24 Sample RTF Document\par
\par
This is a sample Rich Text Format document for testing RTF processing capabilities in AIPrivateSearch.\par
\par
\b Features:\b0\par
\bullet  Rich text formatting\par
\bullet  Cross-platform compatibility\par
\bullet  Embedded formatting codes\par
\bullet  Legacy document support\par
\par
This document tests RTF processing functionality.\par
}
EOF
echo "✓ sample.rtf created"

# Create a simple EPUB structure (requires zip)
if command -v zip &> /dev/null; then
    echo "Creating sample.epub..."
    mkdir -p epub_temp/META-INF epub_temp/OEBPS
    
    # mimetype
    echo -n "application/epub+zip" > epub_temp/mimetype
    
    # container.xml
    cat > epub_temp/META-INF/container.xml << 'EOF'
<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
EOF
    
    # content.opf
    cat > epub_temp/OEBPS/content.opf << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Sample EPUB Document</dc:title>
    <dc:creator>AIPrivateSearch Test</dc:creator>
    <dc:identifier id="uid">sample-epub-001</dc:identifier>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="chapter1"/>
  </spine>
</package>
EOF
    
    # chapter1.xhtml
    cat > epub_temp/OEBPS/chapter1.xhtml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>Sample EPUB Document</title>
</head>
<body>
    <h1>Sample EPUB Document</h1>
    <p>This is a sample EPUB document for testing electronic book processing capabilities in AIPrivateSearch.</p>
    <h2>Features</h2>
    <ul>
        <li>Electronic book format</li>
        <li>Reflowable content</li>
        <li>Structured metadata</li>
        <li>Cross-platform reading</li>
    </ul>
    <p>This document tests EPUB processing functionality.</p>
</body>
</html>
EOF
    
    cd epub_temp
    zip -X0 ../sample.epub mimetype
    zip -rX9 ../sample.epub META-INF/ OEBPS/
    cd ..
    rm -rf epub_temp
    echo "✓ sample.epub created"
else
    echo "⚠ zip not found - cannot create EPUB"
fi

echo ""
echo "Binary files created successfully!"
echo ""
echo "Still need to create manually (using appropriate applications):"
echo "- sample.docx (Microsoft Word)"
echo "- sample.doc (Legacy Word)"  
echo "- sample.pptx (PowerPoint)"
echo "- sample.ppt (Legacy PowerPoint)"
echo "- sample.xlsx (Excel)"
echo "- sample.xls (Legacy Excel)"
echo "- sample.odt (LibreOffice Writer)"
echo "- sample.ods (LibreOffice Calc)"
echo "- sample.odp (LibreOffice Impress)"
echo "- sample.key (Keynote - macOS only)"
echo "- sample.msg (Outlook message)"
echo ""
echo "Run this script from the Type-Test collection directory."