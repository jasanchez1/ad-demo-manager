<template>
  <div class="app-container">
    <div class="header">
      <img src="/icon.jpg" alt="Banner Manager Icon" class="header-icon" />
      <h1 class="title">Ad Demo Manager</h1>
      <div class="saved-values" v-if="savedValues.networkId && savedValues.apiKey">
        <div class="saved-item">Network ID: {{ savedValues.networkId }}</div>
        <div class="saved-item">API Key: ******</div>
      </div>
    </div>
    <div class="content">
      <h3 class="title">Network Settings</h3>
      <div class="form">
        <div class="input-group">
          <label>Network ID</label>
          <input type="text" v-model="networkId" placeholder='Enter Network'>
        </div>
        <div class="input-group">
          <label>API Key</label>
          <input type="text" v-model="apiKey" placeholder='Enter API Key'>
        </div>
        <button @click="saveSettings">Save</button>
      </div>

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

    // Validation function
    const validateSettingsInput = (): { valid: boolean; message: string } => {
      // Check if both fields are filled
      if (!networkId.value || !apiKey.value) {
        return {
          valid: false,
          message: 'Both Network ID and API Key are required'
        }
      }

      // Check if networkId is numeric
      if (!/^\d+$/.test(networkId.value)) {
        return {
          valid: false,
          message: 'Network ID must be numeric'
        }
      }

      return { valid: true, message: '' }
    }

    // Function to load saved values
    const loadSavedValues = () => {
      chrome.storage.sync.get(['networkId', 'apiKey'], (result) => {
        console.log('Loaded values:', result)
        const loadedNetworkId = result.networkId || ''
        const loadedApiKey = result.apiKey || ''
        networkId.value = loadedNetworkId;
        apiKey.value = loadedApiKey;
        savedValues.value = {
          networkId: loadedNetworkId,
          apiKey: loadedApiKey
        }
      })
    }

    const saveSettings = () => {
      // Validate before saving
      const validation = validateSettingsInput()
      if (!validation.valid) {
        message.value = validation.message
        messageType.value = 'error'
        setTimeout(() => {
          message.value = ''
        }, 3000)
        return
      }
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
      saveSettings,
    }
  }
}
</script>

<style>
.header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
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
}

#app {
  width: 100%;
  height: 100%;
}

.app-container {
  width: 100%;
  min-height: 100%;
  background: #003060;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: auto;
}

.content {
  padding: 16px;
  background: #001830;
  border-radius: 4px;
  margin: 8px;
  flex-direction: column;
  display: flex;
  height: 100%;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.input-group label {
  font-size: 12px;
  color: #aaa;
}

input {
  width: 80%;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
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
  background: #003060;
  padding: 6px 6px 8px 8px;
  border-radius: 4px;
  color: white;
  margin-left: auto;
}

.saved-values:hover {
  background: #3182ce;
}


.saved-item {
  font-size: 12px;
  margin-bottom: 2px;
}

.message {
  margin-top: 12px;
  padding: 4px;
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