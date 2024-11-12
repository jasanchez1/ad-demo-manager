console.log('[Element Info Extension] Background script loaded');

chrome.action.onClicked.addListener((tab) => {
    console.log('[Element Info Extension] Icon clicked, sending toggle message');
    
    chrome.tabs.sendMessage(
        tab.id,
        {action: 'toggleExtension'},
        (response) => {
            if (chrome.runtime.lastError) {
                console.error('[Element Info Extension] Error:', chrome.runtime.lastError);
            } else {
                console.log('[Element Info Extension] Toggle successful:', response);
            }
        }
    );
});