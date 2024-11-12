<template>
  <div class="app-container">
    <div class="header">
      <img src="/icon.jpg" alt="Banner Manager Icon" class="header-icon" />
      <h1 class="title">Ad Demo Manager</h1>
    </div>
    <div class="content">
      <div class="saved-values" v-if="savedValues.networkId && savedValues.apiKey">
        <h2 class="subtitle">Saved Values:</h2>
        <div class="saved-item">Network ID: {{ savedValues.networkId }}</div>
        <div class="saved-item">API Key: {{ savedValues.apiKey }}</div>
      </div>

      <div class="form">
        <div class="input-group">
          <label>Network ID</label>
          <input type="text" v-model="networkId" placeholder="Enter Network ID">
        </div>
        <div class="input-group">
          <label>API Key</label>
          <input type="text" v-model="apiKey" placeholder="Enter API Key">
        </div>
        <button @click="saveSettings">Save Settings</button>
      </div>

      <!-- Feedback Message -->
      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted } from 'vue'

export default {
  setup() {
    const networkId = ref('')
    const apiKey = ref('')
    const message = ref('')
    const messageType = ref('')
    const savedValues = ref({ networkId: '', apiKey: '' })

    // Load saved values when component mounts
    onMounted(() => {
      loadSavedValues()
    })

    // Function to load saved values
    const loadSavedValues = () => {
      chrome.storage.sync.get(['networkId', 'apiKey'], (result) => {
        console.log('Loaded values:', result)
        savedValues.value = {
          networkId: result.networkId || '',
          apiKey: result.apiKey || ''
        }
      })
    }

    const saveSettings = () => {
      console.log('Saving values:', { networkId: networkId.value, apiKey: apiKey.value })

      chrome.storage.sync.set({
        networkId: networkId.value,
        apiKey: apiKey.value
      }, () => {
        // Check for any chrome.runtime errors
        if (chrome.runtime.lastError) {
          console.error('Save error:', chrome.runtime.lastError)
          message.value = 'Error saving settings'
          messageType.value = 'error'
        } else {
          console.log('Settings saved successfully')
          message.value = 'Settings saved successfully!'
          messageType.value = 'success'
          loadSavedValues() // Reload the saved values
        }

        // Clear message after 3 seconds
        setTimeout(() => {
          message.value = ''
        }, 3000)
      })
    }

    return {
      networkId,
      apiKey,
      message,
      messageType,
      savedValues,
      saveSettings
    }
  }
}
</script>

<style>
.header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #001830;
}

.header-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: block;
  border-radius: 4px;
}

.title {
  margin: 0;
  line-height: 32px;
  font-size: 15px;
  font-weight: 500;
  color: white;
}

html,
body {
  margin: 0;
  padding: 0;
  width: 400px;
  height: 300px;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
}

.app-container {
  width: 100%;
  height: 100%;
  background: #003060;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: auto;
}

.content {
  padding: 16px;
  background: #001830;
  border-radius: 4px;
  margin: 8px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-group label {
  font-size: 14px;
  color: white;
}

input {
  width: 80%;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
}

input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 1px rgba(66, 153, 225, 0.5);
}

button {
  padding: 8px 16px;
  width: 80%;
  background: #fd563c;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background: #3182ce;
}

.saved-values {
  background: rgba(255, 255, 255, 0.1);
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.subtitle {
  font-size: 14px;
  color: #fd563c;
  margin: 0 0 8px 0;
}

.saved-item {
  color: white;
  font-size: 12px;
  margin-bottom: 4px;
}

.message {
  margin-top: 12px;
  padding: 8px;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

.success {
  background-color: rgba(72, 187, 120, 0.2);
  color: #48bb78;
}

.error {
  background-color: rgba(245, 101, 101, 0.2);
  color: #f56565;
}
</style>