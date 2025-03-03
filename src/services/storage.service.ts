import type { AdConfig } from '../types';

/**
 * Service for interacting with Chrome storage
 */
export class StorageService {
  /**
   * Save network settings to Chrome sync storage
   * @param networkId - The Kevel network ID
   * @param apiKey - The Kevel API key
   * @returns A promise that resolves when the settings are saved
   */
  saveNetworkSettings(networkId: string, apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({
        networkId,
        apiKey
      }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Load network settings from Chrome sync storage
   * @returns A promise that resolves to the network settings
   */
  loadNetworkSettings(): Promise<{ networkId: string; apiKey: string }> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['networkId', 'apiKey'], (result) => {
        resolve({
          networkId: result.networkId || '',
          apiKey: result.apiKey || ''
        });
      });
    });
  }

  /**
   * Save ad configurations to Chrome sync storage
   * @param adConfigs - The ad configurations to save
   * @returns A promise that resolves when the configurations are saved
   */
  saveAdConfigs(adConfigs: AdConfig[]): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({
        adConfigs
      }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Load ad configurations from Chrome sync storage
   * @returns A promise that resolves to the ad configurations
   */
  loadAdConfigs(): Promise<AdConfig[]> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['adConfigs'], (result) => {
        const loadedAdConfigs: AdConfig[] = result.adConfigs ? Object.values(result.adConfigs) : [];
        resolve(loadedAdConfigs);
      });
    });
  }

  /**
   * Save demo mode setting to Chrome sync storage
   * @param enabled - Whether demo mode is enabled
   * @returns A promise that resolves when the setting is saved
   */
  saveDemoMode(enabled: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({
        demoMode: enabled
      }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Load demo mode setting from Chrome sync storage
   * @returns A promise that resolves to whether demo mode is enabled
   */
  loadDemoMode(): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['demoMode'], (result) => {
        resolve(result.demoMode || false);
      });
    });
  }

  /**
   * Save element picker state to Chrome local storage
   * @param state - The element picker state
   * @returns A promise that resolves when the state is saved
   */
  savePickerState(state: any): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ pickerState: state }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Get container value from Chrome local storage
   * @returns A promise that resolves to the container value data
   */
  getContainerValue(): Promise<{ value: string; timestamp: number; pickerState: any } | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['directContainerValue', 'directContainerTimestamp', 'pickerState'], (result) => {
        if (result.directContainerValue && result.directContainerTimestamp) {
          const ageInMs = Date.now() - result.directContainerTimestamp;
          
          // Only use if less than 5 seconds old
          if (ageInMs < 5000) {
            resolve({
              value: result.directContainerValue,
              timestamp: result.directContainerTimestamp,
              pickerState: result.pickerState
            });
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Clear container value from Chrome local storage
   * @returns A promise that resolves when the value is cleared
   */
  clearContainerValue(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove(['directContainerValue', 'directContainerTimestamp'], () => {
        resolve();
      });
    });
  }
}

// Create a singleton instance for use throughout the app
export const storageService = new StorageService();