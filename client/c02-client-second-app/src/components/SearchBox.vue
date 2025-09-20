<template>
  <div class="search-box">
    <div class="search-input-container">
      <input
        v-model="query"
        type="text"
        placeholder="Enter search query..."
        class="search-input"
        @keyup.enter="handleSearch"
      >
      <button 
        @click="handleSearch"
        class="search-button"
        :disabled="!query.trim()"
      >
        Search
      </button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'SearchBox',
  emits: ['search'],
  setup(props, { emit }) {
    const query = ref('')

    const handleSearch = () => {
      if (query.value.trim()) {
        emit('search', query.value.trim())
      }
    }

    return {
      query,
      handleSearch
    }
  }
}
</script>

<style scoped>
.search-box {
  margin-bottom: 2rem;
}

.search-input-container {
  display: flex;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
}

.search-button {
  padding: 0.75rem 1.5rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.search-button:hover:not(:disabled) {
  background: #2980b9;
}

.search-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}
</style>
