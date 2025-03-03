import { ref } from 'vue';
import type { AdConfig } from '../types';
import { sharingService } from '../services/sharingService';

/**
 * Composable for managing ad configuration sharing
 */
export function useSharing(importAdConfig: (config: any) => Promise<boolean>) {
  const showShareModal = ref(false);
  const showImportModal = ref(false);
  const shareConfig = ref<AdConfig | null>(null);

  /**
   * Share an ad configuration
   * @param config The ad configuration to share
   */
  const shareAdAsString = (config: AdConfig) => {
    shareConfig.value = { ...config };
    showShareModal.value = true;
  };

  /**
   * Open the import modal
   */
  const openImportFromString = () => {
    showImportModal.value = true;
  };

  /**
   * Handle importing an ad configuration from a string
   * @param importedConfig The imported configuration object
   */
  const handleImportFromString = async (importedConfig: any): Promise<boolean> => {
    try {
      // Validate the configuration
      if (!sharingService.validateAdConfig(importedConfig)) {
        throw new Error('Invalid configuration format');
      }

      // Process the import
      return await importAdConfig(importedConfig);
    } catch (error) {
      console.error('Import error:', error);
      return false;
    }
  };

  return {
    showShareModal,
    showImportModal,
    shareConfig,
    shareAdAsString,
    openImportFromString,
    handleImportFromString
  };
}