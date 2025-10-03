# AISearchScore Search Page Hide/Show Controls

## Overview
The search page uses a unified visibility control system that shows/hides form fields based on the selected **Source Type** and **Search Type**. All visibility logic is centralized in the `updateFieldVisibility()` function.

## Source Types
- **Local Model Only**: AI model without documents
- **Local Documents Only**: Document search without AI model  
- **Local Model and Documents**: Combined AI model and document capabilities

## Search Types (only available when documents are involved)
- **Line Search (exact-match)**: Line-by-line text search
- **Document Search (fulltext)**: Document-wide search with ranking
- **AI Direct**: Direct AI questioning
- **RAG Search**: Retrieval-Augmented Generation
- **Vector DB**: Semantic similarity search
- **Hybrid**: Combined traditional and vector search
- **Metadata**: Structured document metadata search

## Visibility Rules Matrix

| Field/Section | Local Model Only | Local Docs Only | Local Model + Docs |
|---------------|------------------|-----------------|-------------------|
| **Collection Section** | ❌ Hidden | ✅ Shown | ✅ Shown |
| **Search Type Section** | ❌ Hidden | ✅ Shown | ✅ Shown |
| **Wildcard Checkbox** | ❌ Hidden | ✅ Shown (Line/Doc only) | ✅ Shown (Line/Doc only) |
| **Model Field** | ✅ Shown | ❌ Hidden (Line/Doc) | ❌ Hidden (Line/Doc) |
| **Temperature/Context/Tokens** | ✅ Shown | ❌ Hidden (Line/Doc) | ❌ Hidden (Line/Doc) |
| **Assistant Type** | ✅ Shown | ❌ Hidden (Line/Doc) | ❌ Hidden (Line/Doc) |
| **Show Chunks** | ❌ Hidden | ❌ Hidden (Line/Doc) | ❌ Hidden (Line/Doc) |
| **Generate Scores** | ❌ Hidden | ✅ Shown (RAG only) | ✅ Shown (RAG only) |

## Logic Flow

### 1. Source Type Categories
```javascript
const isLocalModelOnly = sourceType === 'Local Model Only';
const isLocalDocsOnly = sourceType === 'Local Documents Only';  
const isLocalModelAndDocs = sourceType === 'Local Model and Documents';
const hasDocuments = isLocalDocsOnly || isLocalModelAndDocs;
const hasModel = isLocalModelOnly || isLocalModelAndDocs;
```

### 2. Search Type Categories
```javascript
const isNonModelSearch = searchType === 'exact-match' || searchType === 'fulltext';
const needsModel = hasModel && !isNonModelSearch;
```

### 3. Field Visibility Rules

#### Document-Related Sections
- **Show when**: `hasDocuments` is true
- **Fields**: Collection, Search Type, Vector DB sections

#### Model-Related Fields  
- **Show when**: `needsModel` is true (has model AND not doing line/document search)
- **Fields**: Model dropdown, Temperature/Context/Tokens, Assistant Type

#### Wildcard Checkbox
- **Show when**: `hasDocuments` AND (`searchType === 'exact-match' OR 'fulltext'`)
- **Logic**: Only for text-based searches on documents

#### Show Chunks Checkbox
- **Show when**: `hasDocuments` AND NOT `isNonModelSearch`
- **Logic**: Only for AI-powered document searches

#### Generate Scores
- **Show when**: `hasDocuments` AND `searchType === 'rag'`
- **Logic**: Only for RAG searches on documents

## Implementation

### Main Function
```javascript
function updateFieldVisibility() {
  // Determine categories
  // Apply visibility rules
  // Handle special cases
}
```

### Event Handlers
- **Source Type Change**: Calls `updateFieldVisibility()` + `loadCollections()` + `filterAssistantTypes()`
- **Search Type Change**: Calls `updateFieldVisibility()`
- **Page Load**: Calls `updateFieldVisibility()` with delay for DOM readiness

### Legacy Compatibility
```javascript
function toggleWildcardVisibility() { updateFieldVisibility(); }
function toggleModelFieldsVisibility() { updateFieldVisibility(); }  
function toggleGenerateScoresVisibility() { updateFieldVisibility(); }
```

## Special Cases

### Assistant Type Filtering
- **Local Documents Only**: Shows only "Documents Only" assistant
- **Other source types**: Shows all assistants except "Documents Only"

### Model Validation
- **Skip validation**: For Line Search and Document Search (non-AI searches)
- **Require model**: For all AI-powered searches

### Checkbox State Management
- **Auto-uncheck**: Wildcards, Show Chunks, Generate Scores when hidden
- **Preserve state**: When fields are shown again

## Troubleshooting

### Common Issues
1. **Fields not hiding on page load**: Add setTimeout delay for DOM readiness
2. **Local Model Only not working**: Check `hasModel` logic vs `hasDocuments`
3. **Inconsistent behavior**: Ensure all event handlers call `updateFieldVisibility()`

### Debug Steps
1. Check source type and search type values
2. Verify `hasDocuments`, `hasModel`, `needsModel` flags
3. Confirm DOM elements exist before manipulating
4. Test all source type + search type combinations

## Future Changes

When adding new fields or modifying visibility rules:

1. **Update this documentation first**
2. **Add logic to `updateFieldVisibility()` function**
3. **Test all source type combinations**
4. **Update the visibility rules matrix above**
5. **Consider impact on validation logic**

This centralized approach ensures consistent behavior and makes future modifications easier to implement and debug.