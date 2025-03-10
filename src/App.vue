<template>
  <div class="app-container" :class="{ 'picking-mode': isPicking }">
    <div class="header">
      <img src="/icon.jpg" alt="Banner Manager Icon" class="header-icon" />
      <h1 class="title">Ad Demo Manager</h1>
      <div class="saved-values" v-if="savedValues.networkId && savedValues.apiKey" @click="navigateTo(Page.Settings)">
        <div class="saved-item">Network ID: {{ savedValues.networkId }}</div>
        <div class="saved-item">API Key: **********</div>
      </div>
    </div>
    <div class="content">
      <!-- Settings Page -->
      <div class="settings" v-if="currentPage === Page.Settings">
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
              @click="navigateBack">Cancel</button>
            <button @click="handleSuccessfulSettingsSave" :disabled="isLoading"> {{ isLoading ? 'Saving...' : 'Save' }} </button>
          </div>
          <div class="input-group">
            <label class="toggle-label">
              Demo Mode
              <div class="toggle-wrapper">
                <label class="toggle" @click.stop>
                  <input type="checkbox" v-model="demoMode" @change="saveDemoMode">
                  <span class="slider"></span>
                </label>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Ad Configurations Page -->
      <div v-if="currentPage === Page.AdConfigs">
        <h3 class="title">Ad Configurations</h3>
        <div class="ad-list">
          <div v-for="config in adConfigs" :key="config.id" class="ad-item" @click="openAdDetails(config)">
            <div class="ad-info">
              <div class="ad-header">
                <span class="ad-name">{{ config.name }}</span>
                <span class="ad-type-badge">{{ `${config.adType.name} -
                  ${config.adType.width}x${config.adType.height}`
                }}</span>
              </div>
              <div class="ad-details">
                <div class="ad-site">{{ config.site.name }}</div>
                <div class="ad-url">{{ config.url }}</div>
              </div>
            </div>
            <div class="ad-config-actions">
              <label class="toggle" @click.stop>
                <input type="checkbox" :checked="config.isActive" @change="toggleAdConfig(config.id)">
                <span class="slider"></span>
              </label>
              <AdItemMenu 
                @edit="openAdDetails(config)" 
                @share="shareAdAsString(config)"
                @delete="deleteAdConfig(config.id)" 
                @click.stop 
              />
            </div>
          </div>
        </div>
        <div class="action-buttons">
          <button class="create-button" @click="createNewAd">Create New Ad</button>
          <button class="import-button" @click="openImportFromString">Import Ad</button>
        </div>
      </div>

      <!-- Edit Ad Form -->
      <AdForm v-if="currentPage === Page.EditConfig && selectedAd" :ad-data="selectedAd" :ad-types="adTypes"
        :sites="sites" :is-edit="true" @start-picking="startPicking" @save="handleSaveAdDetails" @cancel="closeAdDetails" />

      <!-- Create Ad Form -->
      <AdForm v-if="currentPage === Page.CreateConfig" :ad-data="newAd" :ad-types="adTypes" :sites="sites"
        :is-edit="false" @start-picking="startPicking" @save="handleSaveNewAd" @cancel="cancelCreateAd" />

      <!-- Message Display -->
      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>
    </div>

    <!-- Share/Import Modals -->
    <div v-if="showShareModal" class="modal-overlay" @click.self="showShareModal = false">
      <div class="modal-container">
        <ShareString 
          :config="shareConfig" 
          :isImport="false"
          @close="showShareModal = false" 
        />
      </div>
    </div>

    <div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
      <div class="modal-container">
        <ShareString 
          :isImport="true"
          @close="showImportModal = false"
          @import="handleImportFromString"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { onMounted, ref, watch } from 'vue';
import { AdForm } from './components/AdForm';
import { AdItemMenu } from './components/AdItemMenu';
import { ShareString } from './components/ShareString';

// Import services
import { 
  apiService, 
  storageService, 
  tabService, 
  sharingService 
} from './services';

// Import composables
import {
  useNetworkSettings,
  useAdConfigs,
  useElementPicker,
  useNavigation,
  useSharing,
  useDemoMode
} from './composables';

