# Local Documents Search Analysis

## Missing Columns Analysis for MySQL Tables and Log Files

### Current MySQL Database Schema
Based on `aiprivatesearch.searches` table, we currently capture:
- Basic info: TestCode, TestCategory, TestDescription, UserEmail
- System info: PcCode, PcCPU, PcGraphics, PcRAM, PcOS, CreatedAt
- Search params: SourceType, CollectionName, SystemPrompt, Prompt
- Model metrics: ModelName-search, ModelContextSize-search, etc.
- Scoring: AccurateScore, RelevantScore, OrganizedScore, WeightedScore-pct

### Available Data from Local Document Searches (Not Currently Captured)

#### 1. **Search Method Specific Data**
**Missing Columns:**
- `SearchMethodType` - Specific method used (line-search, smart-search, ai-document-chat, etc.)
- `TopKResults` - Number of top results requested (for vector searches)
- `SimilarityThreshold` - Minimum similarity score for results
- `UseWildcards` - Boolean flag for wildcard usage in line search
- `ShowChunks` - Boolean flag for chunk display

#### 2. **Document Collection Metadata**
**Missing Columns:**
- `TotalDocumentsInCollection` - Total documents available in searched collection
- `CollectionSize` - Total size of collection in bytes
- `CollectionLastModified` - When collection was last updated
- `DocumentFormats` - Types of documents in collection (PDF, DOCX, etc.)

#### 3. **Search Results Analytics**
**Missing Columns:**
- `ResultsReturned` - Actual number of results returned
- `ResultsRequested` - Number of results requested (topK)
- `AverageRelevanceScore` - Average similarity/relevance score of results
- `HighestRelevanceScore` - Best match score
- `LowestRelevanceScore` - Worst match score that still qualified
- `UniqueDocumentsFound` - Number of unique documents in results
- `DuplicateChunksFiltered` - Number of duplicate chunks removed

#### 4. **Vector/Embedding Search Specific**
**Missing Columns:**
- `EmbeddingModel` - Model used for embeddings (sentence-transformers, etc.)
- `EmbeddingDimensions` - Vector dimensions used
- `ChunksSearched` - Total number of chunks searched
- `ChunksMatched` - Number of chunks that met similarity threshold
- `VectorSearchTime` - Time spent on vector similarity calculation
- `EmbeddingGenerationTime` - Time to generate query embedding

#### 5. **AI Document Chat Specific**
**Missing Columns:**
- `ChunksUsedInContext` - Number of chunks fed to AI model
- `ContextLength` - Total characters in context
- `ChunkAverageLength` - Average length of chunks used
- `SourceDocumentsCount` - Number of unique source documents
- `AIPromptLength` - Length of generated prompt sent to AI
- `ContextTruncated` - Boolean if context was truncated due to limits

#### 6. **Line Search Specific**
**Missing Columns:**
- `ExactMatches` - Number of exact string matches found
- `CaseInsensitiveMatches` - Number of case-insensitive matches
- `WildcardMatches` - Number of wildcard pattern matches
- `RegexPattern` - Regex pattern used (if any)
- `LinesSearched` - Total lines searched across all documents
- `FilesWithMatches` - Number of files containing matches

#### 7. **Document Index Search Specific**
**Missing Columns:**
- `IndexedDocuments` - Number of documents with index cards
- `IndexFieldsSearched` - Which index fields were searched (title, summary, etc.)
- `IndexMatchType` - Type of index match (exact, partial, fuzzy)
- `CustomFieldsSearched` - Any custom metadata fields searched

#### 8. **Performance Metrics**
**Missing Columns:**
- `FileSystemReadTime` - Time spent reading files from disk
- `IndexLookupTime` - Time spent on index/database lookups
- `ResultFormattingTime` - Time spent formatting results for display
- `MemoryUsage` - Peak memory usage during search
- `CacheHitRate` - Percentage of cache hits vs misses

#### 9. **Error and Quality Metrics**
**Missing Columns:**
- `ErrorsEncountered` - Number of errors during search
- `CorruptedFiles` - Number of files that couldn't be processed
- `EmptyResults` - Boolean if search returned no results
- `TimeoutOccurred` - Boolean if search timed out
- `PartialResults` - Boolean if results were incomplete

#### 10. **User Interaction Data**
**Missing Columns:**
- `QueryLength` - Length of user query in characters
- `QueryComplexity` - Complexity score based on operators, length, etc.
- `QueryLanguage` - Detected language of query
- `SearchRefinement` - Boolean if this was a refined/follow-up search
- `PreviousQueryId` - Link to previous related query

### Recommended New MySQL Columns

#### High Priority (Most Valuable for Analysis)
```sql
ALTER TABLE searches ADD COLUMN `SearchMethodType` VARCHAR(50);
ALTER TABLE searches ADD COLUMN `ResultsReturned` INT;
ALTER TABLE searches ADD COLUMN `ResultsRequested` INT;
ALTER TABLE searches ADD COLUMN `AverageRelevanceScore` FLOAT;
ALTER TABLE searches ADD COLUMN `ChunksSearched` INT;
ALTER TABLE searches ADD COLUMN `TotalDocumentsInCollection` INT;
ALTER TABLE searches ADD COLUMN `VectorSearchTime` FLOAT;
ALTER TABLE searches ADD COLUMN `QueryLength` INT;
ALTER TABLE searches ADD COLUMN `EmptyResults` BOOLEAN;
```

#### Medium Priority (Useful for Optimization)
```sql
ALTER TABLE searches ADD COLUMN `TopKResults` INT;
ALTER TABLE searches ADD COLUMN `EmbeddingModel` VARCHAR(100);
ALTER TABLE searches ADD COLUMN `ChunksUsedInContext` INT;
ALTER TABLE searches ADD COLUMN `SourceDocumentsCount` INT;
ALTER TABLE searches ADD COLUMN `FileSystemReadTime` FLOAT;
ALTER TABLE searches ADD COLUMN `MemoryUsage` BIGINT;
ALTER TABLE searches ADD COLUMN `ErrorsEncountered` INT;
```

#### Low Priority (Nice to Have)
```sql
ALTER TABLE searches ADD COLUMN `UseWildcards` BOOLEAN;
ALTER TABLE searches ADD COLUMN `ShowChunks` BOOLEAN;
ALTER TABLE searches ADD COLUMN `CollectionSize` BIGINT;
ALTER TABLE searches ADD COLUMN `DocumentFormats` TEXT;
ALTER TABLE searches ADD COLUMN `QueryComplexity` FLOAT;
ALTER TABLE searches ADD COLUMN `CacheHitRate` FLOAT;
```

### Implementation Priority

1. **Phase 1**: Add high-priority columns and update SearchLogger to capture this data
2. **Phase 2**: Implement performance timing measurements in search methods
3. **Phase 3**: Add collection metadata gathering
4. **Phase 4**: Implement advanced analytics and error tracking

This analysis shows that local document searches generate significantly more detailed data than what's currently captured in either the MySQL database or log files. Implementing these additional fields would provide much richer analytics for search performance optimization and user behavior analysis.