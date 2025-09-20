<template>
  <div class="method-tabs">
    <button
      v-for="method in methods"
      :key="method.value"
      @click="selectMethod(method.value)"
      :class="['tab-button', { active: activeMethod === method.value }]"
    >
      {{ method.label }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'MethodTabs',
  props: {
    activeMethod: {
      type: String,
      default: 'fuzzy'
    }
  },
  emits: ['change'],
  setup(props, { emit }) {
    const methods = [
      { value: 'fuzzy', label: 'Fuzzy Search' },
      { value: 'exact', label: 'Exact Match' },
      { value: 'semantic', label: 'Semantic Search' },
      { value: 'advanced', label: 'Advanced Search' }
    ]

    const selectMethod = (method) => {
      emit('change', method)
    }

    return {
      methods,
      selectMethod
    }
  }
}
</script>

<style scoped>
.method-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tab-button {
  padding: 0.5rem 1rem;
  border: 2px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover {
  border-color: #3498db;
}

.tab-button.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}
</style>
