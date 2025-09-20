<template>
  <div class="search-view">
    <SearchBox 
      @search="handleSearch"
      @method-change="handleMethodChange"
    />
    
    <MethodsTab 
      :active-method="searchMethod"
      @change="handleMethodChange"
    />
    
    <SearchFilters 
      v-if="showFilters"
      @filter-change="handleFilterChange"
    />
    
    <SearchResults 
      :results="searchResults"
      :loading="isLoading"
      :error="searchError"
      @document-select="handleDocumentSelect"
    />
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import SearchBox from '../components/SearchBox.vue'
import MethodTabs from '../components/MethodsTab.vue'
import SearchFilters from '../components/SearchFilters.vue'
import SearchResults from '../components/SearchResults.vue'
import { searchService } from '../services/searchService.js'

export default {
  name: 'SearchView',
  components: {
    SearchBox,
    MethodsTab: MethodTabs,
    SearchFilters,
    SearchResults
  },
  setup() {
    const searchResults = ref([])
    const isLoading = ref(false)
    const searchError = ref(null)
    const searchMethod = ref('fuzzy')
    const showFilters = ref(false)
    const filters = reactive({})

    const handleSearch = async (query) => {
      if (!query.trim()) return

      isLoading.value = true
      searchError.value = null
      
      try {
        const results = await searchService.search(query, searchMethod.value, filters)
        searchResults.value = results
      } catch (error) {
        searchError.value = error.message
        searchResults.value = []
      } finally {
        isLoading.value = false
      }
    }

    const handleMethodChange = (method) => {
      searchMethod.value = method
      showFilters.value = method === 'advanced'
    }

    const handleFilterChange = (newFilters) => {
      Object.assign(filters, newFilters)
    }

    const handleDocumentSelect = (document) => {
      console.log('Document selected:', document)
    }

    return {
      searchResults,
      isLoading,
      searchError,
      searchMethod,
      showFilters,
      handleSearch,
      handleMethodChange,
      handleFilterChange,
      handleDocumentSelect
    }
  }
}
</script>

<style scoped>
.search-view {
  max-width: 800px;
  margin: 0 auto;
}
</style>
