import { ref } from 'vue';
import { apiService } from '../services/api.service';
import { storageService } from '../services/storage.service';
import type { Site, AdType } from '../types';

/**
 * Composable for managing network settings
 */
export function useNetworkSettings() {
  const networkId = ref('');
  const apiKey = ref('');
  const savedValues = ref({ networkId: '', apiKey: '' });
  const isLoading = ref(false);
  const message = ref('');
  const messageType = ref('');
  const sites = ref<Site[]>([]);
  const adTypes = ref<AdType[]>([]);

  /**
   * Load saved network settings
   */
  const loadSavedValues = async () => {
    try {
      const settings = await storageService.loadNetworkSettings();
      networkId.value = settings.networkId;
      apiKey.value = settings.apiKey;
      savedValues.value = settings;

      if (settings.apiKey && settings.networkId) {
        fetchNetworkDetails(settings.apiKey);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  /**
   * Fetch sites and ad types from the API
   */
  const fetchNetworkDetails = async (key: string): Promise<{ valid: boolean; message: string } | undefined> => {
    try {
      sites.value = await apiService.getSites(key);
      adTypes.value = await apiService.getAdTypes(key);
    } catch (error) {
      console.error('Error fetching network details:', error);
      if ((error as { name: string }).name === 'UnauthorizedError') {
        return {
          valid: false,
          message: 'The API Key is not authorized.'
        };
      }
      return {
        valid: false,
        message: 'Error communicating with the Kevel API'
      };
    }
  };

  /**
   * Validate network settings input
   */
  const validateSettingsInput = async (): Promise<{ valid: boolean; message: string }> => {
    // Check if both fields are filled
    if (!networkId.value || !apiKey.value) {
      return {
        valid: false,
        message: 'Both Network ID and API Key are required'
      };
    }

    // Check if networkId is numeric
    if (!/^\d+$/.test(networkId.value)) {
      return {
        valid: false,
        message: 'Network ID must be numeric'
      };
    }
    
    // Fetch network details to validate the API key
    const fetchError = await fetchNetworkDetails(apiKey.value);
    if (fetchError !== undefined) {
      return fetchError;
    }
    
    return { valid: true, message: '' };
  };

  /**
   * Save network settings
   */
  const saveSettings = async (): Promise<boolean> => {
    isLoading.value = true;
    
    try {
      // Validate settings
      const validation = await validateSettingsInput();
      
      if (!validation.valid) {
        message.value = validation.message;
        messageType.value = 'error';
        setTimeout(() => {
          message.value = '';
        }, 3000);
        return false;
      }
      
      // Save settings
      await storageService.saveNetworkSettings(networkId.value, apiKey.value);
      
      message.value = 'Settings saved successfully!';
      messageType.value = 'success';
      
      // Reload saved values
      await loadSavedValues();
      
      setTimeout(() => {
        message.value = '';
      }, 3000);
      
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      message.value = 'Error saving settings';
      messageType.value = 'error';
      setTimeout(() => {
        message.value = '';
      }, 3000);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    networkId,
    apiKey,
    savedValues,
    isLoading,
    message,
    messageType,
    sites,
    adTypes,
    loadSavedValues,
    fetchNetworkDetails,
    validateSettingsInput,
    saveSettings
  };
}