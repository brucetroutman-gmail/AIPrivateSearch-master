# RAG Systems in 5 Levels of Difficulty

## Overview
From "it should work" to "it actually works in production"

RAG systems can be categorized into 5 distinct levels based on their sophistication and production readiness. This document outlines each level with practical code examples and real-world considerations.

## The Five Levels

1. **Naive RAG**: The tutorial version. Breaks immediately on real queries.
2. **Smart Chunking**: How you split documents determines what you can retrieve.
3. **Hybrid Search**: When "semantically similar" isn't the same as "actually relevant."
4. **Reranking**: A second pass that catches what retrieval missed.
5. **Production RAG**: What happens when retrieval fails? Don't let the LLM improvise.

---

## Level 1: Naive RAG

Embed your documents. Store vectors. Retrieve top-k by similarity. Generate.

```python
from openai import OpenAI
import chromadb

client = OpenAI()
chroma = chromadb.Client()
collection = chroma.create_collection("docs")

def index_document(doc_id: str, text: str):
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    collection.add(
        ids=[doc_id],
        embeddings=[response.data[0].embedding],
        documents=[text]
    )

def naive_rag(query: str, k: int = 3) -> str:
    # Embed query
    query_embedding = client.embeddings.create(
        model="text-embedding-3-small",
        input=query
    ).data[0].embedding
    
    # Retrieve
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=k
    )
    
    # Generate
    context = "\n\n".join(results["documents"][0])
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": f"Answer based on this context:\n\n{context}"},
            {"role": "user", "content": query}
        ]
    )
    return response.choices[0].message.content
```

**Where it breaks**: Semantic similarity isn't relevance. Query "data retention policy" and you'll retrieve chunks about "employee retention programs" because embeddings see the word overlap. The concepts are unrelated but the vectors are close.

---

## Level 2: Smart Chunking

Most RAG failures look like retrieval failures. They're actually chunking failures.

**Chunk size considerations**:
- **Too small (100–200 tokens)**: Chunks lack context. "Delete after 90 days" means nothing without knowing what gets deleted.
- **Too large (1000+ tokens)**: Chunks contain multiple topics. Retrieval pulls in noise alongside signal.
- **Sweet spot (300–500 tokens)**: Enough context to be useful, focused enough to be relevant.

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=400,
    chunk_overlap=100,  # This is the key
    separators=["\n\n", "\n", ". ", " ", ""]
)

def chunk_with_metadata(doc: str, source: str, doc_date: str) -> list[dict]:
    chunks = splitter.split_text(doc)
    return [
        {
            "text": chunk,
            "source": source,
            "date": doc_date,
            "section": extract_section_header(chunk),
        }
        for chunk in chunks
    ]
```

**Key insight**: 100-token overlap means if a sentence gets split, both chunks contain it. The answer that landed at a chunk boundary is now retrievable from either side.

---

## Level 3: Hybrid Search

Query: "What's our PTO policy for employees with 5+ years tenure?"

- **Semantic search** finds chunks about time-off policies generally. Conceptually similar.
- **Keyword search** finds chunks containing "5+ years" and "tenure." Exact matches.

Neither alone finds the right answer. Together they do.

```python
from rank_bm25 import BM25Okapi
import numpy as np

class HybridRetriever:
    def __init__(self, documents: list[str]):
        self.documents = documents
        self.embeddings = self._embed_all(documents)
        
        # BM25 for keyword matching
        tokenized = [doc.lower().split() for doc in documents]
        self.bm25 = BM25Okapi(tokenized)
    
    def _embed_all(self, docs: list[str]) -> list[list[float]]:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=docs
        )
        return [d.embedding for d in response.data]
    
    def search(self, query: str, k: int = 5, alpha: float = 0.5) -> list[str]:
        # Semantic scores (normalized)
        q_emb = client.embeddings.create(
            model="text-embedding-3-small",
            input=query
        ).data[0].embedding
        
        sem_scores = np.dot(self.embeddings, q_emb)
        sem_scores = (sem_scores - sem_scores.min()) / (sem_scores.max() - sem_scores.min() + 1e-8)
        
        # BM25 scores (normalized)
        bm25_scores = np.array(self.bm25.get_scores(query.lower().split()))
        if bm25_scores.max() > 0:
            bm25_scores = bm25_scores / bm25_scores.max()
        
        # Combine: alpha controls semantic vs keyword weight
        combined = alpha * sem_scores + (1 - alpha) * bm25_scores
        
        top_k = np.argsort(combined)[::-1][:k]
        return [self.documents[i] for i in top_k]
