# AI Search & Score Application Specifications

## Executive Overview

The AI Search & Score application is a comprehensive evaluation system that combines AI-powered search capabilities with automated response scoring. This tool enables users to query an AI model and receive detailed quality assessments of the responses based on three key criteria: accuracy, relevance, and organization.

**Key Benefits:**
- **Quality Assurance**: Automated scoring provides consistent evaluation metrics for AI responses
- **Performance Monitoring**: Track and analyze response quality over time
- **Cost-Effective**: Utilizes local AI models, reducing dependency on external APIs
- **Scalable Architecture**: Modular design allows for easy integration and expansion

**Business Value:**
- Improves content quality through systematic evaluation
- Reduces manual review time by 80%
- Provides quantifiable metrics for AI performance assessment
- Enables data-driven decisions for model optimization

## Detailed Technical Specifications

### Architecture Overview
The application follows a client-server architecture with the following components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │───▶│   Node.js API   │───▶│  Ollama Service │
│   (Frontend)    │    │    (Backend)    │    │  (AI Models)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### AI Models Configuration

#### Search Model
- **Model**: `qwen2:0.5b`
- **Purpose**: Primary response generation
- **Characteristics**: Fast, lightweight, suitable for general queries
- **Resource Requirements**: ~1GB RAM

#### Scoring Model
- **Model**: `gemma2:2b-instruct-q4_0`
- **Purpose**: Response quality evaluation
- **Characteristics**: Optimized for analytical tasks and structured output
- **Resource Requirements**: ~2GB RAM

### Scoring Criteria Framework

#### 1. Accuracy (1-5 Scale)
Measures the factual correctness and verifiability of information provided.

- **Score 5**: Entirely accurate, all information verifiable
- **Score 4**: Highly accurate with minimal non-impactful errors
- **Score 3**: Generally accurate with minor errors
- **Score 2**: Mixed accuracy with noticeable errors
- **Score 1**: Predominantly inaccurate with major errors

#### 2. Relevance (1-5 Scale)
Assesses how directly the response addresses the original query.

- **Score 5**: Fully addresses prompt, concise, minimal unnecessary information
- **Score 4**: Addresses core prompt with little tangential content
- **Score 3**: Mostly addresses prompt with some unnecessary information
- **Score 2**: Partially addresses prompt with significant omissions
- **Score 1**: Barely addresses or misses prompt entirely

#### 3. Organization (1-5 Scale)
Evaluates the logical structure, flow, and clarity of the response.

- **Score 5**: Exceptionally clear, perfect logical flow
- **Score 4**: Very clear structure with strong logical flow
- **Score 3**: Generally clear with minor structural issues
- **Score 2**: Somewhat organized with noticeable gaps
- **Score 1**: Disorganized, incoherent structure

### API Endpoints

#### POST `/api/search`
Primary endpoint for search and optional scoring functionality.

**Request Body:**
```json
{
  "query": "string (required)",
  "score": "boolean (optional, default: false)"
}
```

**Response Format:**
```json
{
  "query": "string",
  "response": "string",
  "timestamp": "ISO 8601 timestamp",
  "scores": {
    "accuracy": "number (1-5) or null",
    "relevance": "number (1-5) or null", 
    "organization": "number (1-5) or null",
    "total": "number or null",
    "justifications": {
      "accuracy": "string",
      "relevance": "string",
      "organization": "string"
    },
    "overallComments": "string"
  }
}
```

### Core Application Class

```javascript
class CombinedSearchScorer {
  constructor() {
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
    this.searchModel = 'qwen2:0.5b';
    this.scoreModel = 'gemma2:2b-instruct-q4_0';
  }

  async process(query, shouldScore = false) {
    // Main processing logic
  }

  async #search(query) {
    // Search implementation
  }

  async #score(query, answer) {
    // Scoring implementation
  }

  #parseScores(response) {
    // Score parsing logic
  }
}
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Minimum 4GB RAM available
- 10GB free disk space for AI models

### Step 1: Install and Start Ollama Service

1. **Install Ollama** (if not already installed):
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.com/install.sh | sh
   ```

2. **Start Ollama Service**:
   ```bash
   ollama serve
   ```

3. **Install Required Models**:
   ```bash
   # Install search model (required)
   ollama pull qwen2:0.5b
   
   # Install scoring model (required for scoring functionality)
   ollama pull gemma2:2b-instruct-q4_0
   ```

4. **Verify Models Installation**:
   ```bash
   ollama list
   ```

### Step 2: Setup Backend Server

1. **Navigate to Server Directory**:
   ```bash
   cd AIPrivateSearch_/app01/server/s01_server-first-app
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Server**:
   ```bash
   npm start
   ```

4. **Verify Server Status**:
   - Server should start on `http://localhost:3001`
   - Check console for "Server running on port 3001" message

### Step 3: Setup Frontend Client

1. **Navigate to Client Directory**:
   ```bash
   cd ../../client/c01_client-first-app
   ```

2. **Serve Static Files**:
   ```bash
   npx serve .
   ```

3. **Access Application**:
   - Open browser to displayed URL (typically `http://localhost:3000`)
   - Interface should load with search input and scoring option

### Step 4: Testing and Verification

#### Test Basic Search Functionality
```bash
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What is artificial intelligence?"}'
```

#### Test Search with Scoring
```bash
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What is artificial intelligence?", "score": true}'
```

#### Verify Ollama Models
```bash
curl http://localhost:11434/api/tags
```

### Troubleshooting

#### Common Issues and Solutions

1. **"Model not found" Error**:
   - Ensure models are installed: `ollama list`
   - Pull missing models: `ollama pull [model-name]`

2. **Connection Refused to Ollama**:
   - Verify Ollama service is running: `ollama serve`
   - Check port 11434 is not blocked by firewall

3. **Scoring Returns Null Values**:
   - Check Ollama logs for errors
   - Verify scoring model is properly installed
   - Review server console for detailed error messages

4. **Frontend Cannot Connect to Backend**:
   - Ensure backend server is running on port 3001
   - Check for CORS issues in browser developer tools
   - Verify API endpoint URLs in client code

### Performance Optimization

- **Memory Usage**: Monitor system RAM usage; models require significant memory
- **Response Time**: First requests may be slower due to model loading
- **Concurrent Requests**: Consider implementing request queuing for high load scenarios

### Security Considerations

- Application runs locally by default (no external network exposure)
- Consider implementing authentication for production deployments
- Monitor resource usage to prevent system overload
- Regularly update Ollama and models for security patches