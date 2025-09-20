<template>
  <div class="settings-view">
    <h2>Settings</h2>
    
    <div class="settings-section">
      <h3>Search Settings</h3>
      <div class="setting-item">
        <label>Default Search Method:</label>
        <select v-model="settings.defaultMethod">
          <option value="fuzzy">Fuzzy Search</option>
          <option value="exact">Exact Match</option>
          <option value="semantic">Semantic Search</option>
        </select>
      </div>
      
      <div class="setting-item">
        <label>Results Per Page:</label>
        <input type="number" v-model="settings.resultsPerPage" min="5" max="100">
      </div>
    </div>
    
    <div class="settings-section">
      <h3>API Settings</h3>
      <div class="setting-item">
        <label>Server URL:</label>
        <input type="url" v-model="settings.serverUrl">
      </div>
    </div>
    
    <button @click="saveSettings" class="save-button">Save Settings</button>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'SettingsView',
  setup() {
    const settings = ref({
      defaultMethod: 'fuzzy',
      resultsPerPage: 20,
      serverUrl: 'http://localhost:3000'
    })

    const saveSettings = () => {
      localStorage.setItem('searchSettings', JSON.stringify(settings.value))
      alert('Settings saved!')
    }

    return {
      settings,
      saveSettings
    }
  }
}
</script>

<style scoped>
.settings-view {
  max-width: 600px;
}

.settings-section {
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.setting-item label {
  font-weight: bold;
}

.setting-item input,
.setting-item select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
}

.save-button {
  background: #27ae60;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-button:hover {
  background: #229954;
}
</style>