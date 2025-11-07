 
 
// Common setup guidance messages for search types requiring embeddings or doc indexes

export class SetupGuidance {
  
  static createEmbeddingsRequiredResult(collection, searchType, method) {
    const searchTypeNames = {
      'smart-search': 'Smart Search',
      'hybrid-search': 'Hybrid Search', 
      'ai-document-chat': 'AI Document Chat'
    };
    
    const searchTypeName = searchTypeNames[searchType] || searchType;
    
    return {
      results: [{
        id: `setup_embeddings_${searchType}`,
        title: `⚠️ Embeddings Required for ${searchTypeName}`,
        excerpt: `${searchTypeName} requires embeddings to be created for the <strong>${collection}</strong> collection.<br><br>` +
                `<strong>What are embeddings?</strong><br>` +
                `Embeddings are AI-generated numerical representations of your documents that enable semantic similarity search.<br><br>` +
                `<strong>To create embeddings:</strong><br>` +
                `1. Go to <a href="./collections.html" style="color: #3498db;">Collections Editor</a><br>` +
                `2. Select the "${collection}" collection<br>` +
                `3. Click "Create Embeddings" button<br>` +
                `4. Wait for processing to complete<br><br>` +
                `<em>Note: This is a one-time setup process per collection.</em>`,
        score: 1.0,
        source: 'Setup Required'
      }],
      method: method,
      total: 1,
      message: `No embeddings found for collection: ${collection}. Create embeddings first to use ${searchTypeName}.`
    };
  }
  
  static createDocIndexRequiredResult(collection, method) {
    return {
      results: [{
        id: 'setup_doc_index',
        title: '⚠️ Doc Indexes Required for Document Index Search',
        excerpt: `Document Index Search requires Doc Indexes to be created for the <strong>${collection}</strong> collection.<br><br>` +
                `<strong>What are Doc Indexes?</strong><br>` +
                `Doc Indexes are AI-generated structured summaries and metadata for each document that enable fast, intelligent search.<br><br>` +
                `<strong>To create Doc Indexes:</strong><br>` +
                `1. Go to <a href="./collections.html" style="color: #3498db;">Collections Editor</a><br>` +
                `2. Select the "${collection}" collection<br>` +
                `3. Click "Create Doc Indexes" button<br>` +
                `4. Wait for AI analysis to complete<br><br>` +
                `<em>Note: This is a one-time setup process per collection.</em>`,
        score: 1.0,
        source: 'Setup Required'
      }],
      method: method,
      total: 1,
      message: `No Doc Index database found for collection: ${collection}. Create Doc Indexes first to use this search method.`
    };
  }
  
  static createEmptyDocIndexResult(collection, method) {
    return {
      results: [{
        id: 'setup_doc_index_empty',
        title: '⚠️ Empty Doc Index Database',
        excerpt: `The Doc Index database exists but contains no documents for the <strong>${collection}</strong> collection.<br><br>` +
                `<strong>To populate Doc Indexes:</strong><br>` +
                `1. Go to <a href="./collections.html" style="color: #3498db;">Collections Editor</a><br>` +
                `2. Select the "${collection}" collection<br>` +
                `3. Click "Create Doc Indexes" button to reprocess documents<br><br>` +
                `<em>This will analyze all documents in the collection with AI.</em>`,
        score: 1.0,
        source: 'Setup Required'
      }],
      method: method,
      total: 1,
      message: `No Doc Index found for collection: ${collection}. Create Doc Indexes first to use this search method.`
    };
  }
  
  static createHybridEmbeddingsRequiredResult(collection) {
    return {
      results: [{
        id: 'setup_hybrid_embeddings',
        title: '⚠️ Embeddings Required for Hybrid Search',
        excerpt: `Hybrid Search combines keyword and semantic search, but requires embeddings for the <strong>${collection}</strong> collection.<br><br>` +
                `<strong>What you can do:</strong><br>` +
                `1. Go to <a href="./collections.html" style="color: #3498db;">Collections Editor</a><br>` +
                `2. Select the "${collection}" collection<br>` +
                `3. Click "Create Embeddings" button<br><br>` +
                `<strong>Alternative:</strong> Use "Line Search" or "Document Search" which don't require embeddings.<br><br>` +
                `<em>Hybrid Search will work with keyword-only results until embeddings are created.</em>`,
        score: 1.0,
        source: 'Setup Required'
      }],
      method: 'hybrid-search',
      total: 1
    };
  }
}