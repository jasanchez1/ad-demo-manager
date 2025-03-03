<template>
    <div class="share-string-modal">
      <div class="modal-header">
        <h3>{{ isImport ? 'Import Ad Configuration' : 'Share Ad Configuration' }}</h3>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-content">
        <div v-if="isImport">
          <p class="instructions">Paste the share code to import an ad configuration:</p>
          <textarea
            v-model="importCode"
            placeholder="Paste share code here..."
            rows="4"
            class="share-textarea"
          ></textarea>
          <div v-if="importError" class="error-message">{{ importError }}</div>
          <div class="actions">
            <button class="secondary" @click="$emit('close')">Cancel</button>
            <button @click="importConfig" :disabled="!importCode.trim()">Import</button>
          </div>
        </div>
        <div v-else>
          <p class="instructions">Copy this code to share your ad configuration:</p>
          <textarea 
            v-model="exportCode" 
            readonly 
            rows="4" 
            class="share-textarea"
            ref="exportTextarea"
            @click="selectAll"
          ></textarea>
          <div class="copy-status" v-if="copied">Copied to clipboard!</div>
          <div class="actions">
            <button class="secondary" @click="$emit('close')">Close</button>
            <button @click="copyToClipboard">Copy to Clipboard</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, watch } from 'vue'
  import type { AdConfig } from '../../types'
  
  interface Props {
    isImport: boolean;
    config?: AdConfig;
  }
  
  const props = withDefaults(defineProps<Props>(), {
    isImport: false,
    config: undefined
  })
  
  const emit = defineEmits<{
    close: [];
    import: [AdConfig];
  }>()
  
  const exportCode = ref('')
  const importCode = ref('')
  const importError = ref('')
  const copied = ref(false)
  const exportTextarea = ref<HTMLTextAreaElement | null>(null)
  
  // Generate share code when component mounts (for export)
  onMounted(() => {
    if (!props.isImport && props.config) {
      try {
        const configJson = JSON.stringify(props.config)
        exportCode.value = btoa(encodeURIComponent(configJson))
      } catch (error) {
        console.error('Error generating share code:', error)
        exportCode.value = 'Error generating share code. Please try again.'
      }
    }
  })
  
  // Import configuration from share code
  const importConfig = () => {
    importError.value = ''
    
    try {
      // Trim and remove any whitespace
      const cleanCode = importCode.value.trim()
      
      // Decode the string
      const jsonString = decodeURIComponent(atob(cleanCode))
      const importedConfig = JSON.parse(jsonString)
      
      // Basic validation
      if (!importedConfig || !importedConfig.name || !importedConfig.adType || 
          !importedConfig.site || !importedConfig.url || !importedConfig.divId) {
        importError.value = 'Invalid configuration format'
        return
      }
      
      // Emit the imported config
      emit('import', importedConfig)
      emit('close')
    } catch (error) {
      console.error('Import error:', error)
      importError.value = 'Invalid share code. Please check and try again.'
    }
  }
  
  // Copy share code to clipboard
  const copyToClipboard = () => {
    if (exportTextarea.value) {
      exportTextarea.value.select()
      document.execCommand('copy')
      copied.value = true
      
      setTimeout(() => {
        copied.value = false
      }, 3000)
    }
  }
  
  // Auto-select text when clicking in the export textarea
  const selectAll = () => {
    if (exportTextarea.value) {
      exportTextarea.value.select()
    }
  }
  
  // Clear copied status when changing the export code
  watch(exportCode, () => {
    copied.value = false
  })
  </script>
  
  <style scoped>
  .share-string-modal {
    background: #001830;
    border-radius: 4px;
    width: 100%;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .modal-header h3 {
    margin: 0;
    font-size: 16px;
    color: white;
  }
  
  .close-button {
    background: transparent;
    border: none;
    color: #aaa;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .close-button:hover {
    color: white;
  }
  
  .modal-content {
    padding: 16px;
  }
  
  .instructions {
    margin: 0 0 12px;
    color: #ccc;
    font-size: 14px;
  }
  
  .share-textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #334155;
    border-radius: 4px;
    background: #0c2d4a;
    color: #eee;
    font-family: monospace;
    font-size: 12px;
    resize: none;
    margin-bottom: 12px;
    box-sizing: border-box;
  }
  
  .share-textarea:focus {
    outline: none;
    border-color: #4299e1;
  }
  
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  
  .actions button {
    padding: 6px 12px;
    font-size: 12px;
    width: auto;
  }
  
  .copy-status {
    color: #38a169;
    font-size: 12px;
    margin-bottom: 12px;
    text-align: right;
  }
  
  .error-message {
    color: #f56565;
    font-size: 12px;
    margin-bottom: 12px;
  }
  </style>