import { ref, Ref } from 'vue';
import { storageService } from '../services/storageService';
import { tabService } from '../services/tabService';
import type { AdConfig } from '../types';

/**
 * Composable for managing the element picker functionality
 */
export function useElementPicker(
  selectedAd: Ref<AdConfig | null>,
  newAd: Ref<AdConfig>,
  currentPage: Ref<string>
) {
  const isPicking = ref(false);

  /**
   * Start the element picker
   * This saves the current state and activates the picker in the current tab
   */
  const startPicking = async () => {
    try {
      // Save the current page and form state
      const currentState = {
        page: currentPage.value,
        editAd: selectedAd.value ? JSON.parse(JSON.stringify(selectedAd.value)) : null,
        newAd: currentPage.value === 'createConfig' ? JSON.parse(JSON.stringify(newAd.value)) : null
      };

      // Save the state to storage
      await storageService.savePickerState(currentState);
      
      // Set picking mode and activate the picker
      isPicking.value = true;
      await tabService.activateElementPicker();
    } catch (error) {
      console.error('Error starting picker:', error);
      isPicking.value = false;
    }
  };

  /**
   * Check for and apply container values from the picker
   */
  const checkForContainerValue = async () => {
    try {
      const containerData = await storageService.getContainerValue();
      
      if (containerData) {
        console.log('[ElementPicker] Found container value:', containerData.value);
        
        // Restore the page from picker state
        if (containerData.pickerState?.page) {
          currentPage.value = containerData.pickerState.page;
          
          // Apply container value to the appropriate form
          if (currentPage.value === 'editConfig' && containerData.pickerState.editAd) {
            selectedAd.value = containerData.pickerState.editAd;
            if (selectedAd.value) {
              selectedAd.value.divId = containerData.value;
            }
          } else if (currentPage.value === 'createConfig' && containerData.pickerState.newAd) {
            newAd.value = containerData.pickerState.newAd;
            newAd.value.divId = containerData.value;
          }
        }
        
        // Clean up
        await storageService.clearContainerValue();
      }
    } catch (error) {
      console.error('Error checking for container value:', error);
    } finally {
      isPicking.value = false;
    }
  };

  /**
   * Cancel the element picker
   */
  const cancelPicking = () => {
    isPicking.value = false;
  };

  return {
    isPicking,
    startPicking,
    checkForContainerValue,
    cancelPicking
  };
}