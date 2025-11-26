# AIPrivateSearch Technical Specifications v19.71

**Version**: 19.71  
**Last Updated**: January 2025  
**Architecture**: Multi-Application Suite with Local AI Integration  

## System Architecture

### Core Components

1. **Frontend Client** (`/client/c01_client-first-app/`)
   - Static HTML/CSS/JavaScript application
   - Responsive design with light/dark mode support
   - Multi-page application with shared components
   - Dynamic footer and header loading

2. **Backend Server** (`/server/s01_server-first-app/`)
   - Node.js Express server (default port 3001)
   - RESTful API endpoints
   - AI model integration via Ollama
   - MySQL database integration (optional)
   - JWT-based authentication system

3. **AI Integration**
   - Ollama local AI models
   - Sentence transformers for embeddings
   - Vector similarity search with LanceDB
   - Multiple search methodologies

4. **Document Processing**
   - Support for 25+ document formats
   - Automatic text extraction and chunking
   - Metadata generation and indexing
   - Collection-based organization

### Application Structure

```
AIPrivateSearch/
├── client/c01_client-first-app/          # Frontend application
│   ├── index.html                        # Main search interface
│   ├── multi-mode-search.html           # Multi-mode search page
│   ├── collections-editor.html          # Collection management
│   ├── user-management.html             # User authentication
│   ├── shared/                          # Shared components
│   │   ├── styles.css                   # Main stylesheet
│   │   ├── common.js                    # Common utilities
│   │   └── footer.html                  # Dynamic footer
│   └── assets/                          # Static assets
├── server/s01_server-first-app/          # Backend server
│   ├── server.mjs                       # Main server file
│   ├── routes/                          # API route handlers
│   ├── lib/                             # Core libraries
│   │   ├── models/                      # AI model classes
│   │   ├── search/                      # Search implementations
│   │   ├── auth/                        # Authentication
│   │   └── utils/                       # Utilities
│   └── config/                          # Configuration files
├── sources/                             # Document collections
├── data/                                # User and session data
└── docs/                                # Documentation
```

## Core Features

### 1. Multi-Mode Search System

**Search Types:**
- **Line Search**: Exact text matching with highlighting
- **Document Search**: Full-text search with context
- **Document Index Search**: Metadata-based search
- **AI Document Chat**: RAG-based conversational search
- **Hybrid Search**: Combined traditional and AI methods

**Implementation:**
- Unified search orchestrator
- Common result formatting
- Performance metrics tracking
- Source document linking

### 2. AI Model Integration

**Supported Models:**
- Search Models: qwen2:1.5b, llama3.2:1b, gemma2:2b
- Scoring Models: gemma2:2b-instruct-q4_0, qwen2:1.5b
- Embedding Models: Sentence transformers (primary), Ollama (fallback)

**Model Configuration:**
- Dynamic model selection
- Temperature, context, and token controls
- Performance monitoring
- Automatic model management

### 3. Scoring System

**Criteria:**
- **Accuracy** (3x weight): Factual correctness
- **Relevance** (2x weight): Query alignment
- **Organization** (1x weight): Response structure

**Scale**: 1-3 (Poor, Good, Excellent)
**Output**: Weighted percentage score

### 4. User Management System

**Roles:**
- **Administrator**: Full system access
- **Searcher**: Search and basic functions only

**Subscription Tiers:**
- **Standard**: Basic search, 1 computer, $49/year
- **Premium**: Enhanced features, 5 computers, $199/year
- **Professional**: Full access, unlimited, $2999 license

**Authentication:**
- JWT-based session management
- Tier-based feature access
- External SecureAccess integration (planned)

### 5. Document Collections

**Supported Formats:**
- **Text**: TXT, MD, RTF
- **Office**: DOCX, XLSX, PPTX
- **Web**: HTML, XML, JSON, YAML
- **Data**: CSV, TSV, SQL
- **Code**: JS, PY, JAVA, C++, etc.
- **Other**: PDF (via pdftotext)

**Processing Pipeline:**
1. Document ingestion and validation
2. Text extraction and cleaning
3. Chunking and embedding generation
4. Metadata creation and indexing
5. Vector database storage

## API Specifications

### Core Endpoints

#### Search API
```
POST /api/search
Content-Type: application/json

Request Body:
{
  "query": "string (required)",
  "searchType": "string (optional)",
  "collection": "string (optional)",
  "model": "string (optional)",
  "scoreModel": "string (optional)",
  "generateScores": boolean (optional, default: false),
  "temperature": number (optional),
  "contextSize": number (optional),
  "maxTokens": number (optional)
}

Response:
{
  "success": boolean,
  "data": {
    "query": "string",
    "response": "string",
    "scores": {
      "accuracy": number (1-3),
      "relevance": number (1-3),
      "organization": number (1-3),
      "weightedScore": number (percentage),
      "justification": "string"
    },
    "performance": {
      "searchTime": number,
      "scoreTime": number,
      "totalTime": number,
      "tokensUsed": number,
      "tokensPerSecond": number
    },
    "metadata": {
      "searchModel": "string",
      "scoreModel": "string",
      "timestamp": "ISO 8601 string",
      "collection": "string",
      "searchType": "string"
    }
  }
}
```

#### Collections API
```
GET /api/collections
Response: Array of collection objects

POST /api/collections/process
Body: { "collectionName": "string" }

DELETE /api/collections/:name
```

#### User Management API
```
POST /api/auth/login
POST /api/auth/register
GET /api/auth/verify
POST /api/auth/logout
GET /api/users (admin only)
PUT /api/users/:id/tier (admin only)
```

