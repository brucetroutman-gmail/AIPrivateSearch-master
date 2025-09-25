# Universal Document Processing System

## Executive Summary

This application provides an intelligent document processing pipeline that converts diverse document collections into a searchable knowledge base. It handles multiple document types (historical records, family documents, literature, medical files, legal documents) through a three-stage process: document conversion, AI-powered metadata generation, and vector embedding for semantic search.

**Key Features:**
- Universal document conversion to Markdown format
- AI-generated metadata for enhanced searchability
- Collection-level summaries for comprehensive overviews
- Vector embeddings with LanceDB for semantic search
- Balanced query results mixing content and metadata
- Modular architecture supporting 5+ document collections

**Technology Stack:** Node.js ES6, Ollama (local AI), LanceDB (vector database), Hugging Face Transformers

---

## Complete Application Structure

```
universal-docs-app/
├── package.json
├── README.md
├── src/
│   ├── convertToMd.js
│   ├── metadataGenerator.js
│   ├── collectionSummarizer.js
│   ├── universalProcessor.js
│   ├── embedder.js
│   ├── queryInterface.js
│   └── demo.js
├── collections/
│   ├── USA-History/
│   ├── Family/
│   ├── Literature/
│   ├── Medical/
│   └── Legal/
└── lancedb/ (generated)
```

## Source Code Files

### package.json
```json
{
  "name": "universal-docs-processor",
  "version": "1.0.0",
  "type": "module",
  "description": "Universal document processing system with AI metadata and semantic search",
  "main": "src/demo.js",
  "scripts": {
    "start": "node src/demo.js",
    "process": "node src/demo.js",
    "query": "node src/queryInterface.js"
  },
  "dependencies": {
    "ollama": "^0.5.0",
    "lancedb": "^0.4.0",
    "@huggingface/transformers": "^2.6.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### src/convertToMd.js
```javascript
import fs from 'fs/promises';
import path from 'path';

export const convertToMarkdown = async (inputDir, outputDir) => {
    try {
        await fs.mkdir(outputDir, { recursive: true });
        const files = await fs.readdir(inputDir);
        const validFiles = files.filter(file => !file.startsWith('.') && !file.startsWith('md_docs'));
        
        for (const file of validFiles) {
            const inputPath = path.join(inputDir, file);
            const stat = await fs.stat(inputPath);
            
            if (stat.isFile()) {
                const outputPath = path.join(outputDir, `${path.parse(file).name}.md`);
                
                // Basic conversion - extend based on file types
                const content = await fs.readFile(inputPath, 'utf8');
                await fs.writeFile(outputPath, content);
            }
        }
        
        console.log(`✅ Converted ${validFiles.length} files to markdown in ${outputDir}`);
    } catch (error) {
        console.error('❌ Conversion error:', error);
    }
};
```

### src/metadataGenerator.js
```javascript
import fs from 'fs/promises';
import path from 'path';
import ollama from 'ollama';

const METADATA_PROMPT = `Analyze this document and create metadata in the following markdown format:

# Document Metadata: [Document Title]

## Basic Information
- **Collection**: [USA-History|Family|Literature|Medical|Legal]
- **Document Type**: [Brief classification]
- **Date**: [Document date if available]
- **Length**: [Approximate word count]

## Content Summary
[2-3 sentences describing main content/purpose]

## Key Topics
- [Topic 1]
- [Topic 2] 
- [Topic 3]

## Important Keywords
[Comma-separated list of 8-10 key terms for search]

## Document Relationships
[Any references to other documents or related topics]

---
Document content follows below:
[ORIGINAL DOCUMENT CONTENT]`;

