const MANAGEMENT_URL = "https://api.kevel.co/v1"

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

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
    chrome.action.openPopup();
  }

});
