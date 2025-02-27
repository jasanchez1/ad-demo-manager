// Modified content.js with improved notification handling

// Get configs and check URL matches
chrome.storage.sync.get(['adConfigs', 'networkId'], (result) => {
    const activeConfigs = result.adConfigs ?
        Object.values(result.adConfigs).filter(config => config.isActive) : [];
    const networkId = result.networkId;

    if (activeConfigs.length > 0 && networkId) {
        activeConfigs.forEach(config => {
            if (window.location.href.match(new RegExp(config.url))) {
                injectAd(config, networkId);
            }
        });
    }
});

let lastNotificationTime = 0;
let lastNotificationMessage = '';
const NOTIFICATION_COOLDOWN = 1000; // 1 second cooldown between same notifications

function showNotification(message, type = 'success') {
    // Debounce check - prevent the same message from showing too frequently
    const now = Date.now();
    if (message === lastNotificationMessage && now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
        console.log(`Notification "${message}" debounced (shown ${now - lastNotificationTime}ms ago)`);
        return;
    }
    
    // Update debounce tracking
    lastNotificationTime = now;
    lastNotificationMessage = message;
    
    // Remove any existing notifications first
    const existingNotifications = document.querySelectorAll('.ad-tracker-notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });

    const notification = document.createElement('div');
    notification.className = 'ad-tracker-notification';

    // Create the content
    const content = document.createElement('div');
    content.className = 'notification-content';

    // Add check icon for success, X for error
    const icon = document.createElement('span');
    icon.className = 'notification-icon';
    icon.innerHTML = type === 'success' ? '✓' : '✕';

    const text = document.createElement('span');
    text.textContent = message;

    content.appendChild(icon);
    content.appendChild(text);
    notification.appendChild(content);

    // Check if the style already exists
    if (!document.getElementById('ad-tracker-notification-style')) {
        // Add styles
        const styles = document.createElement('style');
        styles.id = 'ad-tracker-notification-style';
        styles.textContent = `
            .ad-tracker-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 24px;
                background: #001830;
                color: white;
                border-radius: 4px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 16px;
                font-weight: 500;
                z-index: 10000;
                display: flex;
                align-items: center;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                animation: slideIn 0.3s ease-out;
                border: 1px solid rgba(253, 86, 60, 0.3);
                min-width: 200px;
            }

            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .notification-icon {
                color: #fd563c;
                font-weight: bold;
                font-size: 20px;
            }

            @keyframes slideIn {
                from {
                    transform: translateY(-20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            @keyframes slideOut {
                from {
                    transform: translateY(0);
                    opacity: 1;
                }
                to {
                    transform: translateY(-20px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function injectAd(config, networkId) {
    const DIV_NAME = config.name;
    const DECISIONS_API_URL = `https://e-${networkId}.adzerk.net/api/v2`;

    let imageURLs = [];
    let clickURLs = [];
    let impressionURLs = [];
    let categoryId = null;
    let lastInjectedAd = null; // Keep track of the last injected ad

    async function fetchBannerAds() {
        console.log("Fetching ads...");
        try {
            const response = await fetch(DECISIONS_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "placements": [{
                        "divName": DIV_NAME,
                        "networkId": networkId,
                        "siteId": config.site.id.toString(),
                        "adTypes": [config.adType.id]
                    }],
                    "keywords": config.keywordQueryParam ?
                        [`category=${new URLSearchParams(location.search).get(config.keywordQueryParam)}`] :
                        []
                })
            });

            const data = await response.json();
            const div = data.decisions[DIV_NAME];

            if (!div) {
                console.log("No ads to show");
                return;
            }

            // Store the ad ID to detect changes
            const newAdId = div.adId || div.contents[0]?.data?.customData?.adId || JSON.stringify(div.contents[0]?.data);
            
            // Save both the ad info and ID
            imageURLs = [div.contents[0].data.imageUrl];
            clickURLs = [div.clickUrl];
            impressionURLs = [div.impressionUrl];
            lastInjectedAd = newAdId;
            
            return newAdId;
        } catch (error) {
            console.log("Error fetching ads:", error);
            return null;
        }
    }

    function removeInjectedBanner() {
        imageURLs = [];
        clickURLs = [];
        impressionURLs = [];
        lastInjectedAd = null;
        const bannerDiv = document.getElementById(DIV_NAME);
        if (bannerDiv) {
            bannerDiv.remove();
            console.log('Injected banner removed.');
        }
    }

    function trackImpressionWhenVisible(forceTrack = false) {
        const banner = document.getElementById(DIV_NAME);
        if (!banner || !impressionURLs || !impressionURLs[0]) {
            console.log("Banner or impression URL not found");
            return;
        }

        // If forceTrack is true, track immediately without waiting for IntersectionObserver
        if (forceTrack) {
            fetch(impressionURLs[0]).then(response => {
                if (response.ok) {
                    showNotification("New impression tracked!", "success");
                }
            }).catch(_ => {
                showNotification("Failed to track impression", "error");
            });
            return;
        }

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    fetch(impressionURLs[0]).then(response => {
                        if (response.ok) {
                            showNotification("Impression tracked!", "success");
                        }
                    }).catch(_ => {
                        showNotification("Failed to track impression", "error");
                    });
                    observer.unobserve(banner);
                }
            });
        });

        observer.observe(banner);
    }

    function injectBanner(isNewAd = false) {
        if (!imageURLs.length) return;

        const parentElements = document.getElementsByClassName(config.divId);
        if (parentElements.length > 0) {
            chrome.storage.sync.get(['demoMode'], (result) => {
                const isDemoMode = result.demoMode || false;

                const parentDiv = parentElements[0];
                
                // Check if banner already exists and remove it
                const existingBanner = document.getElementById(DIV_NAME);
                if (existingBanner) {
                    existingBanner.remove();
                }

                // Add padding to the parent div to create space below the banner
                parentDiv.style.paddingBottom = `${config.adType.height * 1.3}px`;
                parentDiv.style.clear = "both"; // Ensure clear if using floats

                const bannerDiv = document.createElement("div");
                bannerDiv.id = DIV_NAME;
                bannerDiv.style.width = `${config.adType.width * 1.3}px`;
                bannerDiv.style.height = `${config.adType.height * 1.3}px`;
                bannerDiv.style.margin = "0 auto";
                bannerDiv.style.marginBottom = "20px";
                bannerDiv.style.display = "block";
                bannerDiv.style.border = "0.5px solid grey";
                bannerDiv.style.borderRadius = "4px";
                bannerDiv.style.overflow = "hidden";
                bannerDiv.style.position = "relative";
                bannerDiv.style.backgroundColor = "white";
                bannerDiv.style.border = "1px solid rgba(255, 255, 255, 0.1)";
                bannerDiv.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1), 0 0 1px rgba(255, 255, 255, 0.1)";

                const label = document.createElement("div");
                label.innerText = "Ad";
                label.style.color = "white";
                label.style.backgroundColor = "rgb(14, 131, 69)";
                label.style.position = "absolute";
                label.style.padding = "2px 5px";
                label.style.zIndex = "1";
                label.style.top = "5px";
                label.style.left = "5px";
                label.style.borderRadius = "4px";
                label.style.fontSize = "14px";
                label.style.fontWeight = "500";

                const bannerImg = document.createElement("img");
                bannerImg.src = imageURLs[0];
                bannerImg.alt = "Banner";
                bannerImg.style.width = "100%";
                bannerImg.style.height = "100%";

                const bannerLink = document.createElement("a");
                bannerLink.href = clickURLs[0];

                if (isDemoMode) {
                    bannerDiv.style.border = "2px solid #fd563c";
                    bannerDiv.style.animation = "pulseBorder 2s infinite";
                    
                    // Check if style already exists
                    if (!document.getElementById('pulse-border-animation')) {
                        const style = document.createElement('style');
                        style.id = 'pulse-border-animation';
                        style.textContent = `
                        @keyframes pulseBorder {
                            0% {
                                box-shadow: 0 0 0 0 rgba(253, 86, 60, 0.7);
                                border-color: rgba(253, 86, 60, 0.9);
                            }
                            70% {
                                box-shadow: 0 0 0 10px rgba(253, 86, 60, 0);
                                border-color: rgba(253, 86, 60, 0.3);
                            }
                            100% {
                                box-shadow: 0 0 0 0 rgba(253, 86, 60, 0);
                                border-color: rgba(253, 86, 60, 0.9);
                            }
                        }
                    `;
                        document.head.appendChild(style);
                    }
                }

                bannerLink.addEventListener('click', () => {
                    showNotification('Click tracked!', 'success');
                });

                bannerDiv.appendChild(label);
                bannerLink.appendChild(bannerImg);
                bannerDiv.appendChild(bannerLink);
                parentDiv.appendChild(bannerDiv);

                console.log(`Banner injected successfully! ${isNewAd ? '(New Ad)' : ''}`);
                
                // Always track impression for new ads
                if (isNewAd) {
                    // When a new ad is injected, always force track impression
                    trackImpressionWhenVisible(true);
                } else {
                    // Otherwise use the normal intersection observer method
                    trackImpressionWhenVisible();
                }
            });
        } else {
            console.log("Parent element not found!");
        }
    }

    async function fetchTrackAndInjectBanner() {
        removeInjectedBanner();
        const newAdId = await fetchBannerAds();
        
        if (imageURLs.length) {
            // Check if this is a new/different ad
            const isNewAd = newAdId !== null && newAdId !== lastInjectedAd;
            injectBanner(isNewAd);
        }
    }

    if (config.keywordQueryParam) {
        const observer = new MutationObserver(() => {
            const urlParams = new URLSearchParams(location.search);
            const currentCategoryId = urlParams.get(config.keywordQueryParam);

            if (!currentCategoryId) {
                removeInjectedBanner();
                categoryId = currentCategoryId;
                return;
            }
            
            if (currentCategoryId !== categoryId) {
                categoryId = currentCategoryId;
                fetchTrackAndInjectBanner();
                return;
            }
            
            if (currentCategoryId === categoryId) {
                if (imageURLs.length) {
                    // Don't reinject if it's the same ad and already showing
                    const existing = document.getElementById(DIV_NAME);
                    if (!existing) {
                        injectBanner(false); // Not a new ad since we didn't fetch
                    }
                } else {
                    removeInjectedBanner();
                }
            }
        });

        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true
        });
    }

    // Also watch for URL changes directly
    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            console.log('URL changed, checking for category param');
            
            if (config.keywordQueryParam) {
                const urlParams = new URLSearchParams(location.search);
                const currentCategoryId = urlParams.get(config.keywordQueryParam);
                
                if (currentCategoryId !== categoryId) {
                    console.log(`Category changed from ${categoryId} to ${currentCategoryId}`);
                    categoryId = currentCategoryId;
                    fetchTrackAndInjectBanner();
                }
            }
        }
    }).observe(document, {subtree: true, childList: true});

    // Initial fetch and inject
    fetchTrackAndInjectBanner();
}