// Import types
import type { AdConfig } from './types';

export default {
  components: {
    AdForm,
    AdItemMenu,
    ShareString
  },
  setup() {
    // Initialize message state
    const message = ref('');
    const messageType = ref('');

    // Initialize composables
    const networkSettings = useNetworkSettings();
    const { 
      networkId, 
      apiKey, 
      savedValues, 
      isLoading, 
      sites, 
      adTypes, 
      loadSavedValues, 
      saveSettings 
    } = networkSettings;

    const adConfigsManager = useAdConfigs(adTypes, sites, message, messageType);
    const { 
      adConfigs, 
      selectedAd, 
      newAd, 
      loadAdConfigs, 
      toggleAdConfig, 
      deleteAdConfig, 
      saveAdDetails, 
      saveNewAd, 
      importAdConfig 
    } = adConfigsManager;

    const navigation = useNavigation(selectedAd, newAd);
    const { 
      currentPage, 
      Page, 
      navigateTo, 
      navigateBack, 
      openAdDetails, 
      closeAdDetails, 
      createNewAd, 
      cancelCreateAd 
    } = navigation;

    const sharing = useSharing(importAdConfig);
    const { 
      showShareModal, 
      showImportModal, 
      shareConfig, 
      shareAdAsString, 
      openImportFromString, 
      handleImportFromString 
    } = sharing;

    const demoManager = useDemoMode();
    const { demoMode, loadDemoMode, saveDemoMode } = demoManager;

    const elementPicker = useElementPicker(selectedAd, newAd, currentPage);
    const { isPicking, startPicking, checkForContainerValue } = elementPicker;

    // Watch for picking mode to update the document attribute
    watch(() => isPicking.value, (newValue) => {
      document.documentElement.setAttribute('data-picking', newValue.toString());
    });

    // Handler for saving ad details
    const handleSaveAdDetails = async () => {
      if (await saveAdDetails()) {
        closeAdDetails();
      }
    };

    // Handler for saving new ad
    const handleSaveNewAd = async () => {
      if (await saveNewAd()) {
        navigateTo(Page.AdConfigs);
      }
    };

    // Handler for successful settings save
    const handleSuccessfulSettingsSave = async () => {
      if (await saveSettings()) {
        // Navigate to Ad Configurations page after successful save
        navigateTo(Page.AdConfigs);
        return true;
      }
      return false;
    };

    // Initialize on mount
    onMounted(async () => {
      // Check for container value from picker
      await checkForContainerValue();
      
      // Load saved values
      await loadSavedValues();
      await loadAdConfigs();
      await loadDemoMode();
      
      // Check if network settings are configured, redirect to Settings if not
      if (!savedValues.value.networkId || !savedValues.value.apiKey) {
        navigateTo(Page.Settings);
      }
    });

    return {
      // Network settings
      networkId,
      apiKey,
      savedValues,
      isLoading,
      sites,
      adTypes,
      saveSettings,

      // Ad configs
      adConfigs,
      selectedAd,
      newAd,
      toggleAdConfig,
      deleteAdConfig,

      // Navigation
      currentPage,
      Page,
      navigateTo,
      navigateBack,
      openAdDetails,
      closeAdDetails,
      createNewAd,
      cancelCreateAd,

      // Element picker
      isPicking,
      startPicking,

      // Sharing
      showShareModal,
      showImportModal,
      shareConfig,
      shareAdAsString,
      openImportFromString,
      handleImportFromString,

      // Demo mode
      demoMode,
      saveDemoMode,

      // UI handlers
      handleSaveAdDetails,
      handleSaveNewAd,
      handleSuccessfulSettingsSave,

      // Messages
      message,
      messageType
    };
  }
};
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
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0;
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

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ad-config-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.delete {
  cursor: pointer;
  color: #e74c3c;
  font-size: 24px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.delete:hover {
  opacity: 1;
}

.delete-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
}

.toggle-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.toggle-wrapper {
  display: flex;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.create-button,
.import-button {
  flex: 1;
}

.import-button {
  background: #3182ce;
}

.import-button:hover {
  background: #2c5282;
}

.ad-config-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-container {
  width: 90%;
  max-width: 360px;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>