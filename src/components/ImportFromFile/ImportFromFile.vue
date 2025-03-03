<template>
    <div class="import-wrapper">
      <input 
        type="file" 
        ref="fileInput" 
        accept=".json"
        @change="handleFileSelect" 
        class="file-input" 
      />
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  import type { AdConfig } from '../../types'
  
  const emit = defineEmits<{
    import: [AdConfig]
    error: [string]
  }>()
  
  const fileInput = ref<HTMLInputElement | null>(null)
  const error = ref('')
  
  // Function to open file selection dialog
  const openFileDialog = () => {
    if (fileInput.value) {
      fileInput.value.click()
    }
  }
  
  // Handle file selection
  const handleFileSelect = async (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    
    if (!file) {
      error.value = 'No file selected'
      emit('error', 'No file selected')
      return
    }
    
    try {
      const content = await readFileAsText(file)
      const json = JSON.parse(content)
      
      // Validate the JSON format - for single ad config (not array)
      if (Array.isArray(json)) {
        if (json.length === 0) {
          error.value = 'Empty array in JSON file'
          emit('error', 'Empty array in JSON file')
          return
        }
        
        // Take the first item if array
        validateAndEmitConfig(json[0])
      } else {
        // Process as single object
        validateAndEmitConfig(json)
      }
      
      // Reset the input for future imports
      if (fileInput.value) {
        fileInput.value.value = ''
      }
      
    } catch (err) {
      console.error('Import error:', err)
      error.value = 'Error parsing JSON file'
      emit('error', 'Error parsing JSON file')
    }
  }
  
  // Read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        resolve(e.target?.result as string)
      }
      
      reader.onerror = () => {
        reject(new Error('Error reading file'))
      }
      
      reader.readAsText(file)
    })
  }
  
  // Validate and emit config
  const validateAndEmitConfig = (config: any) => {
    console.log('Validating config:', config)
    
    // Basic validation of required fields
    if (!config.name || !config.adType || !config.site || !config.url || !config.divId) {
      error.value = 'Invalid ad configuration format'
      emit('error', 'Invalid ad configuration format')
      return
    }
    
    // Ensure adType has required fields
    if (!config.adType.name || !config.adType.width || !config.adType.height) {
      error.value = 'Invalid ad type format'
      emit('error', 'Invalid ad type format')
      return
    }
    
    // Ensure site has required fields
    if (!config.site.name) {
      error.value = 'Invalid site format'
      emit('error', 'Invalid site format')
      return
    }
    
    // Clear any errors
    error.value = ''
    
    // Emit the valid config
    console.log('Emitting valid config:', config)
    emit('import', config)
  }
  
  // Expose the openFileDialog method
  defineExpose({
    openFileDialog
  })
  </script>
  
  <style scoped>
  .import-wrapper {
    display: none;
  }
  
  .file-input {
    display: none;
  }
  
  .error-message {
    color: #f56565;
    font-size: 12px;
    margin-top: 4px;
  }
  </style>