```

**Tuning alpha**:
- Domain-specific jargon (legal, medical, internal acronyms) → lower alpha, more BM25
- Natural language questions → higher alpha, more semantic
- Start at 0.5, adjust based on what queries fail

---

## Level 4: Reranking

You've retrieved 5 chunks. They're all about the topic. But which ones actually answer the question?

Embedding similarity is computed independently. A reranker looks at query and document together and asks: "Does this document answer this question?"

```python
from sentence_transformers import CrossEncoder

class RerankedRetriever:
    def __init__(self, documents: list[str]):
        self.hybrid = HybridRetriever(documents)
        self.reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    
    def search(self, query: str, k: int = 3) -> list[str]:
        # Get 20 candidates (cheap, fast)
        candidates = self.hybrid.search(query, k=20)
        
        # Rerank with cross-encoder (expensive, accurate)
        pairs = [(query, doc) for doc in candidates]
        scores = self.reranker.predict(pairs)
        
        # Return top k after reranking
        reranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
        return [doc for doc, _ in reranked[:k]]
```

**Why this works**: Cross-encoders can't pre-compute document embeddings. They need query and document together. That makes them slow for initial retrieval but perfect for reranking 20 candidates to pick 3.

**Performance improvement**: Reranking typically improves "correct chunk in top 3" from ~68% to ~89%.

---

## Level 5: Production RAG

What happens when retrieval fails? Don't let the LLM improvise.

```python
class ProductionRAG:
    def __init__(self, retriever, confidence_threshold: float = 0.7):
        self.retriever = retriever
        self.threshold = confidence_threshold
    
    def answer_with_confidence(self, query: str) -> dict:
        # Retrieve with scores
        results = self.retriever.search_with_scores(query, k=3)
        
        # Check retrieval confidence
        if not results or results[0]['score'] < self.threshold:
            return {
                "answer": "I don't have enough information to answer this question confidently.",
                "confidence": "low",
                "sources": []
            }
        
        # Generate with high-confidence context
        context = "\n\n".join([r['text'] for r in results])
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system", 
                    "content": f"""Answer based only on this context. 
                    If the context doesn't contain the answer, say so.
                    
                    Context:
                    {context}"""
                },
                {"role": "user", "content": query}
            ]
        )
        
        return {
            "answer": response.choices[0].message.content,
            "confidence": "high" if results[0]['score'] > 0.8 else "medium",
            "sources": [r['source'] for r in results]
        }
```

**Key principles**:
- **Fail gracefully**: Better to say "I don't know" than to hallucinate
- **Provide sources**: Always show where answers came from
- **Confidence scoring**: Let users know when to trust the answer
- **Monitoring**: Track when retrieval fails to improve the system

---

## Performance Comparison

| Level | Accuracy | Speed | Complexity | Production Ready |
|-------|----------|-------|------------|------------------|
| 1     | 60-70%   | Fast  | Low        | No               |
| 2     | 70-80%   | Fast  | Medium     | Maybe            |
| 3     | 80-85%   | Medium| Medium     | Yes              |
| 4     | 85-92%   | Slow  | High       | Yes              |
| 5     | 90-95%   | Slow  | High       | Required         |

## Implementation Recommendations

1. **Start with Level 2**: Smart chunking fixes most basic issues
2. **Add Level 3**: Hybrid search for domain-specific terminology
3. **Consider Level 4**: Reranking when accuracy is critical
4. **Always implement Level 5**: Production systems need graceful failure

## AIPrivateSearch Implementation

**Current Level**: Level 3 (Hybrid Search with LLM Integration)

**Features Implemented**:
- Smart chunking with overlap
- Semantic vector search with sentence transformers
- Multiple search strategies (Smart Search, Document Search)
- LLM integration for response generation
- Performance scoring and evaluation

**Roadmap**:
- **Level 4**: Add reranking for improved accuracy
- **Level 5**: Implement confidence scoring and graceful failure handling

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-22  
**Related Systems**: AIPrivateSearch v20.02