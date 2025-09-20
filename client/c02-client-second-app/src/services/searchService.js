import api from './api.js'

export const searchService = {
  async search(query, method = 'fuzzy', options = {}) {
    try {
      const response = await api.post('/search', {
        query,
        method,
        ...options
      })
      return response.data
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`)
    }
  },

  async getSuggestions(query) {
    try {
      const response = await api.get(`/search/suggestions?q=${encodeURIComponent(query)}`)
      return response.data
    } catch (error) {
      throw new Error(`Failed to get suggestions: ${error.message}`)
    }
  }
}
