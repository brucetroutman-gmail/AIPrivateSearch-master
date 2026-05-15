# AIPrivateSearch - Implementation Plan for Local Document Search

## Overview
Integrate document collections into the search functionality to enable searching local processed documents instead of internet sources.

## Current State
- Document collections system exists with vector embeddings
- Collections can be created, managed, and documents processed
- Search.html currently only supports internet search via source types
- Vector database stores embeddings in `data/embeddings/{collection}/`

## Implementation Plan

### 1. **Update Source Type Logic**
- Modify `source-types.json` to include "Local Documents" option
- When "Local Documents" is selected, show collection dropdown instead of internet search
- Hide internet-specific options when local documents selected

### 2. **Add Collection Selection UI**
- Add collection dropdown that appears when "Local Documents" source type is selected
- Load available collections from `/api/documents/collections`
- Hide/show collection dropdown based on source type selection
- Position dropdown below source type selection

### 3. **Modify Search Flow**
```
User Flow:
1. User selects "Local Documents" from Source Type dropdown
2. Collection dropdown appears with available collections
3. User selects collection (e.g., "USA-History")
4. User enters search query
5. Search executes against that collection's vector database
6. Results display with document snippets and similarity scores
```

### 4. **Backend Integration**
- Modify search endpoint to accept `collection` parameter
- When collection is provided, use `DocumentSearch` class instead of internet search
- Return results from vector database with similarity scores
- Maintain same response format for consistency

### 5. **Search Results Display**
- Show document filename, similarity score, and content snippet
- Add "View Full Document" links that open documents
- Maintain same result format as internet search for consistency
- Include collection name in results for context

### 6. **Implementation Steps**

#### Step 1: Update Search UI
- [ ] Add "Local Documents" to source-types.json
- [ ] Add collection dropdown to search.html
- [ ] Implement show/hide logic for collection dropdown
- [ ] Load collections via API call

#### Step 2: Modify Search Logic
- [ ] Update search form submission to include collection parameter
- [ ] Add conditional logic for local vs internet search
- [ ] Handle collection selection validation

#### Step 3: Update Server Endpoint
- [ ] Modify search endpoint to detect collection parameter
- [ ] Route to DocumentSearch when collection provided
- [ ] Maintain existing internet search for other source types
- [ ] Return consistent result format

#### Step 4: Test and Refine
- [ ] Test with different collections
- [ ] Verify result display and formatting
- [ ] Test edge cases (empty collections, no results)
- [ ] Performance testing with large collections

### 7. **User Experience Flow**
```
Search Page → 
Source Type: "Local Documents" → 
Collection: "USA-History" → 
Query: "constitution" → 
Results from processed MD files with similarity scores
```

### 8. **Technical Details**

#### Frontend Changes
- **File**: `search.html`
- **Changes**: Add collection dropdown, conditional display logic
- **API Calls**: Load collections, submit search with collection parameter

#### Backend Changes
- **File**: Search endpoint (likely in routes/)
- **Changes**: Add collection parameter handling, route to DocumentSearch
- **Integration**: Use existing DocumentSearch class

#### Data Flow
```
Frontend: collection + query → 
Backend: DocumentSearch.searchDocuments(query) → 
Vector DB: similarity search → 
Results: [{filename, content, similarity}] → 
Frontend: Display formatted results
```

### 9. **Success Criteria**
- [ ] User can select "Local Documents" source type
- [ ] Collection dropdown populates with available collections
- [ ] Search returns relevant results from selected collection
- [ ] Results display with proper formatting and similarity scores
- [ ] Performance is acceptable for typical collection sizes
- [ ] Integration doesn't break existing internet search functionality

### 10. **Future Enhancements**
- Multi-collection search (search across multiple collections)
- Collection-specific result filtering
- Document preview in search results
- Search within specific document types (PDF, MD, TXT)
- Search history for local document searches

## Next Steps
1. Start with Step 1: Update Search UI
2. Test each step incrementally
3. Maintain backward compatibility with existing search functionality
4. Document any API changes for future reference