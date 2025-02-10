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

function injectAd(config, networkId) {
    const DIV_NAME = config.name;
    const DECISIONS_API_URL = `https://e-${networkId}.adzerk.net/api/v2`;

    let imageURLs = [];
    let clickURLs = [];
    let impressionURLs = [];
    let categoryId = null;

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

            imageURLs = [div.contents[0].data.imageUrl];
            clickURLs = [div.clickUrl];
            impressionURLs = [div.impressionUrl];
        } catch (error) {
            console.log("Error fetching ads:", error);
        }
    }

    function removeInjectedBanner() {
        imageURLs = [];
        clickURLs = [];
        impressionURLs = [];
        const bannerDiv = document.getElementById(DIV_NAME);
        if (bannerDiv) {
            bannerDiv.remove();
            console.log('Injected banner removed.');
        }
    }

    function trackImpressionWhenVisible() {
        const banner = document.getElementById(DIV_NAME);
        if (!banner || !impressionURLs) {
            console.log("Banner or impression URL not found");
            return;
        }

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    fetch(impressionURLs[0]).then(response => {
                        console.log('Impression tracked:', response.status);
                    }).catch(error => {
                        console.error('Error tracking impression:', error);
                    });
                    observer.unobserve(banner);
                }
            });
        });

        observer.observe(banner);
    }

    function injectBanner() {
        if (!imageURLs.length) return;

        const parentElements = document.getElementsByClassName(config.divId);
        if (parentElements.length > 0) {
            const parentDiv = parentElements[0];

            // Add padding to the parent div to create space below the banner
            parentDiv.style.paddingBottom = "80px";  // Adjust as needed
            parentDiv.style.clear = "both"; // Ensure clear if using floats

            if (!document.getElementById(DIV_NAME)) {
                var bannerDiv = document.createElement("div");
                bannerDiv.id = DIV_NAME;
                bannerDiv.style.width = "624px";
                bannerDiv.style.height = "80px";
                bannerDiv.style.margin = "0 auto";
                bannerDiv.style.marginBottom = "20px";  // Space below
                bannerDiv.style.display = "block"; // Ensure banner is block level

                // Add a rounded black border
                bannerDiv.style.border = "0.5px solid gray"; // Thinner border
                bannerDiv.style.borderRadius = "4px"; // Rounded corners
                bannerDiv.style.overflow = "hidden"; // Prevent image from overflowing rounded corners

                // Set position relative for the banner
                bannerDiv.style.position = "relative"; // For label positioning

                // Create a label for the ad
                var label = document.createElement("div");
                label.innerText = "Ad"; // Label text
                label.style.color = "white"; // Label text color
                label.style.backgroundColor = "rgb(14, 131, 69)"; // Label background color
                label.style.position = "absolute"; // Position it absolutely
                label.style.padding = "2px 5px"; // Padding around label
                label.style.zIndex = "1"; // Ensure it's above other content
                label.style.top = "5px"; // Position from top
                label.style.left = "5px"; // Position from left
                label.style.borderRadius = "4px";
                label.style.fontSize = "14px";
                label.style.fontWeight = "500";

                // Append label to banner div
                bannerDiv.appendChild(label);

                var bannerImg = document.createElement("img");
                bannerImg.src = imageURLs[0];
                bannerImg.alt = "Banner";
                bannerImg.style.width = "100%";
                bannerImg.style.height = "100%";

                var bannerLink = document.createElement("a");
                bannerLink.href = clickURLs[0];  // The URL to redirect to

                bannerDiv.appendChild(bannerImg);
                parentDiv.appendChild(bannerDiv);
                bannerLink.appendChild(bannerImg);
                bannerDiv.appendChild(bannerLink);
                console.log("Banner injected successfully!");
            }
        } else {
            console.log("Parent element not found!");
            console.log(config.divId);
        }
    }

    async function fetchTrackAndInjectBanner() {
        removeInjectedBanner();
        await fetchBannerAds();
        if (imageURLs.length) {
            injectBanner();
            trackImpressionWhenVisible();
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
                    injectBanner();
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

    // Initial fetch and inject
    fetchTrackAndInjectBanner();
}