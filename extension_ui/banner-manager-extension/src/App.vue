<template>
  <div class="app-container">
    <div class="header">
      <img src="/icon.jpg" alt="Banner Manager Icon" class="header-icon" />
      <h1 class="title">Ad Demo Manager</h1>
      <div class="saved-values" v-if="savedValues.networkId && savedValues.apiKey" @click="enableSetSettings">
        <div class="saved-item">Network ID: {{ savedValues.networkId }}</div>
        <div class="saved-item">API Key: **********</div>
      </div>
    </div>
    <div class="content">
      <div class="settings" v-if="setSettings">

        <h3 class="title">Network Settings</h3>
        <h5 class="menu-description">Before continuing, you need to set configure your network settings</h5>
        <div class="form">
          <div class="input-group">
            <label>Network ID</label>
            <input type="text" v-model="networkId" placeholder='Enter Network'>
          </div>
          <div class="input-group">
            <label>API Key</label>
            <input type="text" v-model="apiKey" placeholder='Enter API Key'>
          </div>
          <div class="actions">
            <button v-if="savedValues.networkId && savedValues.apiKey" class="secondary"
              @click="disableSetSettings">Cancel</button>
            <button @click="saveSettings">Save</button>
          </div>
        </div>
      </div>
      <div class="ad-configs" v-if="!setSettings">
        <h3 class="title">Ad Configurations</h3>
        <div class="ad-list">
          <div v-for="config in adConfigs" :key="config.id" class="ad-item" @click="openAdDetails(config)">
            <div class="ad-info">
              <div class="ad-header">
                <span class="ad-name">{{ config.name }}</span>
                <span class="ad-type-badge">{{ config.adType.name }}</span>
              </div>
              <div class="ad-details">
                <div class="ad-site">{{ config.site.name }}</div>
                <div class="ad-url">{{ config.url }}</div>
              </div>
            </div>
            <label class="toggle" @click.stop>
              <input type="checkbox" :checked="config.isActive" @change="toggleAdConfig(config.id)">
              <span class="slider"></span>
            </label>
          </div>
        </div>
        <button class="create-button" @click="createNewAd">Create New Ad Config</button>
      </div>

      <div v-if="selectedAd" class="ad-details-modal">
        <h3 class="title">Edit Ad Configuration</h3>
        <div class="form">
          <div class="input-group">
            <label>Name</label>
            <input type="text" v-model="selectedAd.name">
          </div>
          <div class="input-group">
            <label>Ad Type</label>
            <select v-model="selectedAd.adType.id">
              <option v-for="type in adTypes" :key="type.id" :value="type.id">
                {{ type.name }}
              </option>
            </select>
          </div>
          <div class="input-group">
            <label>Site</label>
            <select v-model="selectedAd.site.id">
              <option v-for="site in sites" :key="site.id" :value="site.id">
                {{ site.name }}
              </option>
            </select>
          </div>
          <div class="input-group">
            <label>URL Pattern</label>
            <input type="text" v-model="selectedAd.url">
          </div>
          <div class="actions">
            <button class="secondary" @click="closeAdDetails">Cancel</button>
            <button @click="saveAdDetails">Save</button>
          </div>
        </div>
      </div>
      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted } from 'vue'

interface AdType {
  id: number;
  name: string;
}

interface Site {
  id: number;
  name: string;
}

interface AdConfig {
  id: number;
  name: string;
  adType: AdType;
  site: Site;
  url: string;
  isActive: boolean;
}

