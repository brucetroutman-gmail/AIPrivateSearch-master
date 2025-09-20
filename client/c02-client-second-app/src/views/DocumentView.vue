<template>
  <div class="document-view">
    <h2>Document Management</h2>
    <div class="upload-section">
      <h3>Upload Documents</h3>
      <input 
        type="file" 
        multiple 
        @change="handleFileUpload"
        accept=".txt,.md,.json,.csv"
      >
    </div>
    
    <div class="documents-list">
      <h3>Available Documents</h3>
      <div v-if="documents.length === 0" class="no-documents">
        No documents available
      </div>
      <div v-else>
        <div 
          v-for="doc in documents" 
          :key="doc.id"
          class="document-item"
        >
          <h4>{{ doc.filename }}</h4>
          <p>{{ doc.type }} - {{ formatFileSize(doc.size) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'DocumentView',
  setup() {
    const documents = ref([])

    const handleFileUpload = (event) => {
      // Handle file upload logic
      console.log('Files selected:', event.target.files)
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    onMounted(() => {
      // Load documents on mount
    })

    return {
      documents,
      handleFileUpload,
      formatFileSize
    }
  }
}
</script>

<style scoped>
.document-view {
  max-width: 800px;
}

.upload-section,
.documents-list {
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.document-item {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.document-item:last-child {
  border-bottom: none;
}

.no-documents {
  text-align: center;
  color: #7f8c8d;
  padding: 2rem;
}
</style>
