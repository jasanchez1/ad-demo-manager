/**
 * Service for interacting with Chrome tabs
 */
export class TabService {
    /**
     * Refresh tabs that match a URL pattern
     * @param urlPattern - The URL pattern to match
     * @returns A promise that resolves to the number of tabs refreshed
     */
    refreshTabsMatchingUrl(urlPattern: string): Promise<number> {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({
          type: 'adSaved',
          url: urlPattern
        }, (response) => {
          resolve(response?.refreshedCount || 0);
        });
      });
    }
  
    /**
     * Activate the element picker in the current tab
     * @returns A promise that resolves when the picker is activated
     */
    activateElementPicker(): Promise<void> {
      return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'startPicking' }, (response) => {
              if (response && response.status === 'activated') {
                console.log('Picker activated, closing popup');
                window.close();
                resolve();
              } else {
                reject(new Error('Failed to activate picker'));
              }
            });
          } else {
            reject(new Error('No active tab found'));
          }
        });
      });
    }
  
    /**
     * Refresh the active tab
     * @returns A promise that resolves when the tab is refreshed
     */
    refreshActiveTab(): Promise<void> {
      return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.reload(tabs[0].id);
            resolve();
          } else {
            reject(new Error('No active tab found'));
          }
        });
      });
    }
  }
  
  // Create a singleton instance for use throughout the app
  export const tabService = new TabService();