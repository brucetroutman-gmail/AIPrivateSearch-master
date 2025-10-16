# AIPrivateSearch v11 Complete Application Specifications

## Application Overview
AIPrivateSearch is a comprehensive AI evaluation system featuring web frontend, Node.js backend, Ollama integration, and MySQL database for systematic testing and scoring of AI responses with centralized configuration management.

## Architecture
**4-Tier System**: Web Client → Node.js API → Ollama Service → MySQL Database

## Core Features

### 1. User Interface Components
- **Source Type Selection**: 3 modes (Local Model Only, Local Documents Only, Local Model and Documents)
- **Assistant Type Selection**: 5 specialized prompts (Simple, Detailed, Reasoned, Creative, Coding)
- **User Prompts**: Pre-configured test prompts for consistent evaluation
- **Model Selection**: Dynamic loading from Ollama service
- **Parameter Controls**: Temperature (0.3-0.9), Context (2048-16384), Token Limits (No Limit, 250, 500)
- **Scoring Toggle**: Enable/disable automated scoring with centralized settings
- **Export System**: PDF, Markdown, JSON, Database formats

### 2. Configuration Management (v11 Enhanced)
**7 JSON Configuration Files**:
- `source-types.json`: Source type definitions
- `system-prompts.json`: Assistant type prompts
- `user-prompts.json`: Pre-configured test queries (renamed from users-prompts.json)
- `temperature.json`: Temperature options
- `context.json`: Context size options
- `tokens.json`: Token limit options
- `score-settings`: Centralized scoring parameters for Ollama

### 3. TestCode System
**8-Digit Pattern**: `t[1-3][1-5][1-5][1-3][1-4][1-3][0-1]`
- Position 1: 't' (fixed)
- Position 2: Source Type (1-3)
- Position 3: Assistant Type (1-5)
- Position 4: User Prompts (1-5)
- Position 5: Temperature (1-3)
- Position 6: Context (1-4)
- Position 7: Tokens (1-3)
- Position 8: Generate Scores (0-1)

**Total Configurations**: 5,400 unique combinations

### 4. Scoring System (v11 Centralized)
**Three Criteria Evaluation**:
- **Accuracy** (1-5): Correctness and verifiability
- **Relevance** (1-5): Direct response to prompt
- **Organization** (1-5): Structure and flow
- **Weighted Score**: (3×Accuracy + 2×Relevance + 1×Organization) / 30 × 100

**Centralized Scoring Configuration**:
```json
{
  "score-settings": [
    {
      "model": "gemma2:2b-instruct-q4_0"
    },
    {
      "temperature": 0.3
    },
    {
      "context": 4096
    },
    {
      "maxtokens": 500
    }
  ]
}
```

### 5. Export Functionality
**Four Export Formats**:
- **PDF**: Print-ready formatted output with TestCode
- **Markdown**: Structured text format with configuration context
- **JSON**: Complete data with MySQL field mapping and TestCode
- **Database**: Direct MySQL storage with TestCode integration

## Technical Implementation

### Backend Architecture
**Server Structure**:
```
server/s01_server-first-app/
├── app.mjs (Express server)
├── lib/models/combinedSearchScorer.mjs (Core logic with score settings)
└── routes/
    ├── database.mjs (MySQL operations)
    ├── models.mjs (Ollama model management)
    └── search.mjs (Search/score endpoint)
```

### Frontend Architecture
**Client Structure**:
```
client/c01_client-first-app/
├── index.html (Main interface)
├── index.js (Application logic with config loading)
├── styles.css (UI styling)
├── services/api.js (Backend communication)
└── config/ (7 JSON configuration files)
    ├── context.json
    ├── score-settings
    ├── source-types.json
    ├── system-prompts.json
    ├── temperature.json
    ├── tokens.json
    └── user-prompts.json
```

### Database Schema
**MySQL Table**: `aiprivatesearch_results`
- TestCode, PcCode, System Info (CPU, Graphics, RAM, OS)
- CreatedAt, SourceType, SystemPrompt, Prompt
- Search metrics (Model, Context, Temperature, TokenLimit, Duration, Load, EvalRate)
- Answer, Scoring metrics, Scores (Accurate, Relevant, Organized, Weighted)

## Configuration Changes (v11)

### 1. File Standardization
- **users-prompts.json** → **user-prompts.json** (consistent naming)
- **Fixed**: Context loading property reference (`source_types` → `context`)

### 2. Centralized Scoring Settings
**New File**: `score-settings`
- **Purpose**: Single source of truth for all scoring parameters
- **Benefits**: Easy maintenance, consistent scoring behavior
- **Fallback**: Automatic default values on load failure

