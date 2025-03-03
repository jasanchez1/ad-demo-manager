import { ref, Ref } from 'vue';
import type { AdConfig } from '../types';

export enum Page {
  Settings = "settings",
  AdConfigs = "adConfigs",
  EditConfig = "editConfig",
  CreateConfig = "createConfig"
}

/**
 * Composable for managing application navigation
 */
export function useNavigation(selectedAd: Ref<AdConfig | null>, newAd: Ref<AdConfig>) {
  const currentPage = ref<Page>(Page.AdConfigs);
  const lastPage = ref<Page>(Page.AdConfigs);

  /**
   * Navigate to a specific page
   */
  const navigateTo = (page: Page) => {
    lastPage.value = currentPage.value;
    currentPage.value = page;
  };

  /**
   * Navigate back to the previous page
   */
  const navigateBack = () => {
    currentPage.value = lastPage.value;
    lastPage.value = currentPage.value;
  };

  /**
   * Open ad details for editing
   */
  const openAdDetails = (config: AdConfig) => {
    selectedAd.value = { ...config };
    navigateTo(Page.EditConfig);
  };

  /**
   * Close ad details and return to the ad configs list
   */
  const closeAdDetails = () => {
    selectedAd.value = null;
    navigateTo(Page.AdConfigs);
  };

  /**
   * Navigate to create a new ad
   */
  const createNewAd = () => {
    navigateTo(Page.CreateConfig);
  };

  /**
   * Cancel ad creation and return to the ad configs list
   */
  const cancelCreateAd = () => {
    navigateTo(Page.AdConfigs);
  };

  return {
    currentPage,
    navigateTo,
    navigateBack,
    openAdDetails,
    closeAdDetails,
    createNewAd,
    cancelCreateAd,
    Page
  };
}