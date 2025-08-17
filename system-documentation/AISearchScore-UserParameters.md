# AI Search & Score Application - User Parameters Reference

## Complete List of User-Configurable Parameters

The AI Search & Score application provides comprehensive user control through 9 configurable parameters across the interface. Here's the complete reference:

## Form Parameters (In Order of Appearance)

### 1. **Source Type** 📁
- **Type**: Dropdown selection
- **Location**: Top of form
- **Options**: 3 choices
  - `Local Model Only`
  - `Local Documents Only`
  - `Local Model and Documents`
- **Default**: First option (Local Model Only)
- **Persistence**: ✅ Remembered across sessions
- **Config File**: `config/source-types.json`
- **Purpose**: Controls data sources for AI processing
- **Database Field**: `SourceType`

### 2. **Model** 🤖
- **Type**: Dropdown selection
- **Location**: Below Source Type
- **Options**: Dynamic (loaded from Ollama)
  - `qwen2:0.5b` (default if available)
  - `gemma2:2b-instruct-q4_0`
  - Other installed models (filtered, sorted)
- **Default**: `qwen2:0.5b` or first available
- **Persistence**: ✅ Remembered across sessions
- **Config File**: Loaded via API from Ollama
- **Purpose**: Selects AI model for processing
- **Database Field**: `ModelName-search`

### 3. **Assistant Type** 👤
- **Type**: Dropdown selection
- **Location**: Below Model
- **Options**: 5 choices
  - `Simple Assistant`
  - `Detailed Assistant`
  - `Reasoned Assistant`
  - `Creative Assistant`
  - `Coding Assistant`
- **Default**: First option (Simple Assistant)
- **Persistence**: ✅ Remembered across sessions
- **Config File**: `config/system-prompts.json`
- **Purpose**: Defines AI behavior through system prompts
- **Database Field**: `SystemPrompt`

### 4. **User Prompts** 📝
- **Type**: Dropdown selection (template selector)
- **Location**: Below Assistant Type
- **Options**: 6 choices
  - `Select a prompt...` (default)
  - `KNOWLEDGE-Quantum`
  - `REASON-AI-adopt`
  - `CREATE-AI-dialog`
  - `CODE-Pseudo`
  - `INSTRUCT-Fix wifi`
- **Default**: "Select a prompt..." (no selection)
- **Persistence**: ❌ Not remembered (always resets)
- **Config File**: `config/users-prompts.json`
- **Purpose**: Populates textarea with predefined prompts
- **Database Field**: Content goes to `Prompt`

### 5. **Query Input** ✏️
- **Type**: Textarea (free text)
- **Location**: Below User Prompts
- **Options**: Free text input
- **Default**: Empty (placeholder text)
- **Persistence**: ❌ Not remembered (user input)
- **Config File**: None (user input)
- **Purpose**: Main user query/prompt
- **Database Field**: `Prompt`
- **Required**: ✅ Must have content to submit

### 6. **Temperature** 🌡️
- **Type**: Dropdown selection (inline)
- **Location**: Model Options section
- **Options**: 3 choices
  - `Predictable` (0.3)
  - `Moderate` (0.6)
  - `Creative` (0.9)
- **Default**: Predictable (0.3)
- **Persistence**: ✅ Remembered across sessions
- **Config File**: `config/temperature.json`
- **Purpose**: Controls AI response creativity/randomness
- **Database Field**: `ModelTemperature-search`

### 7. **Context** 🧠
- **Type**: Dropdown selection (inline)
- **Location**: Model Options section (right of Temperature)
- **Options**: 4 choices
  - `2048`
  - `4096` (default)
  - `8192`
  - `16384`
- **Default**: 4096
- **Persistence**: ✅ Remembered across sessions
- **Config File**: `config/context.json`
- **Purpose**: Sets context window size for AI processing
- **Database Field**: `ModelContextSize-search`

### 8. **Tokens** 🎯
- **Type**: Dropdown selection (inline)
- **Location**: Model Options section (right of Context)
- **Options**: 3 choices
  - `No Limit` (null)
  - `250` (250 tokens)
  - `500` (500 tokens)
- **Default**: No Limit
- **Persistence**: ✅ Remembered across sessions
- **Config File**: `config/tokens.json`
- **Purpose**: Limits AI response length
- **Database Field**: `ModelTokenLimit-search`

### 9. **Generate Scores** ✅
- **Type**: Checkbox (boolean)
- **Location**: Below query input
- **Options**: 2 states
  - `Unchecked` (false) - Default
  - `Checked` (true)
- **Default**: Unchecked (false)
- **Persistence**: ❌ Not remembered (always defaults to false)
- **Config File**: None (hardcoded)
- **Purpose**: Enables/disables response scoring
- **Database Field**: Affects scoring-related fields

## Parameter Categories

### **Configuration Parameters** (7 total)
Parameters that control AI behavior and are remembered across sessions:
1. Source Type
2. Model
3. Assistant Type
4. Temperature
5. Context
6. Tokens
7. *(User Prompts - template only)*

### **Input Parameters** (2 total)
Parameters for user input that are not persisted:
1. User Prompts (template selector)
2. Query Input (main content)

### **Control Parameters** (1 total)
Parameters that control application behavior:
1. Generate Scores (scoring toggle)

## Persistence Summary

### ✅ **Remembered Across Sessions** (6 parameters):
- Source Type → `localStorage.lastSourceType`
- Model → `localStorage.lastUsedModel`
- Assistant Type → `localStorage.lastAssistantType`
- Temperature → `localStorage.lastTemperature`
- Context → `localStorage.lastContext`
- Tokens → `localStorage.lastTokens`

### ❌ **Not Remembered** (3 parameters):
- User Prompts (always resets to "Select a prompt...")
- Query Input (user content, not persisted)
- Generate Scores (always defaults to false)

## Configuration Files

All dropdown options (except Model) are loaded from JSON configuration files:

```
client/c01_client-first-app/config/
├── source-types.json     # Source Type options
├── system-prompts.json   # Assistant Type prompts
├── users-prompts.json    # User Prompt templates
├── tokens.json          # Token limit options
├── temperature.json     # Temperature settings
└── context.json         # Context size options
```

## Database Integration

All parameters are captured and stored in the MySQL database when results are exported:

### **Direct Storage**:
- `SourceType` → Source Type selection
- `SystemPrompt` → Assistant Type name
- `Prompt` → Query Input content
- `ModelName-search` → Model selection
- `ModelContextSize-search` → Context selection
- `ModelTemperature-search` → Temperature value
- `ModelTokenLimit-search` → Token limit selection

### **Derived Storage**:
- Scoring fields populated if Generate Scores is enabled
- Performance metrics captured automatically
- System information gathered automatically

## API Parameter Mapping

When submitted, parameters are sent to the backend API as:

```json
{
  "query": "Query Input content",
  "score": "Generate Scores boolean",
  "model": "Model selection",
  "temperature": "Temperature numeric value",
  "context": "Context numeric value",
  "systemPrompt": "Full system prompt text",
  "systemPromptName": "Assistant Type name",
  "tokenLimit": "Token limit numeric value or null",
  "sourceType": "Source Type selection"
}
```

## User Experience Features

### **Smart Defaults**:
- All dropdowns have sensible default selections
- Preferences are restored on page load
- Required fields are clearly marked

### **Template Integration**:
- User Prompts populate the Query Input textarea
- Users can edit populated templates
- Templates provide starting points for common tasks

### **Validation**:
- Model selection is required
- Query Input must have content
- Form prevents submission without required fields

This comprehensive parameter system provides users with complete control over AI behavior while maintaining ease of use through smart defaults and preference persistence.