### 3. Score Settings Integration
```javascript
#loadScoreSettings() {
  try {
    const configPath = path.join(process.cwd(), '..', '..', 'client', 'c01_client-first-app', 'config', 'score-settings');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const settings = {};
    config['score-settings'].forEach(item => {
      Object.assign(settings, item);
    });
    return settings;
  } catch (error) {
    console.error('Error loading score settings:', error);
    return {
      model: 'gemma2:2b-instruct-q4_0',
      temperature: 0.3,
      context: 4096,
      maxtokens: 500
    };
  }
}
```

### 4. Ollama Integration Enhancement
```javascript
const res = await this.ollama.generate({
  model: this.scoreSettings.model,
  prompt: scoringPrompt,
  stream: false,
  options: {
    temperature: this.scoreSettings.temperature,
    num_ctx: this.scoreSettings.context,
    num_predict: this.scoreSettings.maxtokens
  }
});
```

## User Parameters (9 Total)
1. **Source Type** (3 options) - Remembered via localStorage
2. **Assistant Type** (5 options) - Remembered via localStorage
3. **User Prompts** (5 options) - Not remembered
4. **Model** (Dynamic from Ollama) - Remembered via localStorage
5. **Temperature** (3 options) - Remembered via localStorage
6. **Context** (4 options) - Remembered via localStorage
7. **Tokens** (3 options) - Remembered via localStorage
8. **Generate Scores** (Boolean) - Not remembered
9. **Query Text** (Free text) - Not remembered

## Performance Metrics
- **Search Operation**: Duration, Load time, Token evaluation rate
- **Scoring Operation**: Duration, Load time, Token evaluation rate (with centralized settings)
- **System Information**: CPU, Graphics, RAM, OS tracking
- **PC Code**: Hardware-based identifier generation
- **Config Loading**: One-time load during initialization

## Error Handling (v11 Enhanced)
- **Config Load Failures**: Automatic fallback to default scoring settings
- **Path Resolution**: Corrected relative path calculation from server to client
- **Property Mapping**: Fixed JSON property references in frontend
- **Ollama Connection**: Graceful error messaging
- **Scoring Failures**: Retry mechanism with centralized settings fallback
- **Export Errors**: User-friendly error reporting

## Local Documents Processing (Planned v12)
**Implementation Pipeline**:
- Document conversion (PDF/TXT/DOCX → Markdown)
- Embedding generation (nomic-embed-text)
- Vector storage (LanceDB)
- Semantic search integration
- TestCode compatibility maintained

## Installation Requirements
- Node.js 18+
- MySQL 8.0+
- Ollama service
- Required models: qwen2:0.5b, gemma2:2b-instruct-q4_0
- 4GB+ RAM available
- macOS system (for PcCode generation)

## API Endpoints
- `GET /api/models` - Retrieve available Ollama models
- `POST /api/search` - Process search and scoring with centralized settings
- `POST /api/database/save` - Save results to MySQL with TestCode

## Quick Start Guide (v11)

### 1. Ollama Setup
```bash
# Install required models
ollama pull gemma2:2b-instruct-q4_0  # Scoring model
ollama pull qwen2:0.5b               # Search model

# Start service
ollama serve
```

### 2. Configuration Setup
```bash
# Ensure all config files are present
ls client/c01_client-first-app/config/
# Should show: context.json, score-settings, source-types.json, 
#              system-prompts.json, temperature.json, tokens.json, user-prompts.json
```

### 3. Application Launch
```bash
# From project root
./start.sh
```

## Testing & Verification (v11)

### Configuration Loading Test
```bash
# 1. Start application: ./start.sh
# 2. Check browser console for config loading messages
# 3. Verify all dropdowns populate correctly
# 4. Test scoring with centralized settings
```

### Score Settings Test
```bash
# 1. Modify score-settings file
# 2. Restart server
# 3. Perform scored search
# 4. Verify new settings are applied
```

## Development Roadmap
- **v10**: TestCode integration and export system
- **v11**: Configuration standardization and centralized scoring settings
- **v12**: Local documents processing implementation
- **v13**: Electron desktop application conversion
- **Future**: Advanced analytics dashboard, batch testing capabilities

## Security Considerations
- Local-only operation (no external API calls)
- Hardware-based PC identification
- Configurable model parameters via centralized settings
- Data export control
- Configuration file validation

## Benefits of v11 Updates
- **Centralized Management**: All scoring parameters in one location
- **Consistency**: Standardized naming conventions across config files
- **Maintainability**: Easy updates without code changes
- **Error Reduction**: Fixed path resolution and property reference issues
- **Fallback Support**: Graceful degradation with default values
- **Performance**: One-time config loading during initialization

## Migration from v10 to v11
1. Rename `users-prompts.json` to `user-prompts.json`
2. Add `score-settings` file to config directory
3. No database migration required
4. Backward compatible with existing TestCode data
5. All export functionality preserved

**Conclusion**: Version 11 enhances the AIPrivateSearch application with centralized configuration management, improved error handling, and standardized naming conventions while maintaining full compatibility with the existing TestCode system and all core functionality.