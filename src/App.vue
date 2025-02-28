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
            <button @click="saveSettings" :disabled="isLoading"> {{ isLoading ? 'Saving...' : 'Save' }} </button>
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
              <AdItemMenu @edit="openAdDetails(config)" @export="exportAdAsJson(config)"
                @delete="deleteAdConfig(config.id)" @click.stop />
            </div>
          </div>
        </div>
        <div class="action-buttons">
          <button class="create-button" @click="createNewAd">Create New Ad</button>
          <button class="import-button" @click="openImportFile">Import Ad</button>

          <input type="file" ref="fileInput" @change="handleFileSelect" accept=".json" style="display: none" />
        </div>
      </div>

      <AdForm v-if="currentPage === Page.EditConfig && selectedAd" :ad-data="selectedAd" :ad-types="adTypes"
        :sites="sites" :is-edit="true" @start-picking="startPicking" @save="saveAdDetails" @cancel="closeAdDetails" />

      <AdForm v-if="currentPage === Page.CreateConfig" :ad-data="newAd" :ad-types="adTypes" :sites="sites"
        :is-edit="false" @start-picking="startPicking" @save="saveNewAd" @cancel="cancelCreateAd" />

      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Ref, ref, onMounted, watch } from '@vue/runtime-core'
import { AdForm } from './components/AdForm'
import { AdItemMenu } from './components/AdItemMenu'
import { ImportFromFile } from './components/ImportFromFile'
import type { Site, AdType, AdConfig, KevelAPIResponse, SiteResponse, AdTypeResponse } from '../src/types'

interface SavedFormState {
  page: Page;
  formData: {
    selectedAd: AdConfig | null;
    newAd: AdConfig | null;
  };
}

class KevelApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'KevelApiError';
  }
}

