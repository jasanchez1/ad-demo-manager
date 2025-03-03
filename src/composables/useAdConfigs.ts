import { ref, Ref } from "vue";
import { storageService } from "../services/storage.service";
import { tabService } from "../services/tab.service";
import type { AdConfig, AdType, Site } from "../types";

/**
 * Get an empty ad configuration
 */
export const getEmptyAdConfig = (): AdConfig => ({
  id: 0,
  name: "",
  adType: { id: 0, name: "", width: 0, height: 0 },
  site: { id: 0, name: "" },
  url: "",
  isActive: false,
  divId: "",
  keywordQueryParam: "",
});

/**
 * Composable for managing ad configurations
 */
export function useAdConfigs(
  adTypes: Ref<AdType[]>,
  sites: Ref<Site[]>,
  message: Ref<string>,
  messageType: Ref<string>
) {
  const adConfigs = ref<AdConfig[]>([]);
  const selectedAd = ref<AdConfig | null>(null);
  const newAd = ref<AdConfig>(getEmptyAdConfig());

  /**
   * Load ad configurations from storage
   */
  const loadAdConfigs = async () => {
    try {
      adConfigs.value = await storageService.loadAdConfigs();
    } catch (error) {
      console.error("Error loading ad configs:", error);
    }
  };

  /**
   * Save ad configurations to storage
   */
  const saveAdConfigsToStorage = async () => {
    try {
      await storageService.saveAdConfigs(adConfigs.value);
      message.value = "Ad configurations saved successfully!";
      messageType.value = "success";
      setTimeout(() => {
        message.value = "";
      }, 3000);
    } catch (error) {
      console.error("Save error:", error);
      message.value = "Error saving ad configurations";
      messageType.value = "error";
      setTimeout(() => {
        message.value = "";
      }, 3000);
    }
  };

  /**
   * Toggle ad configuration active state
   */
  const toggleAdConfig = async (id: number) => {
    const config = adConfigs.value.find((c: AdConfig) => c.id === id);
    if (config) {
      config.isActive = !config.isActive;
      await saveAdConfigsToStorage();
      tabService.refreshTabsMatchingUrl(config.url);
    }
  };

  /**
   * Delete ad configuration
   */
  const deleteAdConfig = async (id: number) => {
    const index = adConfigs.value.findIndex((ad: AdConfig) => ad.id === id);
    if (index !== -1) {
      adConfigs.value.splice(index, 1);
      await saveAdConfigsToStorage();
    }
  };

  /**
   * Save changes to an existing ad configuration
   */
  const saveAdDetails = async () => {
    if (!selectedAd.value) return false;

    // Find the complete ad type and site based on the selected IDs
    const selectedAdType = adTypes.value.find(
      (type: AdType) => type.id === selectedAd.value?.adType.id
    );
    const selectedSite = sites.value.find(
      (site: Site) => site.id === selectedAd.value?.site.id
    );

    // Validate
    if (!selectedAdType || !selectedSite) {
      message.value = "Please select both ad type and site";
      messageType.value = "error";
      return false;
    }

    // Create the updated config
    const updatedAdConfig: AdConfig = {
      ...selectedAd.value,
      adType: selectedAdType,
      site: selectedSite,
    };

    // Update the array
    const index = adConfigs.value.findIndex(
      (ad: AdConfig) => ad.id === selectedAd.value?.id
    );
    if (index !== -1) {
      adConfigs.value[index] = updatedAdConfig;
      await saveAdConfigsToStorage();

      // Refresh tabs if the ad is active
      if (updatedAdConfig.url && updatedAdConfig.isActive) {
        tabService.refreshTabsMatchingUrl(updatedAdConfig.url);
      }

      return true;
    }

    return false;
  };

  /**
   * Save a new ad configuration
   */
  const saveNewAd = async () => {
    // Generate a new ID
    const newId =
      Math.max(0, ...adConfigs.value.map((ad: AdConfig) => ad.id)) + 1;

    // Find the selected ad type and site
    const selectedAdType = adTypes.value.find(
      (type: AdType) => type.id === newAd.value.adType.id
    );
    const selectedSite = sites.value.find(
      (site: Site) => site.id === newAd.value.site.id
    );

    // Validate
    if (!selectedAdType || !selectedSite) {
      message.value = "Please select both ad type and site";
      messageType.value = "error";
      return false;
    }

    // Create the final config
    const finalAdConfig: AdConfig = {
      ...newAd.value,
      id: newId,
      adType: selectedAdType,
      site: selectedSite,
    };

    // Add to the list and save
    adConfigs.value.push(finalAdConfig);
    await saveAdConfigsToStorage();

    // Refresh tabs if the ad is active
    if (finalAdConfig.url && finalAdConfig.isActive) {
      tabService.refreshTabsMatchingUrl(finalAdConfig.url);
    }

    return true;
  };

  /**
   * Import an ad configuration from a share string
   */
  const importAdConfig = async (importedConfig: any) => {
    try {
      // Find or fallback to default ad type
      let adType = adTypes.value.find(
        (t: AdType) =>
          t.name === importedConfig.adType.name &&
          t.width === importedConfig.adType.width &&
          t.height === importedConfig.adType.height
      );

      if (!adType && adTypes.value.length > 0) {
        adType = adTypes.value[0];
      }

      // Find or fallback to default site
      let site = sites.value.find(
        (s: Site) => s.name === importedConfig.site.name
      );
      if (!site && sites.value.length > 0) {
        site = sites.value[0];
      }

      // Validate
      if (!adType || !site) {
        message.value =
          "Could not match ad type or site. Please configure network settings first.";
        messageType.value = "error";
        return false;
      }

      // Generate new ID
      const newId =
        Math.max(0, ...adConfigs.value.map((ad: AdConfig) => ad.id)) + 1;

      // Create final config
      const finalConfig: AdConfig = {
        id: newId,
        name: importedConfig.name,
        adType: adType,
        site: site,
        url: importedConfig.url,
        divId: importedConfig.divId,
        isActive: importedConfig.isActive ?? false, // Default to inactive for safety
        keywordQueryParam: importedConfig.keywordQueryParam || "",
      };

      // Add to configs and save
      adConfigs.value.push(finalConfig);
      await saveAdConfigsToStorage();

      message.value = "Ad configuration imported successfully!";
      messageType.value = "success";
      setTimeout(() => {
        message.value = "";
      }, 3000);

      return true;
    } catch (error) {
      console.error("Error importing config:", error);
      message.value = "Error importing configuration";
      messageType.value = "error";
      setTimeout(() => {
        message.value = "";
      }, 3000);
      return false;
    }
  };

  return {
    adConfigs,
    selectedAd,
    newAd,
    loadAdConfigs,
    saveAdConfigsToStorage,
    toggleAdConfig,
    deleteAdConfig,
    saveAdDetails,
    saveNewAd,
    importAdConfig,
  };
}
