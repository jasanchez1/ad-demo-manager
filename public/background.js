const MANAGEMENT_URL = "https://api.kevel.co/v1"

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background] Message received:', request);

  if (request.type === 'site' || request.type === 'adtypes') {
    fetch(`${MANAGEMENT_URL}/${request.type}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Adzerk-ApiKey': request.apiKey,
      }
    })
      .then(async response => {
        if (!response.ok) {
          const errorBody = await response.text();
          throw {
            status: response.status,
            message: errorBody
          };
        }
        return response.json();
      })
      .then(data => sendResponse({
        success: true,
        data
      }))
      .catch(error => sendResponse({
        success: false,
        error: error.message,
        status: error.status || 500
      }));
    return true; // Keep message channel open for async response
  }

  if (request.type === 'configToggled') {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && tab.url.match(new RegExp(request.url))) {
          chrome.tabs.reload(tab.id);
        }
      });
    });
  }

  if (request.type === 'adSaved') {
    console.log('[Background] Ad saved/updated, refreshing tabs for URL pattern:', request.url);
    
    chrome.tabs.query({}, (tabs) => {
      let refreshedCount = 0;
      
      tabs.forEach(tab => {
        if (tab.url && tab.url.match(new RegExp(request.url))) {
          console.log(`[Background] Refreshing tab ${tab.id}: ${tab.url}`);
          chrome.tabs.reload(tab.id);
          refreshedCount++;
        }
      });
      
      console.log(`[Background] Refreshed ${refreshedCount} tabs`);
      
      if (sendResponse) {
        sendResponse({ success: true, refreshedCount });
      }
    });
    
    return true; // Keep message channel open for async response
  }

  if (request.type === 'demoToggled') {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.reload(tab.id);
        }
      });
    });
  }

  if (request.type === 'reopenExtension') {
    console.log('[Background] Reopening extension popup');

    // Ensure the popup doesn't open too quickly
    setTimeout(() => {
      chrome.action.openPopup(() => {
        if (chrome.runtime.lastError) {
          console.error('[Background] Error reopening popup:', chrome.runtime.lastError);

          // If direct popup fails, try again with a longer delay
          setTimeout(() => {
            chrome.action.openPopup();
          }, 500);
        }
      });
    }, 500); // Longer delay to ensure storage operations complete
  }

  // Handle containerConfirmed in background to ensure it works even if popup is closed
  if (request.type === 'containerConfirmedReopenNow') {
    console.log('[Background] Container confirmed with direct reopen:', request.elementInfo);

    // Save to local storage as backup
    chrome.storage.local.set({
      directContainerValue: request.elementInfo.value,
      directContainerTimestamp: Date.now()
    }, () => {
      console.log('[Background] Container value saved from background');

      // Wait a moment to ensure storage is complete
      setTimeout(() => {
        try {
          chrome.action.openPopup(() => {
            if (chrome.runtime.lastError) {
              console.error('[Background] Error reopening popup:', chrome.runtime.lastError);
            } else {
              console.log('[Background] Popup reopened via direct method');
            }
          });
        } catch (error) {
          console.error('[Background] Exception reopening popup:', error);
        }
      }, 300);
    });

    // Acknowledge receipt
    if (sendResponse) {
      sendResponse({ success: true });
    }
    return true; // Keep channel open for async response
  }

  if (request.type === 'handleImport') {
    console.log('[Background] Handling import request');
    
    // Get the config from the request
    const importedConfig = request.config;
    
    // Store it in local storage temporarily
    chrome.storage.local.set({
      importedConfig: importedConfig,
      importTimestamp: Date.now()
    }, () => {
      console.log('[Background] Imported config saved');
      
      if (sendResponse) {
        sendResponse({ success: true });
      }
    });
    
    return true; // Keep message channel open for async response
  }
});