class UnauthorizedError extends KevelApiError {
  constructor(message: string = 'Invalid API key') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

enum Page {
  Settings = "settings",
  AdConfigs = "adConfigs",
  EditConfig = "editConfig",
  CreateConfig = "createConfig"
}


async function getSites(apiKey: string): Promise<Site[]> {
  const response = await new Promise<KevelAPIResponse<SiteResponse>>(resolve => {
    chrome.runtime.sendMessage({
      type: 'site',
      apiKey: apiKey
    }, resolve);
  });

  if (!response.success) {
    if (response.status === 403) {
      throw new UnauthorizedError();
    }
    throw new KevelApiError(response.status || 500, response.error || 'Unknown error');
  }

  // Type guard to ensure data and items exist
  if (!response.data?.items) {
    throw new KevelApiError(500, 'Invalid response format');
  }

  return response.data.items.map((x) => ({
    id: x.Id,
    name: x.Title
  }));
}


async function getAdTypes(apiKey: string): Promise<AdType[]> {
  const response = await new Promise<KevelAPIResponse<AdTypeResponse>>(resolve => {
    chrome.runtime.sendMessage({
      type: 'adtypes',
      apiKey: apiKey
    }, resolve);
  });

  if (!response.success) {
    if (response.status === 403) {
      throw new UnauthorizedError();
    }
    throw new KevelApiError(response.status || 500, response.error || 'Unknown error');
  }

  if (!response.data?.items) {
    throw new KevelApiError(500, 'Invalid response format');
  }

  // TODO: It's currently limited by pagination.
  return response.data.items.map(x => {
    return {
      id: x.Id,
      name: x.Name,
      height: x.Height,
      width: x.Width
    }
  })

}

interface Setup {
  saveSettings: () => Promise<void>;
  navigateTo: (page: Page) => void;
  navigateBack: () => void;
  toggleAdConfig: (id: number) => void;
  createNewAd: () => void;
  cancelCreateAd: () => void;
  saveNewAd: () => void;
  saveAdDetails: () => void;
  openAdDetails: (config: AdConfig) => void;
  closeAdDetails: () => void;
  deleteAdConfig: (id: number) => void;
  saveDemoMode: () => void;
  cancelPicking: () => void;
  startPicking: () => void;
  saveFormState: () => void;
  restoreFormState: () => void;
  exportAdAsJson: (config: AdConfig) => void;
  openImportDialog: () => void;
  handleImportedConfig: (config: any) => void;
  openImportFile: () => void;
  handleFileSelect: (event: Event) => void;
  fileInput: Ref<HTMLInputElement | null>;
  importFileRef: Ref<{ openFileDialog: () => void } | null>;
  isPicking: Ref<boolean>;
  networkId: Ref<string>;
  apiKey: Ref<string>;
  message: Ref<string>;
  messageType: Ref<string>;
  savedValues: Ref<{
    networkId: string;
    apiKey: string;
  }>;
  adConfigs: Ref<AdConfig[]>;
  adTypes: Ref<AdType[]>;
  sites: Ref<Site[]>;
  selectedAd: Ref<AdConfig | null>;
  currentPage: Ref<Page>;
  Page: typeof Page;
  isLoading: Ref<boolean>;
  newAd: Ref<AdConfig>;
  demoMode: Ref<boolean>;
}

const getEmptyNewAd = (): AdConfig => ({
  id: 0,
  name: '',
  adType: { id: 0, name: '', width: 0, height: 0 },
  site: { id: 0, name: '' },
  url: '',
  isActive: false,
  divId: '',
  keywordQueryParam: ''
})

export default {
  components: {
    AdForm,
    AdItemMenu,
    ImportFromFile
  },
  setup(): Setup {
    const networkId = ref('')
    const apiKey = ref('')
    const message = ref('')
    const messageType = ref('')
    const fileInput = ref<HTMLInputElement | null>(null);
    const isPicking = ref(false)
    const savedValues = ref({ networkId: '', apiKey: '' })
    const currentPage = ref<Page>(Page.AdConfigs)
    const lastPage = ref<Page>(Page.AdConfigs)
    const adTypes = ref<AdType[]>([])
    const sites = ref<Site[]>([])
    const isLoading = ref(false)
    const adConfigs = ref<AdConfig[]>([])
    const newAd = ref<AdConfig>(getEmptyNewAd())
    const selectedAd = ref<AdConfig | null>(null)

    const navigateTo = (page: Page) => {
      lastPage.value = currentPage.value;
      currentPage.value = page;
    }

    const navigateBack = () => {
      currentPage.value = lastPage.value;
      lastPage.value = currentPage.value;
    }

    const openAdDetails = (config: AdConfig) => {
      selectedAd.value = { ...config }
      navigateTo(Page.EditConfig);
    }

    const closeAdDetails = () => {
      selectedAd.value = null
      navigateTo(Page.AdConfigs);
    }

    const saveFormState = () => {
      const state: SavedFormState = {
        page: currentPage.value,
        formData: {
          selectedAd: selectedAd.value ? { ...selectedAd.value } : null,
          newAd: currentPage.value === Page.CreateConfig ? { ...newAd.value } : null
        }
      };

      // Save to chrome.storage
      chrome.storage.local.set({ savedFormState: state }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving form state:', chrome.runtime.lastError);
        }
      });
    };

