# AIPrivateSearch

## Executive Summary

AIPrivateSearch is a local-first AI document search platform. It enables professionals and individuals to search, analyze, and interact with their private documents using AI models that run entirely on their own machine — no data ever leaves the device.

**Key Features:**
- **7 Search Methods**: Exact methods (Line Search, Document Search, Document Index Cards) and AI methods (Smart Search, Hybrid Search, AI Direct, AI Document Chat)
- **Focused Search Pages**: Exact Search page (non-AI methods) and AI Search page (AI methods)
- **Flexible Model Selection**: Choose any available Ollama model for search and scoring
- **Automated Scoring**: 1-3 scale evaluation with weighted percentage scores (Accuracy 3x, Relevance 2x, Organization 1x)
- **Document Collections**: Organize and search local documents with vector similarity search
- **Performance Metrics**: Detailed timing and token usage statistics
- **Database Integration**: MySQL storage for test results and analysis (optional)
- **Security**: Role-based access control, tier system, ESLint security hooks

**Use Cases:**
- Private document search for medical practices, law firms, and professional services
- AI model performance comparison and benchmarking
- Response quality evaluation across different model combinations
- Family and personal document management

## How to Get Started

### Prerequisites
- **macOS** (tested on macOS 12+)
- **4GB+ RAM** available for AI models
- **Internet connection** (for initial downloads)
- **MySQL** database (optional, for result storage)

### Quick Start (2 Minutes)

#### 1. Run AIPrivateSearch
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

#### 2. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

### First Search
1. **Enter Email**: Required for access
2. **Go to Exact Search**: For text matching, or **AI Search** for AI-powered queries
3. **Select Collection**: Choose a document collection
4. **Enter Query**: e.g. "What is the capital of France?"
5. **Enable Scoring** (AI Search): Check "Generate scores" and select score model
6. **Submit**: View results with optional accuracy, relevance, and organization scores

### Optional: Database Setup
For result storage and analysis:
```bash
# Create .env-aips file in /Users/Shared/AIPrivateSearch/
echo "NODE_ENV=development
DB_HOST=your.database.host
DB_PORT=3306
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=aiprivatesearch" > /Users/Shared/AIPrivateSearch/.env-aips
```

### Document Collections (Optional)
To search your own documents:
1. Go to **Collections** and create a new collection
2. Upload documents (`.md`, `.txt`, `.pdf`)
3. Click **Create Doc Indexes** for Document Index Cards search
4. Click **Embed Source MDs** for Smart Search, Hybrid Search, and AI Document Chat
5. Query your documents with any search method

### Troubleshooting
- **Port 3000 busy**: Close Terminal windows and restart load-aiss.command
- **Folder locked**: Close VS Code and restart load-aiss.command
- **Command Line Tools**: Script automatically installs Xcode Command Line Tools. Complete dialog if prompted and wait (up to 5 minutes)
- **No scores**: Ensure score model is selected when scoring is enabled
- **No Smart Search results**: Collection needs to be embedded first (Collections → Embed Source MDs)
- **Models not loading**: Script handles this automatically, wait for completion

### Next Steps
- Read the **[User Guide](docs/system-documentation/sys-aips-user-guide.md)** for a full walkthrough
- Read **[Search Methods](docs/system-documentation/sys-aips-search-methods.md)** to understand when to use each method
- Read **[Collections Guide](docs/system-documentation/sys-aips-collections.md)** to set up your own documents
- Review **[Architecture](docs/system-documentation/sys-aips-architecture.md)** for system overview
- See **[Troubleshooting](docs/system-documentation/sys-aips-troubleshooting.md)** for common issues

## Documentation

All system documentation is in `docs/system-documentation/`. Key docs:

| Doc | Description |
|-----|-------------|
| `sys-aips-executive-summary.md` | Product overview, markets, tiers |
| `sys-aips-user-guide.md` | End user walkthrough |
| `sys-aips-search-methods.md` | All 7 search methods explained |
| `sys-aips-collections.md` | Managing document collections |
| `sys-aips-scoring.md` | Scoring methodology and interpretation |
| `sys-aips-architecture.md` | System design and directory structure |
| `sys-aips-api.md` | Backend API reference |
| `sys-aips-deployment.md` | Local dev and remote Mac deployment |
| `sys-aips-security.md` | Auth, authorization, security practices |
| `sys-aips-licensing.md` | Tier system and license validation |
| `sys-aips-hipaa.md` | HIPAA and PII compliance posture |
| `sys-aips-fabric.md` | Fabric prompt enhancement integration |
| `sys-aips-contributing.md` | Development standards and workflow |
| `sys-aips-changelog.md` | Version history |
| `sys-aips-roadmap.md` | Product direction |
| `sys-aips-todo.md` | Active task tracking |
| `sys-aips-troubleshooting.md` | Common issues and fixes |

## Development Workflow

### Amazon Q Release Command
For developers using Amazon Q Developer, use the **"release"** command to streamline version management:

**Minor Version Bump:**
```
release
```

**Major Version Bump:**
```
release 21
```

This command:
1. **Minor bump** (`release`): Increments version by 0.01 (e.g., 20.22 → 20.23)
2. **Major bump** (`release N`): Sets version to N.00 (e.g., `release 21` → 21.00)
3. Updates version in README.md, both package.json files, and footer.html
4. **Copies sources**: Syncs `/Users/Shared/AIPrivateSearch/sources/` to `sources/` in repo
5. **Copies data**: Syncs `/Users/Shared/AIPrivateSearch/data/` to `data/` in repo
6. **Copies config**: Syncs `/Users/Shared/AIPrivateSearch/config/` to `client/c01_client-first-app/config/` in repo
7. **Checks Git security hooks**: Verifies pre-commit hooks are installed for ESLint/security validation
8. Generates commit message in format: `vX.XX: [description of changes]`
9. **Note**: Does not automatically commit — you must manually commit the changes

**Setup in new chat sessions:**
```
I have a 'release' command that bumps version by 0.01, or 'release N' for major version N.00
```

---

**Version**: 20.37 | **License**: [Creative Commons Attribution-NonCommercial (CC BY-NC-ND)](https://creativecommons.org/licenses/by-nc-nd/4.0/) | **Website**: AIPrivateSearch