export default {
  setup() {
    const networkId = ref('')
    const apiKey = ref('')
    const message = ref('')
    const messageType = ref('')
    const savedValues = ref({ networkId: '', apiKey: '' })
    const setSettings = ref(false)

    const adTypes = ref<AdType[]>([
      { id: 1, name: 'Banner' },
      { id: 2, name: 'Interstitial' },
      { id: 3, name: 'Video' }
    ])

    const sites = ref<Site[]>([
      { id: 1, name: 'Example Site' },
      { id: 2, name: 'Blog Site' }
    ])

    const adConfigs = ref<AdConfig[]>([
      {
        id: 1,
        name: 'Homepage Banner',
        adType: { id: 1, name: 'Banner' },
        site: { id: 1, name: 'Example Site' },
        url: 'https://example.com/*',
        isActive: true
      }
    ])

    const selectedAd = ref<AdConfig | null>(null)

    const openAdDetails = (config: AdConfig) => {
      selectedAd.value = { ...config }
    }

    const closeAdDetails = () => {
      selectedAd.value = null
    }

    const saveAdDetails = () => {
      if (!selectedAd.value) return

      const index = adConfigs.value.findIndex(ad => ad.id === selectedAd.value?.id)
      if (index !== -1) {
        adConfigs.value[index] = { ...selectedAd.value }
      }

      closeAdDetails()
    }

    onMounted(() => {
      loadSavedValues()
    })

    const enableSetSettings = () => {
      setSettings.value = true;
    }

    const disableSetSettings = () => {
      setSettings.value = false;
    }

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
        if (!loadedApiKey || !loadedNetworkId) {
          enableSetSettings();
        }
      })
    }

    const toggleAdConfig = (id: number) => {
      const config = adConfigs.value.find(c => c.id === id)
      if (config) {
        config.active = !config.active
        // Save to storage or handle state change
      }
    }

    const createNewAd = () => {
      // Handle new ad creation
      console.log('Create new ad clicked')
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
          disableSetSettings();
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
      setSettings,
      enableSetSettings,
      adConfigs,
      toggleAdConfig,
      createNewAd,
      adTypes,
      sites,
      selectedAd,
      openAdDetails,
      closeAdDetails,
      saveAdDetails,
      disableSetSettings
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
  font-size: 15px;
  font-weight: 500;
  margin: 0;
  color: white;
}

.menu-description {
  font-size: 14px;
  font-weight: 300;
  color: #aaa;
  margin: 8px 0px 8px 0px;
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
  min-height: 320px;
  justify-content: space-between;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
  box-sizing: border-box;
}

.input-group label {
  font-size: 12px;
  color: white;
}

input {
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
  width: 100%;
  background: #fd563c;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  box-sizing: border-box;
}

button:hover {
  background: #e64a32;
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
  cursor: pointer;
}


.saved-item {
  font-size: 12px;
  margin-bottom: 2px;
}

.message {
  margin-top: auto;
  padding: 4px;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

.success {
  background-color: #3182ce;
  color: white;
}

.error {
  background-color: rgba(245, 101, 101, 0.2);
  color: #f56565;
}

.ad-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0;
}

.ad-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  cursor: pointer;
}

.ad-toggle input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.ad-info {
  flex: 1;
}

.ad-type {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.ad-url {
  color: #aaa;
  font-size: 12px;
  margin-top: 4px;
}

.create-button {
  margin-top: auto;
  background: #fd563c;
}

.create-button:hover {
  background: #e64a32;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #4B5563;
  transition: .4s;
  border-radius: 20px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked+.slider {
  background-color: #3182ce;
}

input:checked+.slider:before {
  transform: translateX(20px);
}

.ad-info {
  flex: 1;
  margin-right: 12px;
}

.ad-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ad-name {
  font-size: 14px;
  font-weight: 500;
  color: white;
}

.ad-type-badge {
  background: rgba(253, 86, 60, 0.1);
  color: #fd563c;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.ad-details {
  margin-top: 4px;
}

.ad-site {
  color: #aaa;
  font-size: 12px;
}

.ad-url {
  color: #aaa;
  font-size: 12px;
  margin-top: 2px;
}

.ad-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.ad-details-modal {
  background: #001830;
  padding: 16px;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.secondary {
  background: transparent;
  border: 1px solid #fd563c;
}

select {
  width: 100%;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
  background: white;
}
</style>