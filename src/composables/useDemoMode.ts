import { ref } from 'vue';
import { storageService } from '../services/storageService';
import { tabService } from '../services/tabService';

/**
 * Composable for managing demo mode
 */
export function useDemoMode() {
  const demoMode = ref(false);

  /**
   * Load demo mode setting
   */
  const loadDemoMode = async () => {
    try {
      demoMode.value = await storageService.loadDemoMode();
    } catch (error) {
      console.error('Error loading demo mode:', error);
    }
  };

  /**
   * Save demo mode setting
   */
  const saveDemoMode = async () => {
    try {
      await storageService.saveDemoMode(demoMode.value);
      await tabService.refreshActiveTab();
    } catch (error) {
      console.error('Error saving demo mode:', error);
    }
  };

  return {
    demoMode,
    loadDemoMode,
    saveDemoMode
  };
}