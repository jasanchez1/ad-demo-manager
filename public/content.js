/**
 * Ad Demo Manager - Content Script
 * 
 * This script is injected into web pages to handle ad injection based on 
 * configured patterns. It retrieves active ad configurations, matches URL patterns,
 * and injects banner ads accordingly.
 */

// ====== Configuration and State ======
const CONTENT_DEBUG = false;
let lastNotificationTime = 0;
let lastNotificationMessage = '';
const NOTIFICATION_COOLDOWN = 1000; // 1 second cooldown between same notifications

/**
 * Logger utility for debugging
 */
const contentLogger = {
    log: (message, ...args) => {
        if (CONTENT_DEBUG) {
            console.log(`[AdDemoManager] ${message}`, ...args);
        }
    },
    error: (message, ...args) => {
        console.error(`[AdDemoManager] ${message}`, ...args);
    }
};

// ====== Notification System ======

/**
 * Show a notification banner on the page
 * @param {string} message - The message to display
 * @param {string} type - The notification type ('success' or 'error')
 */
function showNotification(message, type = 'success') {
    // Debounce check - prevent the same message from showing too frequently
    const now = Date.now();
    if (message === lastNotificationMessage && now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
        contentLogger.log(`Notification "${message}" debounced (shown ${now - lastNotificationTime}ms ago)`);
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

    // Create notification element
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

    // Add styles if not already present
    ensureNotificationStyles();

    // Add to the document
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

/**
 * Ensure notification styles are in the document
 */
function ensureNotificationStyles() {
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
        document.head.appendChild(styles);
    }
}

/**
 * Get user's IP address from a public API
 * @returns {Promise<string>} - IP address
 */
async function getUserIP() {
    try {
      // Use a public API to get the user's IP address
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      contentLogger.error("Error getting IP:", error);
      return "AUTO"; // Fallback
    }
  }

// ====== Ad Injection ======

/**
 * Main ad injection handler
 * @param {Object} config - Ad configuration object
 * @param {string} networkId - Kevel network ID
 */
function injectAd(config, networkId) {
    const DIV_NAME = config.name;
    const DECISIONS_API_URL = `https://e-${networkId}.adzerk.net/api/v2`;

    let imageURLs = [];
    let clickURLs = [];
    let impressionURLs = [];
    let categoryId = null;
    let lastInjectedAd = null; // Keep track of the last injected ad

    /**
     * Fetch banner ads from the Kevel API
     * @returns {Promise<string|null>} - Ad ID or null if no ads available
     */
    async function fetchBannerAds() {
        contentLogger.log("Fetching ads...");
        try {
            const userIP = await getUserIP();
            const response = await fetch(DECISIONS_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "url": window.location.href,
                    "user": {
                        "key": "demo-user-1234"
                    },
                    "ip": userIP,
                    "placements": [{
                        "divName": DIV_NAME,
                        "networkId": networkId,
                        "siteId": config.site.id.toString(),
                        "adTypes": [config.adType.id]
                    }],
                    "keywords": config.keywordQueryParam ?
                        [`category=${new URLSearchParams(location.search).get(config.keywordQueryParam)}`] :
                        [],
                    "keywords": config.keywordQueryParam ?
                        [`category=${new URLSearchParams(location.search).get(config.keywordQueryParam)}`] :
                        [],
                })
            });

            const data = await response.json();
            const div = data.decisions[DIV_NAME];

            if (!div) {
                contentLogger.log("No ads to show");
                return null;
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
            contentLogger.error("Error fetching ads:", error);
            return null;
        }
    }

    /**
     * Remove any injected banner
     */
    function removeInjectedBanner() {
        imageURLs = [];
        clickURLs = [];
        impressionURLs = [];
        lastInjectedAd = null;
        const bannerDiv = document.getElementById(DIV_NAME);
        if (bannerDiv) {
            bannerDiv.remove();
            contentLogger.log('Injected banner removed.');
        }
    }

    /**
     * Track impression when the banner becomes visible
     * @param {boolean} forceTrack - Whether to force tracking immediately
     */
    function trackImpressionWhenVisible(forceTrack = false) {
        const banner = document.getElementById(DIV_NAME);
        if (!banner || !impressionURLs || !impressionURLs[0]) {
            contentLogger.log("Banner or impression URL not found");
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

        // Use IntersectionObserver to track when banner becomes visible
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

    /**
     * Inject banner into the page
     * @param {boolean} isNewAd - Whether this is a new ad
     */
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

                // Create banner container
                const bannerDiv = createBannerElement(isDemoMode);

                // Add to page
                parentDiv.appendChild(bannerDiv);

                contentLogger.log(`Banner injected successfully! ${isNewAd ? '(New Ad)' : ''}`);

                // Track impression
                if (isNewAd) {
                    // When a new ad is injected, always force track impression
                    trackImpressionWhenVisible(true);
                } else {
                    // Otherwise use the normal intersection observer method
                    trackImpressionWhenVisible();
                }
            });
        } else {
            contentLogger.log("Parent element not found!");
        }
    }

    /**
     * Create the banner element
     * @param {boolean} isDemoMode - Whether demo mode is enabled
     * @returns {HTMLElement} - The banner element
     */
    function createBannerElement(isDemoMode) {
        // Add padding to the parent div to create space below the banner
        const parentElements = document.getElementsByClassName(config.divId);
        if (parentElements.length > 0) {
            const parentDiv = parentElements[0];
            parentDiv.style.paddingBottom = `${config.adType.height * 1.3}px`;
            parentDiv.style.clear = "both"; // Ensure clear if using floats
        }

        // Create banner container
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

        // Create "Ad" label
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

        // Create banner image
        const bannerImg = document.createElement("img");
        bannerImg.src = imageURLs[0];
        bannerImg.alt = "Banner";
        bannerImg.style.width = "100%";
        bannerImg.style.height = "100%";

        // Create link wrapper
        const bannerLink = document.createElement("a");
        bannerLink.href = clickURLs[0];

        // Apply demo mode styling if enabled
        if (isDemoMode) {
            bannerDiv.style.border = "2px solid #fd563c";
            bannerDiv.style.animation = "pulseBorder 2s infinite";
        }

        // Add click tracking
        bannerLink.addEventListener('click', () => {
            showNotification('Click tracked!', 'success');
        });

        // Assemble the elements
        bannerLink.appendChild(bannerImg);
        bannerDiv.appendChild(label);
        bannerDiv.appendChild(bannerLink);

        return bannerDiv;
    }

    /**
     * Fetch, track and inject banner
     */
    async function fetchTrackAndInjectBanner() {
        removeInjectedBanner();
        const newAdId = await fetchBannerAds();

        if (imageURLs.length) {
            // Check if this is a new/different ad
            const isNewAd = newAdId !== null && newAdId !== lastInjectedAd;
            injectBanner(isNewAd);
        }
    }

    // Handle URL parameter changes for dynamic category targeting
    if (config.keywordQueryParam) {
        setupCategoryObserver();
    }

    /**
     * Set up observer for category parameter changes
     */
    function setupCategoryObserver() {
        // Initial category check
        const urlParams = new URLSearchParams(location.search);
        categoryId = urlParams.get(config.keywordQueryParam);

        // Watch for DOM changes that might indicate URL changes
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

        // Also watch for URL changes directly
        let lastUrl = location.href;
        new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                contentLogger.log('URL changed, checking for category param');

                if (config.keywordQueryParam) {
                    const urlParams = new URLSearchParams(location.search);
                    const currentCategoryId = urlParams.get(config.keywordQueryParam);

                    if (currentCategoryId !== categoryId) {
                        contentLogger.log(`Category changed from ${categoryId} to ${currentCategoryId}`);
                        categoryId = currentCategoryId;
                        fetchTrackAndInjectBanner();
                    }
                }
            }
        }).observe(document, { subtree: true, childList: true });
    }

    // Initial fetch and inject
    fetchTrackAndInjectBanner();
}

// ====== Main Initialization ======

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
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
});

// Also try to run immediately in case DOMContentLoaded already fired
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