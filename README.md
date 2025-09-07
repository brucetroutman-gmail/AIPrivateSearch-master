# AISearchScore

## Executive Summary

AISearchScore is a comprehensive AI model evaluation platform that combines intelligent search capabilities with automated response scoring. The system enables users to test and compare different AI models using a weighted 1-3 scoring system across three key criteria: Accuracy (3x weight), Relevance (2x weight), and Organization (1x weight).

**Key Features:**
- **Flexible Model Selection**: Choose any available Ollama model for search and scoring
- **Document Search**: Query local document collections with vector similarity search
- **Automated Scoring**: 1-3 scale evaluation with weighted percentage scores
- **Performance Metrics**: Detailed timing and token usage statistics
- **Database Integration**: MySQL storage for test results and analysis
- **Security**: Protected environment variables and secure startup procedures

**Use Cases:**
- AI model performance comparison and benchmarking
- Document search and retrieval testing
- Response quality evaluation across different model combinations
- Research and development of AI scoring methodologies

## How to Get Started

### Prerequisites
- **macOS** (tested on macOS 12+)
- **Node.js** v16 or higher
- **MySQL** database (optional, for result storage)
- **4GB+ RAM** available for AI models
- **Internet connection** (for Ollama and model downloads)

### Quick Start (2 Minutes)

#### 1. Run AISearchScore
```bash
# Navigate to /Users/Shared and double-click:
load-aiss.command
```

**That's it!** The load-aiss.command script will:
- Install Git automatically (if not already installed)
- Install Ollama automatically (if not already installed)
- Install Chrome browser (if not already installed)
- Start Ollama service
- Clone the repository to the correct location
- Pull required AI models automatically
- Install all dependencies
- Start both frontend and backend servers

#### 3. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

### First Test
1. **Enter Email**: Required for access
2. **Select Models**: Choose search model (e.g., qwen2:1.5b)
3. **Enter Query**: "What is the capital of France?"
4. **Enable Scoring**: Check "Generate scores" and select score model
5. **Submit**: View results with accuracy, relevance, and organization scores

### Optional: Database Setup
For result storage and analysis:
```bash
# Create .env file in /Users/Shared/
echo "NODE_ENV=development
DB_HOST=your.database.host
DB_PORT=3306
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=aisearchscore" > /Users/Shared/.env
```

### Document Collections (Optional)
Test local document search:
1. Add documents to `sources/local-documents/[collection-name]/`
2. Select "Local Documents" as source type
3. Choose your collection
4. Query your documents with AI-powered search

### Troubleshooting
- **Port 3000 busy**: Close Terminal windows and restart
- **Models not loading**: Verify Ollama is running (`ollama list`)
- **Folder locked**: Close VS Code and restart load-aiss.command
- **No scores**: Ensure score model is selected when scoring enabled

### Next Steps
- Explore different model combinations for optimal performance
- Test document collections with your own content
- Analyze results in the database for performance trends
- Review detailed specifications in `system-documentation/specs/`

---

**Version**: 17.0 | **License**: MIT | **Website**: aisearch-n-score.com
