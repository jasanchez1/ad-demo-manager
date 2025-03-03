/**
 * Ad Demo Manager - Background Script
 * 
 * This script runs as a service worker in the background and handles communication
 * between different parts of the extension, as well as external API calls.
 */

// ====== Configuration ======
const MANAGEMENT_URL = "https://api.kevel.co/v1";
const DEBUG = false;

/**
 * Logger utility for debugging
 */
const logger = {
  log: (message, ...args) => {
    if (DEBUG) {
      console.log(`[Background] ${message}`, ...args);
    } else {
      console.log(`[Background] ${message}`);
    }
  },
  error: (message, ...args) => {
    console.error(`[Background] ${message}`, ...args);
  }
};

// ====== API Handlers ======

/**
 * Handle API requests to the Kevel API
 * @param {string} endpoint - API endpoint
 * @param {string} apiKey - Kevel API key
 * @returns {Promise<Object>} - API response
 */
async function handleApiRequest(endpoint, apiKey) {
  try {
    const response = await fetch(`${MANAGEMENT_URL}/${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Adzerk-ApiKey': apiKey,
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw {
        status: response.status,
        message: errorBody
      };
    }

    return {
      success: true,
      data: await response.json()
    };
  } catch (error) {
    logger.error(`API error for ${endpoint}:`, error);

    return {
      success: false,
      error: error.message,
      status: error.status || 500
    };
  }
}

// ====== Tab Management ======

/**
 * Refresh tabs that match a URL pattern
 * @param {string} urlPattern - URL pattern to match
 * @returns {number} - Number of tabs refreshed
 */
function refreshMatchingTabs(urlPattern) {
  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => {
      let refreshedCount = 0;

      tabs.forEach(tab => {
        if (tab.url && tab.url.match(new RegExp(urlPattern))) {
          logger.log(`Refreshing tab ${tab.id}: ${tab.url}`);
          chrome.tabs.reload(tab.id);
          refreshedCount++;
        }
      });

      logger.log(`Refreshed ${refreshedCount} tabs`);
      resolve(refreshedCount);
    });
  });
}

/**
 * Refresh all tabs
 */
function refreshAllTabs() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id) {
        chrome.tabs.reload(tab.id);
      }
    });
  });
}

// ====== Popup Management ======

/**
 * Reopen the extension popup
 * @param {number} delay - Delay before reopening in milliseconds
 * @returns {Promise<void>}
 */
async function reopenPopup(delay = 500) {
  logger.log('Reopening extension popup');

  return new Promise((resolve) => {
    // Ensure the popup doesn't open too quickly
    setTimeout(() => {
      try {
        chrome.action.openPopup(() => {
          if (chrome.runtime.lastError) {
            logger.error('Error reopening popup:', chrome.runtime.lastError);

            // If direct popup fails, try again with a longer delay
            setTimeout(() => {
              chrome.action.openPopup(() => {
                resolve();
              });
            }, 500);
          } else {
            resolve();
          }
        });
      } catch (error) {
        logger.error('Exception reopening popup:', error);
        resolve();
      }
    }, delay);
  });
}

// ====== Element Picker Handlers ======

/**
 * Handle element selection confirmation
 * @param {Object} elementInfo - Information about the selected element
 */
async function handleContainerConfirmation(elementInfo) {
  logger.log('Container confirmed with direct reopen:', elementInfo);

  try {
    // Save to local storage as backup
    await new Promise((resolve, reject) => {
      chrome.storage.local.set({
        directContainerValue: elementInfo.value,
        directContainerTimestamp: Date.now()
      }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          logger.log('Container value saved from background');
          resolve();
        }
      });
    });

    // Wait a moment to ensure storage is complete
    await new Promise(resolve => setTimeout(resolve, 300));

    // Reopen the popup
    await reopenPopup(300);
  } catch (error) {
    logger.error('Error handling container confirmation:', error);
  }
}

// ====== Import/Export Handlers ======

/**
 * Handle configuration import
 * @param {Object} config - Imported configuration
 */
async function handleImport(config) {
  logger.log('Handling import request');

  try {
    // Store it in local storage temporarily
    await new Promise((resolve, reject) => {
      chrome.storage.local.set({
        importedConfig: config,
        importTimestamp: Date.now()
      }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          logger.log('Imported config saved');
          resolve();
        }
      });
    });

    // Wait a moment to ensure storage is complete
    await new Promise(resolve => setTimeout(resolve, 300));

    // Reopen the popup
    await reopenPopup(500);

    return { success: true };
  } catch (error) {
    logger.error('Error handling import:', error);
    return { success: false, error: error.message };
  }
}

// ====== Message Handler ======

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  logger.log('Message received:', request);

  // Handle API requests
  if (request.type === 'site' || request.type === 'adtypes') {
    handleApiRequest(request.type, request.apiKey)
      .then(sendResponse);
    return true; // Keep message channel open for async response
  }

  // Handle configuration toggle
  if (request.type === 'configToggled') {
    refreshMatchingTabs(request.url);
  }

  // Handle ad saved/updated
  if (request.type === 'adSaved') {
    logger.log('Ad saved/updated, refreshing tabs for URL pattern:', request.url);

    refreshMatchingTabs(request.url)
      .then(refreshedCount => {
        if (sendResponse) {
          sendResponse({ success: true, refreshedCount });
        }
      });

    return true; // Keep message channel open for async response
  }

  // Handle demo mode toggle
  if (request.type === 'demoToggled') {
    refreshAllTabs();
  }

  // Handle extension reopening
  if (request.type === 'reopenExtension') {
    reopenPopup();
  }

  // Handle container confirmation
  if (request.type === 'containerConfirmedReopenNow') {
    handleContainerConfirmation(request.elementInfo)
      .then(() => {
        if (sendResponse) {
          sendResponse({ success: true });
        }
      });

    return true; // Keep channel open for async response
  }

  // Handle import
  if (request.type === 'handleImport') {
    handleImport(request.config)
      .then(response => {
        if (sendResponse) {
          sendResponse(response);
        }
      });

    return true; // Keep message channel open for async response
  }
});