export const generateMetadata = async (collectionPath, collectionName) => {
    try {
        const files = await fs.readdir(collectionPath);
        const mdFiles = files.filter(file => file.endsWith('.md') && !file.startsWith('META_'));
        
        console.log(`🔄 Generating metadata for ${mdFiles.length} documents in ${collectionName}...`);
        
        for (const mdFile of mdFiles) {
            const filePath = path.join(collectionPath, mdFile);
            const content = await fs.readFile(filePath, 'utf8');
            
            const prompt = `${METADATA_PROMPT}\n\nCollection: ${collectionName}\n\n${content}`;
            
            const response = await ollama.generate({
                model: 'qwen2:0.5b',
                prompt: prompt,
                stream: false
            });
            
            const metadataPath = path.join(collectionPath, `META_${mdFile}`);
            await fs.writeFile(metadataPath, response.response);
            
            console.log(`  ✅ Generated metadata for: ${mdFile}`);
        }
    } catch (error) {
        console.error('❌ Metadata generation error:', error);
    }
};
```

### src/collectionSummarizer.js
```javascript
import fs from 'fs/promises';
import path from 'path';
import ollama from 'ollama';

export const generateCollectionSummary = async (collectionPath, collectionName) => {
    try {
        const files = await fs.readdir(collectionPath);
        const metaFiles = files.filter(file => file.startsWith('META_') && !file.includes('_Collection'));
        
        if (metaFiles.length === 0) {
            console.log(`⚠️  No metadata files found for ${collectionName} collection`);
            return;
        }
        
        let allMetadata = '';
        for (const metaFile of metaFiles) {
            const content = await fs.readFile(path.join(collectionPath, metaFile), 'utf8');
            allMetadata += `\n--- ${metaFile} ---\n${content}`;
        }
        
        const collectionPrompt = `
Analyze all the individual document metadata below and create a collection-level summary:

# Collection Metadata: ${collectionName}

## Collection Overview
- **Total Documents**: [Count]
- **Date Range**: [Earliest to latest dates found]
- **Document Types**: [List of types found]
- **Total Estimated Words**: [Sum if available]

## Content Categories
[Group documents by themes, genres, or types]

## Major Themes
[Cross-cutting themes that appear across multiple documents]

## Key Topics Across Collection
[Most frequent/important topics from all documents]

## Collection Keywords
[Master list of most important search terms for this collection]

## Document Interconnections
[How documents relate to each other, common references]

## Notable Patterns
[Any interesting patterns observed across the collection]

---
Individual document metadata:
${allMetadata}`;

        const response = await ollama.generate({
            model: 'qwen2:0.5b',
            prompt: collectionPrompt,
            stream: false
        });
        
        const summaryPath = path.join(collectionPath, `META_${collectionName}_Collection.md`);
        await fs.writeFile(summaryPath, response.response);
        
        console.log(`✅ Generated collection summary: ${collectionName}`);
    } catch (error) {
        console.error('❌ Collection summary error:', error);
    }
};
```

### src/universalProcessor.js
```javascript
import fs from 'fs/promises';
import path from 'path';
import { convertToMarkdown } from './convertToMd.js';
import { generateMetadata } from './metadataGenerator.js';
import { generateCollectionSummary } from './collectionSummarizer.js';

export class UniversalProcessor {
    constructor() {
        this.collections = ['USA-History', 'Family', 'Literature', 'Medical', 'Legal'];
    }
    
    async processCollection(collectionPath, collectionName) {
        console.log(`\n📁 Processing collection: ${collectionName}`);
        
        try {
            // Step 1: Convert to markdown
            const mdPath = path.join(collectionPath, 'md_docs');
            await convertToMarkdown(collectionPath, mdPath);
            
            // Step 2: Generate individual metadata
            await generateMetadata(mdPath, collectionName);
            
            // Step 3: Generate collection-level summary
            await generateCollectionSummary(mdPath, collectionName);
            
            console.log(`✅ Completed processing: ${collectionName}`);
        } catch (error) {
            console.error(`❌ Error processing ${collectionName}:`, error);
        }
    }
    
    async processAllCollections(basePath) {
        console.log(`🚀 Starting Universal Document Processing...`);
        console.log(`📂 Base path: ${basePath}\n`);
        
        for (const collection of this.collections) {
            const collectionPath = path.join(basePath, collection);
            
            try {
                await fs.access(collectionPath);
                await this.processCollection(collectionPath, collection);
            } catch (error) {
                console.log(`⏭️  Skipping ${collection} - directory not found`);
            }
        }
        
        console.log(`\n🎉 Processing complete!`);
    }
}
```

### src/embedder.js
```javascript
import fs from 'fs/promises';
import path from 'path';
import lancedb from 'lancedb';
import { pipeline } from '@huggingface/transformers';

