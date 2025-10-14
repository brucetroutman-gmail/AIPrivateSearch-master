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
- **4GB+ RAM** available for AI models
- **Internet connection** (for downloads)
- **MySQL** database (optional, for result storage)

### Quick Start (2 Minutes)

#### 1. Run AISearchScore
```bash
# Navigate to /Users/Shared and double-click:
load-aiss.command
```

**That's it!** The load-aiss.command script will:
- Install command line developer tools automatically (Xcode Command Line Tools with Git, make, etc.)
- Install Node.js automatically (if not already installed)
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
- **Port 3000 busy**: Close Terminal windows and restart load-aiss.command
- **Folder locked**: Close VS Code and restart load-aiss.command
- **Command Line Tools**: Script automatically installs Xcode Command Line Tools (Git, make, compilers). Complete dialog if prompted and wait for installation (up to 5 minutes)
- **No scores**: Ensure score model is selected when scoring enabled
- **Models not loading**: Script handles this automatically, wait for completion

### Next Steps
- Explore different model combinations for optimal performance
- Test document collections with your own content
- Analyze results in the database for performance trends
- Review detailed specifications in `system-documentation/specs/`

## Development Workflow

### Amazon Q Release Command
For developers using Amazon Q Developer, use the **"release"** command to streamline version management:

**Minor Version Bump:**
```
release
```

**Major Version Bump:**
```
release 19
```

This command:
1. **Minor bump** (`release`): Increments version by 0.01 (e.g., 18.03 → 18.04)
2. **Major bump** (`release N`): Sets version to N.00 (e.g., `release 19` → 19.00)
3. Updates version in README.md and both package.json files
4. Generates commit message in format: `vX.XX: [description of changes]`
5. **Note**: Does not automatically commit - you must manually commit the changes

**Setup in new chat sessions:**
```
I have a 'release' command that bumps version by 0.01, or 'release N' for major version N.00
```

---

**Version**: 18.11 | **License**: [Creative Commons Attribution-NonCommercial (CC BY-NC-ND) ](https://creativecommons.org/licenses/by-nc-nd/4.0/)| **Website**: aisearch-n-score.com
