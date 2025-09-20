<template>
  <div class="search-results">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Searching...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>
    
    <div v-else-if="results.length === 0" class="no-results">
      <p>No results found. Try a different search query.</p>
    </div>
    
    <div v-else class="results-list">
      <div class="results-header">
        <h3>Found {{ results.length }} result(s)</h3>
      </div>
      
      <div 
        v-for="result in results" 
        :key="result.id"
        class="result-item"
        @click="selectDocument(result)"
      >
        <div class="result-header">
          <h4>{{ result.title || result.filename || 'Untitled' }}</h4>
          <span class="score">{{ Math.round(result.score * 100) }}%</span>
        </div>
        
        <div class="result-content">
          <p>{{ result.excerpt || result.content?.substring(0, 200) + '...' }}</p>
        </div>
        
        <div class="result-meta">
          <span>{{ result.type || 'document' }}</span>
          <span v-if="result.size">{{ formatFileSize(result.size) }}</span>
          <span v-if="result.lastModified">{{ formatDate(result.lastModified) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SearchResults',
  props: {
    results: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: null
    }
  },
  emits: ['document-select'],
  setup(props, { emit }) {
    const selectDocument = (document) => {
      emit('document-select', document)
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString()
    }

    return {
      selectDocument,
      formatFileSize,
      formatDate
    }
  }
}
</script>

<style scoped>
.search-results {
  min-height: 200px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  color: #e74c3c;
  padding: 2rem;
}

.no-results {
  text-align: center;
  color: #7f8c8d;
  padding: 2rem;
}

.results-header {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #ecf0f1;
}

.result-item {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.result-item:hover {
  border-color: #3498db;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.result-header h4 {
  margin: 0;
  color: #2c3e50;
}

.score {
  background: #3498db;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
}

.result-content {
  margin-bottom: 0.5rem;
}

.result-content p {
  margin: 0;
  color: #555;
  line-height: 1.4;
}

.result-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #7f8c8d;
}
</style>