export class UniversalEmbedder {
    constructor() {
        this.db = null;
        this.embedder = null;
    }
    
    async initialize(dbPath = './lancedb') {
        console.log('🔄 Initializing embedder...');
        this.db = await lancedb.connect(dbPath);
        this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log('✅ Embedder initialized');
    }
    
    async embedCollection(collectionPath, tableName) {
        try {
            const files = await fs.readdir(collectionPath);
            const mdFiles = files.filter(file => file.endsWith('.md'));
            
            if (mdFiles.length === 0) {
                console.log(`⚠️  No markdown files found in ${collectionPath}`);
                return;
            }
            
            console.log(`🔄 Embedding ${mdFiles.length} documents from ${path.basename(collectionPath)}...`);
            
            const documents = [];
            
            for (const file of mdFiles) {
                const filePath = path.join(collectionPath, file);
                const content = await fs.readFile(filePath, 'utf8');
                
                // Skip empty files
                if (content.trim().length === 0) continue;
                
                const embeddings = await this.embedder(content);
                
                const isMetadata = file.startsWith('META_');
                const docType = isMetadata ? 'metadata' : 'content';
                const collection = path.basename(path.dirname(collectionPath));
                
                documents.push({
                    id: `${collection}_${file}`,
                    content: content,
                    vector: Array.from(embeddings.data),
                    metadata: {
                        collection: collection,
                        doc_type: docType,
                        filename: file,
                        is_metadata: isMetadata
                    }
                });
            }
            
            if (documents.length === 0) {
                console.log(`⚠️  No valid documents to embed from ${collectionPath}`);
                return;
            }
            
            // Create or update table
            const table = await this.db.createTable(tableName, documents);
            console.log(`✅ Embedded ${documents.length} documents to table: ${tableName}`);
            
            return table;
        } catch (error) {
            console.error('❌ Embedding error:', error);
        }
    }
}
```

### src/queryInterface.js
```javascript
import lancedb from 'lancedb';
import { pipeline } from '@huggingface/transformers';

export class QueryInterface {
    constructor() {
        this.db = null;
        this.embedder = null;
    }
    
    async initialize(dbPath = './lancedb') {
        console.log('🔄 Initializing query interface...');
        this.db = await lancedb.connect(dbPath);
        this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log('✅ Query interface ready');
    }
    
    async queryCollection(question, tableName, collectionFilter = null, limit = 10) {
        try {
            const table = await this.db.openTable(tableName);
            const queryEmbedding = await this.embedder(question);
            
            let query = table.search(Array.from(queryEmbedding.data)).limit(limit);
            
            if (collectionFilter) {
                query = query.where(`metadata.collection = '${collectionFilter}'`);
            }
            
            const results = await query.toArray();
            return this.balanceResults(results);
        } catch (error) {
            console.error('❌ Query error:', error);
            return [];
        }
    }
    
    balanceResults(results) {
        const contentResults = results.filter(r => !r.metadata.is_metadata);
        const metadataResults = results.filter(r => r.metadata.is_metadata);
        
        const balanced = [];
        const maxLength = Math.max(contentResults.length, metadataResults.length);
        
        for (let i = 0; i < maxLength; i++) {
            if (i < contentResults.length) balanced.push(contentResults[i]);
            if (i < metadataResults.length) balanced.push(metadataResults[i]);
        }
        
        return balanced;
    }
    
    async listCollections(tableName) {
        try {
            const table = await this.db.openTable(tableName);
            const results = await table.search().limit(1000).toArray();
            const collections = [...new Set(results.map(r => r.metadata.collection))];
            return collections;
        } catch (error) {
            console.error('❌ Error listing collections:', error);
            return [];
        }
    }
}
```

### src/demo.js
```javascript
import { UniversalProcessor } from './universalProcessor.js';
import { UniversalEmbedder } from './embedder.js';
import { QueryInterface } from './queryInterface.js';

