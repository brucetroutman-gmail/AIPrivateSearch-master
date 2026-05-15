# AIPrivateSearch User Manual

**Version 18.08** | **AI Model Evaluation Platform**

## Table of Contents
1. [Getting Started](#getting-started)
2. [Main Search Interface](#main-search-interface)
3. [Search Methods](#search-methods)
4. [Multi-Mode Search](#multi-mode-search)
5. [Document Collections](#document-collections)
6. [Scoring System](#scoring-system)
7. [Configuration](#configuration)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Quick Start
1. **Launch**: Double-click `load-aiss.command` in `/Users/Shared/`
2. **Access**: Open http://localhost:3000 in your browser
3. **Email**: Enter your email address (required for all features)
4. **First Search**: Select a model, enter a query, and click Search

### System Requirements
- **macOS** 12+ (tested)
- **4GB+ RAM** for AI models
- **Internet connection** for initial setup
- **Chrome browser** (auto-installed if needed)

---

## Main Search Interface

### Basic Search Steps
1. **Enter Email**: Required for access and result tracking
2. **Select Source Type**: Choose your search approach
   - **Local Model Only**: Direct AI responses
   - **Local Documents Only**: Search document collections
   - **Local Model and Documents**: Combined AI + document search
3. **Choose Collection**: Select document collection (if using documents)
4. **Select Search Type**: Pick your search method
5. **Choose Model**: Select AI model for processing
6. **Enter Query**: Type your search question
7. **Configure Options**: Adjust temperature, context, tokens
8. **Search**: Click Search button to get results

### Source Types Explained

#### Local Model Only
- Direct AI model responses
- No document search
- Best for: General questions, creative tasks, reasoning

#### Local Documents Only  
- Search through document collections
- No AI model required for basic search
- Best for: Finding specific information in documents

#### Local Model and Documents
- Combines document search with AI analysis
- Most comprehensive approach
- Best for: Complex queries requiring both facts and analysis

---

## Search Methods

### 1. Line Search
- **Purpose**: Exact text matching line-by-line
- **Best For**: Finding specific phrases, names, dates
- **Features**: Boolean logic, wildcard support, line numbers
- **Speed**: Very fast

### 2. Document Search
- **Purpose**: Full-document ranking with relevance scoring
- **Best For**: Topic-based searches, content discovery
- **Features**: Fuzzy matching, relevance ranking, highlighting
- **Speed**: Fast

### 3. Document Index
- **Purpose**: Search document metadata and summaries
- **Best For**: Finding documents by topic, type, or keywords
- **Features**: Structured metadata search
- **Speed**: Very fast

### 4. Smart Search
- **Purpose**: Semantic similarity using AI embeddings
- **Best For**: Conceptual searches, related content
- **Features**: Vector similarity, semantic understanding
- **Speed**: Medium (requires embeddings)

### 5. Hybrid Search
- **Purpose**: Combines keyword and semantic methods
- **Best For**: Comprehensive search coverage
- **Features**: Best of both traditional and AI search
- **Speed**: Medium

### 6. AI Direct
- **Purpose**: Direct AI model responses about documents
- **Best For**: Questions requiring reasoning or analysis
- **Features**: Full AI capabilities, contextual understanding
- **Speed**: Slow (AI processing)

### 7. AI Document Chat
- **Purpose**: AI analysis of relevant document chunks
- **Best For**: Complex questions requiring document synthesis
- **Features**: Retrieval-augmented generation, source citations
- **Speed**: Slow (AI + retrieval processing)

---

## Multi-Mode Search

### Purpose
Compare multiple search methods side-by-side to find the best approach for your query.

### How to Use
1. **Navigate**: Go to Multi-Mode Search page
2. **Enter Query**: Type your search question
3. **Select Collection**: Choose document collection
4. **Choose Model**: Select AI model for AI-based methods
5. **Select Methods**: Check boxes for search methods to compare
6. **Configure**: Set temperature, context, and token limits
7. **Search**: Click "Search Selected Methods"
8. **Compare**: Review results and performance metrics

### Performance Comparison
- **Results Count**: Number of results found
- **Time**: Execution time in seconds
- **Relevance Score**: Average relevance of results
- **Method Comparison**: Side-by-side result quality

---

## Document Collections

### Built-in Collections
- **Family-Documents**: Sample personal documents
- **USA-History**: Historical US documents
- **Federalist-Papers**: Classic political texts
- **My-Literature**: Literary works

### Creating Collections
1. **Navigate**: Go to Collections Editor
2. **Create Folder**: Add folder in `sources/local-documents/[collection-name]/`
3. **Add Documents**: Place `.md` files in the folder
4. **Create Doc Indexes**: Click "Create Doc Indexes" to generate searchable metadata
5. **Embed Documents**: Click "Embed Source MDs" for semantic search

### Collection Management
- **View Status**: See which documents are indexed/embedded
- **Update Doc Indexes**: Refresh document indexes
- **Remove Embeddings**: Clear vector embeddings
- **Document Viewer**: Preview documents with syntax highlighting

---

## Scoring System

### Automatic Scoring
- **Enable**: Check "Generate Scores" checkbox
- **Select Model**: Choose scoring model
- **Criteria**: Accuracy (3x), Relevance (2x), Organization (1x)
- **Scale**: 1-3 points per criterion
- **Weighted Score**: Final percentage score

### Score Interpretation
- **90-100%**: Excellent response
- **80-89%**: Good response  
- **70-79%**: Acceptable response
- **Below 70%**: Needs improvement

### Export Options
- **Auto Export**: Automatically save to database
- **Manual Export**: Export to PDF, Markdown, JSON, or Database
- **Database Storage**: Track results over time for analysis

---

## Configuration

### Model Settings
- **Temperature**: Controls creativity (0.3=Predictable, 0.9=Creative)
- **Context Size**: Memory window (1024-8192 tokens)
- **Token Limit**: Response length (250, 500, or No Limit)

### Search Options
- **Wildcards**: Enable substring matching for Line/Document Search
- **Show Chunks**: Display source document chunks (AI methods)
- **Meta Prompts**: Include collection-specific context

### User Interface
- **Dark Mode**: Toggle in user menu
- **Developer Mode**: Show advanced options
- **Email**: Required for all operations

---

## Troubleshooting

### Common Issues

#### "Please select a model first"
- **Cause**: No model selected for AI-based search
- **Solution**: Choose a model from the dropdown

#### "No embeddings found"
- **Cause**: Documents not embedded for semantic search
- **Solution**: Use Collections Editor → "Embed Source MDs"

#### "No relevant documents found"
- **Cause**: Query doesn't match any documents
- **Solution**: Try different keywords or search methods

#### Search takes too long
- **Cause**: Large models or complex queries
- **Solution**: Use smaller models or simpler search methods

#### Port 3000 busy
- **Cause**: Another application using the port
- **Solution**: Close other applications, restart load-aiss.command

### Performance Tips
- **Use Line Search** for exact matches (fastest)
- **Use Document Search** for topic searches (fast)
- **Use AI methods** for complex analysis (slower but more intelligent)
- **Enable wildcards** for flexible text matching
- **Choose appropriate models** (smaller = faster)

### Getting Help
- **Documentation**: Check `docs/system-documentation/` folder
- **Website**: Visit aisearch-n-score.com
- **Email**: Contact support with your registered email

---

## Advanced Features

### Test Codes
- **Automatic Generation**: Each search gets a unique test code
- **Format**: t[source][assistant][prompt][temp][context][tokens][scoring]
- **Purpose**: Track and reproduce specific test configurations

### Database Integration
- **MySQL Support**: Store results in external database
- **Configuration**: Set up `.env` file with database credentials
- **Analysis**: Track performance trends over time

### Developer Mode
- **Enable**: Toggle in configuration
- **Features**: Advanced options, debug information
- **Use Case**: Development and testing

---

**© 2024 AIPrivateSearch | Version 18.08 | MIT License**