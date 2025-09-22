7-Method Search Test Plan
Test Collection: USA-History
Test Model: qwen2:0.5b
Test Cases by Search Method
1. Traditional Text Search
Query: "We the People"
Expected Results:

The US Constitution.md (exact phrase match)

High relevance score for literal text matching

Query: taxation without representation
Expected Results:

Declaration of Independence.md (contains concept)

Line-by-line text matching

2. AI Direct Search
Query: What are the main principles of government?
Expected Results:

The US Constitution.md (separation of powers, federalism)

Declaration of Independence.md (natural rights, consent of governed)

AI-generated contextual responses

Query: Why did the colonies rebel?
Expected Results:

Declaration of Independence.md (grievances against Britain)

AI analysis of colonial complaints

3. RAG Search
Query: How is government power divided?
Expected Results:

Chunked responses about separation of powers

AI-generated answer from relevant document sections

Source attribution to Constitution chunks

4. Vector Database Search
Query: government authority
Expected Results:

The US Constitution.md (highest semantic similarity)

The Articles of Confederation.md (federal vs state power)

Declaration of Independence.md (authority concepts)

Ranked by embedding similarity scores

5. Hybrid Search
Query: federal power
Expected Results:

Combined keyword + semantic scoring

Breakdown: keyword score + semantic score + weights

The US Constitution.md (likely highest hybrid score)

6. Metadata Search
Query: legal documents
Expected Results:

The US Constitution.md (Type: text/markdown | Size: ~49KB | Category: legal)

The Articles of Confederation.md (Type: text/markdown | Size: ~20KB | Category: legal)

Declaration of Independence.md (Type: text/markdown | Size: ~8KB | Category: legal)

Ordered by file size (largest first)

Query: large files
Expected Results:

Documents over 10KB threshold

Size-based filtering

7. Full-Text Search
Query: Congress shall make no law
Expected Results:

The US Constitution.md (Bill of Rights content)

Lunr.js indexed search with relevance ranking

Stemming and stop-word processing

Performance Comparison Metrics
Speed Test (Expected Order - Fastest to Slowest):
Metadata (~50ms) - Database queries

Traditional (~100ms) - File scanning

Full-Text (~150ms) - Index lookup

Vector (~300ms) - Embedding similarity

Hybrid (~400ms) - Combined methods

RAG (~800ms) - Chunking + embeddings + AI

AI Direct (~1200ms) - Full document AI analysis

Result Quality Test:
Exact Matches: Traditional, Full-Text

Conceptual Understanding: Vector, RAG, AI Direct

Balanced Results: Hybrid

Structural Info: Metadata

Use Case Scenarios:
Research Questions: AI Direct, RAG

Document Discovery: Vector, Hybrid

Exact Citations: Traditional, Full-Text

Collection Management: Metadata

This test plan validates each method's unique strengths and provides benchmarks for the complete 7-method search system.



@Pin Context
+1

Rules

Claude Sonnet 4