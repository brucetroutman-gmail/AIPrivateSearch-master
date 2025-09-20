<template>
  <div class="search-filters">
    <h3>Advanced Filters</h3>
    <div class="filter-grid">
      <div class="filter-group">
        <label>File Type:</label>
        <select v-model="filters.fileType" @change="emitChange">
          <option value="">All Types</option>
          <option value=".txt">Text Files</option>
          <option value=".md">Markdown</option>
          <option value=".json">JSON</option>
          <option value=".csv">CSV</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Date Range:</label>
        <input 
          type="date" 
          v-model="filters.dateFrom" 
          @change="emitChange"
        >
        <input 
          type="date" 
          v-model="filters.dateTo" 
          @change="emitChange"
        >
      </div>
      
      <div class="filter-group">
        <label>Minimum Score:</label>
        <input 
          type="range" 
          min="0" 
          max="100" 
          v-model="filters.minScore"
          @change="emitChange"
        >
        <span>{{ filters.minScore }}%</span>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive } from 'vue'

export default {
  name: 'SearchFilters',
  emits: ['filter-change'],
  setup(props, { emit }) {
    const filters = reactive({
      fileType: '',
      dateFrom: '',
      dateTo: '',
      minScore: 50
    })

    const emitChange = () => {
      emit('filter-change', { ...filters })
    }

    return {
      filters,
      emitChange
    }
  }
}
</script>

<style scoped>
.search-filters {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: bold;
  font-size: 0.9rem;
}

.filter-group input,
.filter-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>