const runDemo = async () => {
    const basePath = './collections';
    
    try {
        console.log('🌟 Universal Document Processing System Demo\n');
        
        // Step 1-3: Process all collections
        const processor = new UniversalProcessor();
        await processor.processAllCollections(basePath);
        
        // Step 4: Embed all collections
        console.log('\n📊 Starting embedding process...');
        const embedder = new UniversalEmbedder();
        await embedder.initialize();
        
        for (const collection of processor.collections) {
            const collectionPath = `${basePath}/${collection}/md_docs`;
            try {
                await embedder.embedCollection(collectionPath, 'universal_docs');
            } catch (error) {
                console.log(`⏭️  Skipping embedding for ${collection}`);
            }
        }
        
        // Step 5: Demo queries
        console.log('\n🔍 Running demo queries...');
        const queryInterface = new QueryInterface();
        await queryInterface.initialize();
        
        // Show available collections
        const collections = await queryInterface.listCollections('universal_docs');
        console.log(`📚 Available collections: ${collections.join(', ')}`);
        
        // Test queries
        const testQueries = [
            "What documents mention financial information?",
            "Find historical documents about government",
            "Show me literary works about nature",
            "What medical information is available?",
            "Find legal documents about contracts"
        ];
        
        for (const query of testQueries) {
            console.log(`\n🔍 Query: "${query}"`);
            const results = await queryInterface.queryCollection(query, 'universal_docs', null, 5);
            
            if (results.length === 0) {
                console.log('   No results found');
            } else {
                results.forEach((result, i) => {
                    const type = result.metadata.is_metadata ? '📄 META' : '📝 DOC';
                    console.log(`   ${i+1}. ${type} ${result.metadata.collection} - ${result.metadata.filename}`);
                });
            }
        }
        
        console.log('\n🎉 Demo completed successfully!');
        
    } catch (error) {
        console.error('❌ Demo failed:', error);
    }
};

runDemo().catch(console.error);
```

---

## Installation & Setup Instructions

### Prerequisites
1. **Node.js 18+** installed
2. **Ollama** running locally with `qwen2:0.5b` model
3. Documents organized in collection folders

### Step-by-Step Setup

1. **Create project directory:**
```bash
mkdir universal-docs-app
cd universal-docs-app
```

2. **Initialize the project:**
```bash
npm init -y
# Replace package.json with the provided version above
```

3. **Install dependencies:**
```bash
npm install ollama lancedb @huggingface/transformers
```

4. **Create source files:**
```bash
mkdir src
# Copy all the .js files from above into the src/ directory
```

5. **Set up collections directory:**
```bash
mkdir collections
mkdir collections/USA-History
mkdir collections/Family
mkdir collections/Literature
mkdir collections/Medical
mkdir collections/Legal
```

6. **Add your documents:**
```bash
# Place your documents in the appropriate collection folders
# Example:
# collections/Literature/poem1.txt
# collections/Family/insurance_policy.pdf
# collections/USA-History/declaration.txt
```

7. **Start Ollama (separate terminal):**
```bash
ollama serve
ollama pull qwen2:0.5b
```

8. **Run the application:**
```bash
npm start
```

### Expected Output
The application will:
1. Convert documents to Markdown
2. Generate AI metadata for each document
3. Create collection summaries
4. Embed all content into vector database
5. Run sample queries and display results

---

## Usage Examples

### Processing New Documents
```bash
# Add documents to collections/Literature/
# Then run:
npm start
```

### Custom Queries
```javascript
// Add to demo.js
const customQuery = "Find documents about insurance";
const results = await queryInterface.queryCollection(customQuery, 'universal_docs');
```

### Collection-Specific Search
```javascript
const results = await queryInterface.queryCollection(
    "What poetry do we have?", 
    'universal_docs', 
    'Literature'  // Filter to Literature collection only
);
```

This complete application provides a robust foundation for processing and querying