    const startPicking = () => {
      // Save the current page and form state with more detailed info
      const currentState = {
        page: currentPage.value,
        editAd: selectedAd.value ? JSON.parse(JSON.stringify(selectedAd.value)) : null,
        newAd: currentPage.value === Page.CreateConfig ? JSON.parse(JSON.stringify(newAd.value)) : null
      };

      // Log the state we're saving
      console.log('Saving picker state:', currentState);

      // Store current state in local storage
      chrome.storage.local.set({ pickerState: currentState }, () => {
        console.log('Picker state saved to storage');
      });

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          // Send message to activate picker
          chrome.tabs.sendMessage(tabs[0].id, { action: 'startPicking' }, (response) => {
            if (response && response.status === 'activated') {
              console.log('Picker activated, closing popup');
              window.close();
            } else {
              console.error('Failed to activate picker');
            }
          });
        }
      });
    };

    const restoreFormState = () => {
      chrome.storage.local.get(['savedFormState'], (result) => {
        if (result.savedFormState) {
          const state = result.savedFormState as SavedFormState;

          // Restore page
          currentPage.value = state.page;

          // Restore form data
          if (state.formData.selectedAd) {
            selectedAd.value = state.formData.selectedAd;
          }
          if (state.formData.newAd && state.page === Page.CreateConfig) {
            newAd.value = state.formData.newAd;
          }

          // Clear saved state after restoring
          chrome.storage.local.remove(['savedFormState']);
        }
      });
    };

    watch(() => isPicking.value, (newValue: boolean) => {
      document.documentElement.setAttribute('data-picking', newValue.toString());
    });

    const fetchNetworkDetails = async (apiKey: string) => {
      try {
        sites.value = await getSites(apiKey);
        adTypes.value = await getAdTypes(apiKey)
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          // Handle unauthorized case specifically
          return {
            valid: false,
            message: 'The API Key is not authorized.'
          }
        }
        return {
          valid: false,
          message: 'Error communicating with the Kevel API'
        }
      }
    }

    // Validation function
    const validateSettingsInput = async (): Promise<{ valid: boolean; message: string }> => {
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
      const fetchError = await fetchNetworkDetails(apiKey.value)
      if (fetchError !== undefined) {
        return fetchError
      }
      return { valid: true, message: '' }
    }

    const loadSavedValues = () => {
      chrome.storage.sync.get(['networkId', 'apiKey', 'adConfigs'], (result) => {
        console.log('Loaded values:', result)
        const loadedNetworkId = result.networkId || ''
        const loadedApiKey = result.apiKey || ''
        const loadedAdConfigs: AdConfig[] = result.adConfigs ? Object.values(result.adConfigs) : [];

        networkId.value = loadedNetworkId
        apiKey.value = loadedApiKey
        adConfigs.value = loadedAdConfigs

        savedValues.value = {
          networkId: loadedNetworkId,
          apiKey: loadedApiKey
        }

        if (!loadedApiKey || !loadedNetworkId) {
          navigateTo(Page.Settings)
        } else {
          fetchNetworkDetails(apiKey.value)
        }
      })
    }

    const createNewAd = () => {
      newAd.value = getEmptyNewAd();
      navigateTo(Page.CreateConfig)
    }

    const exportAdAsJson = (config: AdConfig) => {
      try {
        // Create a clone of the config to export
        const configToExport = { ...config }

        // Convert to JSON string
        const jsonString = JSON.stringify(configToExport, null, 2)

        // Create blob and trigger download
        const blob = new Blob([jsonString], { type: 'application/json' })
        const url = URL.createObjectURL(blob)

        const a = document.createElement('a')
        a.href = url
        a.download = `${config.name.replace(/\s+/g, '-').toLowerCase()}.json`
        document.body.appendChild(a)
        a.click()

        // Cleanup
        setTimeout(() => {
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }, 100)

        message.value = 'Ad configuration exported successfully'
        messageType.value = 'success'

        setTimeout(() => {
          message.value = ''
        }, 3000)
      } catch (error) {
        console.error('Export error:', error)
        message.value = 'Error exporting ad configuration'
        messageType.value = 'error'

        setTimeout(() => {
          message.value = ''
        }, 3000)
      }
    }

    const openImportFile = () => {
      // Reset the input to ensure the change event fires even if the same file is selected
      if (fileInput.value) {
        fileInput.value.value = '';
        fileInput.value.click();
      }
    }

    const handleFileSelect = (event: Event) => {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];

      if (!file) {
        message.value = 'No file selected';
        messageType.value = 'error';
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importedConfig = JSON.parse(content);

          // Get config from array if needed
          const config = Array.isArray(importedConfig) ? importedConfig[0] : importedConfig;

          // Basic validation
          if (!config || !config.name || !config.adType || !config.site || !config.url || !config.divId) {
            message.value = 'Invalid configuration format';
            messageType.value = 'error';
            return;
          }

          // Generate new ID
          const newId = Math.max(0, ...adConfigs.value.map((ad: AdConfig) => ad.id)) + 1;

          // Find or fallback to default ad type
          let adType = adTypes.value.find(t =>
            t.name === config.adType.name &&
            t.width === config.adType.width &&
            t.height === config.adType.height
          );

          if (!adType && adTypes.value.length > 0) {
            adType = adTypes.value[0];
          }

          // Find or fallback to default site
          let site = sites.value.find(s => s.name === config.site.name);
          if (!site && sites.value.length > 0) {
            site = sites.value[0];
          }

          // Require valid type and site
          if (!adType || !site) {
            message.value = 'Could not match ad type or site. Please configure network settings first.';
            messageType.value = 'error';
            return;
          }

          // Create final config
          const finalConfig: AdConfig = {
            id: newId,
            name: config.name,
            adType: adType,
            site: site,
            url: config.url,
            divId: config.divId,
            isActive: config.isActive ?? true,
            keywordQueryParam: config.keywordQueryParam || ''
          };

          // Add to configs and save
          adConfigs.value.push(finalConfig);
          saveAdConfigsToStorage();

          message.value = 'Ad configuration imported successfully';
          messageType.value = 'success';
        } catch (error) {
          console.error('Import error:', error);
          message.value = 'Error parsing JSON file';
          messageType.value = 'error';
        }

        // Clear the message after 3 seconds
        setTimeout(() => {
          message.value = '';
        }, 3000);
      };

      reader.onerror = () => {
        message.value = 'Error reading file';
        messageType.value = 'error';
      };

      reader.readAsText(file);
    }
    const cancelCreateAd = () => {
      navigateTo(Page.AdConfigs)
    }

    const saveAdConfigsToStorage = () => {
      chrome.storage.sync.set({
        adConfigs: adConfigs.value
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Save error:', chrome.runtime.lastError)
          message.value = 'Error saving ad configurations'
          messageType.value = 'error'
        } else {
          message.value = 'Ad configurations saved successfully!'
          messageType.value = 'success'
        }
        // Clear message after 3 seconds
        setTimeout(() => {
          message.value = ''
        }, 3000)
      })
    }

    const saveNewAd = () => {
      const newId = Math.max(0, ...adConfigs.value.map((ad: AdConfig) => ad.id)) + 1
      const selectedAdType = adTypes.value.find((type: AdType) => type.id === newAd.value.adType.id)
      const selectedSite = sites.value.find((site: Site) => site.id === newAd.value.site.id)

      if (!selectedAdType || !selectedSite) {
        message.value = 'Please select both ad type and site'
        messageType.value = 'error'
        return
      }

      const finalAdConfig: AdConfig = {
        ...newAd.value,
        id: newId,
        adType: selectedAdType,
        site: selectedSite
      }

      adConfigs.value.push(finalAdConfig)
      saveAdConfigsToStorage()

      // Refresh tabs matching the URL pattern if the ad is active
      if (finalAdConfig.url && finalAdConfig.isActive) {
        chrome.runtime.sendMessage({
          type: 'adSaved',
          url: finalAdConfig.url
        });
      }

      navigateTo(Page.AdConfigs)
    }

    // Updated saveAdDetails function - with dimension fix and simplified refresh
    const saveAdDetails = () => {
      if (!selectedAd.value) return

      // Find the complete ad type based on the selected ID
      const selectedAdType = adTypes.value.find((type: AdType) => type.id === selectedAd.value?.adType.id)
      const selectedSite = sites.value.find((site: Site) => site.id === selectedAd.value?.site.id)

      // If we can't find a matching ad type or site, show an error
      if (!selectedAdType || !selectedSite) {
        message.value = 'Please select both ad type and site'
        messageType.value = 'error'
        return
      }

      // Create the updated config with the complete ad type and site info
      const updatedAdConfig: AdConfig = {
        ...selectedAd.value,
        adType: selectedAdType, // Use the complete ad type with dimensions
        site: selectedSite
      }

      // Update the array with the correct index
      const index = adConfigs.value.findIndex((ad: AdConfig) => ad.id === selectedAd.value?.id)
      if (index !== -1) {
        adConfigs.value[index] = updatedAdConfig
        saveAdConfigsToStorage()

        // Refresh tabs matching the URL pattern if the ad is active
        if (updatedAdConfig.url && updatedAdConfig.isActive) {
          chrome.runtime.sendMessage({
            type: 'adSaved',
            url: updatedAdConfig.url
          });
        }
      }

      closeAdDetails()
    }
    const deleteAdConfig = (id: number) => {
      const index = adConfigs.value.findIndex((ad: AdConfig) => ad.id === id)
      if (index !== -1) {
        adConfigs.value.splice(index, 1)
        saveAdConfigsToStorage()
      }
    }

    const toggleAdConfig = (id: number) => {
      const config = adConfigs.value.find((c: AdConfig) => c.id === id)
      if (config) {
        config.isActive = !config.isActive
        saveAdConfigsToStorage()
        chrome.runtime.sendMessage({
          type: 'configToggled',
          url: config.url
        });
      }
    }

    const saveSettings = async () => {
      // Validate before saving
      isLoading.value = true
      const validation = await validateSettingsInput()

      if (!validation.valid) {
        message.value = validation.message
        messageType.value = 'error'
        setTimeout(() => {
          message.value = ''
        }, 3000)
        isLoading.value = false
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
          loadSavedValues(); // Reload the saved values
          navigateBack();
        }
        isLoading.value = false
        // Clear message after 3 seconds
        setTimeout(() => {
          message.value = ''
        }, 3000)
      })
    }

    const demoMode = ref(false)

    // Load demo mode setting
    const loadDemoMode = () => {
      chrome.storage.sync.get(['demoMode'], (result) => {
        demoMode.value = result.demoMode || false
      })
    }

    const saveDemoMode = () => {
      chrome.storage.sync.set({
        demoMode: demoMode.value
      })

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.reload(tabs[0].id);
        }
      });
    }

    const cancelPicking = () => {
      isPicking.value = false;
    }

    onMounted(() => {
      // Before doing any other loading, check for direct container value
      chrome.storage.local.get(['directContainerValue', 'directContainerTimestamp', 'pickerState'], (result) => {
        console.log('[App] Found on mount:', result);

        // If we have a direct container value that's fresh (less than 5 seconds old)
        if (result.directContainerValue && result.directContainerTimestamp) {
          const ageInMs = Date.now() - result.directContainerTimestamp;
          if (ageInMs < 5000) { // Only use if less than 5 seconds old
            console.log('[App] Found fresh direct container value:', result.directContainerValue);

            // We need to restore the page first from pickerState
            if (result.pickerState && result.pickerState.page) {
              console.log('[App] Restoring page from picker state:', result.pickerState.page);
              currentPage.value = result.pickerState.page;

              // Then restore the appropriate form data
              if (result.pickerState.page === Page.EditConfig && result.pickerState.editAd) {
                selectedAd.value = result.pickerState.editAd;
                console.log('[App] Restored edit ad');

                // Finally apply the container value
                if (selectedAd.value) {
                  selectedAd.value.divId = result.directContainerValue;
                  console.log('[App] Applied container to edit ad:', result.directContainerValue);
                }
              } else if (result.pickerState.page === Page.CreateConfig && result.pickerState.newAd) {
                newAd.value = result.pickerState.newAd;
                console.log('[App] Restored new ad');

                // Apply container value
                newAd.value.divId = result.directContainerValue;
                console.log('[App] Applied container to new ad:', result.directContainerValue);
              }
            }

            // Clean up storage
            chrome.storage.local.remove(['directContainerValue', 'directContainerTimestamp']);
          } else {
            console.log('[App] Direct container value too old, not using');
          }
        }

        // Continue with normal loading
        loadSavedValues();
        loadDemoMode();
      });
    });

    return {
      networkId,
      apiKey,
      message,
      messageType,
      savedValues,
      saveSettings,
      navigateTo,
      deleteAdConfig,
      navigateBack,
      saveNewAd,
      adConfigs,
      toggleAdConfig,
      createNewAd,
      cancelCreateAd,
      adTypes,
      sites,
      selectedAd,
      openAdDetails,
      closeAdDetails,
      saveAdDetails,
      currentPage,
      Page,
      isLoading,
      newAd,
      demoMode,
      saveDemoMode,
      isPicking,
      cancelPicking,
      startPicking,
      saveFormState,
      restoreFormState,
      exportAdAsJson,
      fileInput,
      openImportFile,
      handleFileSelect,
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
</style>