### Authentication

**JWT Token Structure:**
```json
{
  "userId": "string",
  "email": "string",
  "role": "admin|searcher",
  "tier": 1|2|3,
  "exp": timestamp
}
```

**Protected Routes:**
- All API endpoints require valid JWT
- Tier-based access control
- Role-based menu restrictions

## Database Schema

### MySQL Tables

#### searches
```sql
CREATE TABLE searches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255),
  query TEXT,
  response TEXT,
  search_model VARCHAR(100),
  score_model VARCHAR(100),
  accuracy_score INT,
  relevance_score INT,
  organization_score INT,
  weighted_score DECIMAL(5,2),
  search_time_ms INT,
  score_time_ms INT,
  total_time_ms INT,
  tokens_used INT,
  tokens_per_second DECIMAL(8,2),
  collection_name VARCHAR(100),
  search_method_type VARCHAR(50),
  temperature DECIMAL(3,2),
  context_size INT,
  max_tokens INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### users
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  role ENUM('admin', 'searcher'),
  subscription_tier INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);
```

#### sessions
```sql
CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Configuration Management

### App Configuration (`config/app.json`)
```json
{
  "app-name": "AI Private Search",
  "version": "19.71",
  "ports": {
    "frontend": 3000,
    "backend": 3001
  },
  "paths": {
    "sources": "/Users/Shared/AIPrivateSearch/sources",
    "data": "/Users/Shared/AIPrivateSearch/data",
    "config": "/Users/Shared/AIPrivateSearch/config"
  },
  "custmgr": {
    "domain": "custmgr.aiprivatesearch.com",
    "port": 56304
  }
}
```

### Model Configuration (`config/models-list.json`)
```json
{
  "search_models": [
    {
      "name": "qwen2:1.5b",
      "displayName": "Qwen2 1.5B (Recommended)",
      "type": "search",
      "recommended": true
    }
  ],
  "score_models": [
    {
      "name": "gemma2:2b-instruct-q4_0",
      "displayName": "Gemma2 2B Instruct",
      "type": "score",
      "recommended": true
    }
  ]
}
```

### User Prompts (`config/user-prompts.json`)
```json
{
  "local_model_only": {
    "1": "Provide a comprehensive answer",
    "2": "Focus on key points only",
    "3": "Include relevant examples",
    "4": "Explain in simple terms",
    "5": "Provide detailed analysis"
  },
  "local_documents": {
    "collection_name": {
      "1": "Search within this collection",
      "2": "Find specific information",
      "3": "Summarize findings"
    }
  }
}
```

## Security Features

### Authentication & Authorization
- JWT-based session management
- Password hashing with bcrypt
- Role-based access control
- Tier-based feature restrictions
- CSRF protection
- Secure file operations

### Data Protection
- Input validation and sanitization
- XSS prevention
- SQL injection protection
- Secure file path handling
- Environment variable protection

### Code Security
- ESLint security scanning
- Pre-commit security hooks
- Dependency vulnerability scanning
- Regular security audits

## Performance Specifications

### Response Times
- Search queries: < 5 seconds
- Document processing: < 30 seconds per document
- Collection indexing: < 2 minutes per 100 documents
- User authentication: < 500ms

### Resource Requirements
- **Minimum**: 4GB RAM, 2GB storage
- **Recommended**: 8GB RAM, 10GB storage
- **Professional**: 16GB RAM, 50GB storage

### Scalability
- Concurrent users: 10-50 depending on tier
- Document collections: Unlimited
- Search history: 1 year retention
- Database size: Configurable limits

## Deployment Specifications

### Installation Requirements
- **macOS**: 12+ (primary platform)
- **Node.js**: 18+ with npm
- **Ollama**: Latest version
- **Chrome**: Latest version (for UI)
- **MySQL**: 8.0+ (optional)

### Startup Process
1. Automatic dependency installation
2. Ollama service initialization
3. AI model downloading
4. Database setup (if configured)
5. Server startup on configured ports
6. Browser launch to application

### File Structure
```
/Users/Shared/AIPrivateSearch/
├── repo/aiprivatesearch/          # Git repository
├── sources/                       # Document collections
├── data/                         # User and session data
├── config/                       # Configuration files
├── logs/                         # Application logs
└── .env                          # Environment variables
```

## Testing Specifications

### Test Coverage
- Unit tests for core search functions
- Integration tests for API endpoints
- User interface testing
- Performance benchmarking
- Security vulnerability scanning

### Test Data
- Sample document collections
- Test user accounts
- Performance benchmarks
- Security test cases

### Quality Assurance
- Automated testing pipeline
- Manual testing procedures
- Performance monitoring
- Error tracking and reporting

## Future Roadmap

### Phase 1 (Current - v19.71)
- ✅ Core search functionality
- ✅ User management system
- ✅ Document processing
- ✅ Multi-mode search
- ✅ Scoring system

### Phase 2 (v20.x)
- SecureAccess integration
- Enhanced analytics
- Mobile responsiveness
- API documentation
- Performance optimization

### Phase 3 (v21.x)
- Cloud deployment options
- Advanced AI models
- Collaboration features
- Enterprise integrations
- Advanced security features

## Compliance & Standards

### Data Privacy
- GDPR compliance considerations
- Local data processing
- User consent management
- Data retention policies

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast modes

### Code Quality
- ESLint configuration
- Security scanning
- Documentation standards
- Version control practices

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Maintained By**: AI Private Search Group  
**License**: Creative Commons Attribution-NonCommercial (CC BY-NC-ND)