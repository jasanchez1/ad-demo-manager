const TARGET_URL = "https://www.ubereats.com"

if (location.href.includes(TARGET_URL)) {
    const PARENT_DIV_CLASS_NAME = "f5 ge";  // Class name of the div which we will inject the banner on
    const NETWORK_ID = "11682"
    const SITE_ID = "1295844"
    const DECISIONS_API_URL = `https://e-${NETWORK_ID}.adzerk.net/api/v2`
    const AD_TYPES = [3]; // Asummes a full banner size of 468x60 
    const DIV_NAME = "injected-banner";

    console.log('Banner Injection Script loaded correctly');

    var imageURLs = [];
    var clickURLs = [];
    var impressionURLs = [];
    var categoryId = null;

    async function fetchBannerAds() {
        console.log("Fetching ads...")
        await fetch(DECISIONS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "placements": [
                    {
                        "divName": DIV_NAME,
                        "networkId": NETWORK_ID,
                        "siteId": SITE_ID,
                        "adTypes": AD_TYPES

                    }
                ],
                "keywords": [`category=${categoryId}`]
            })
        })
            .then(response => response.json())
            .then(data => {
                var div = data.decisions[DIV_NAME];
                if (!div) {
                    console.log("No ads to show")
                    return
                }
                imageURLs = [div.contents[0].data.imageUrl];
                clickURLs = [div.clickUrl];
                impressionURLs = [div.impressionUrl];
            })
            .catch(error => {
                console.error("Error fetching ads:", error);
            });
    }

    function removeInjectedBanner() {
        imageURLs = [];
        clickURLs = [];
        impressionURLs = [];
        var bannerDiv = document.getElementById(DIV_NAME);
        if (bannerDiv) {
            bannerDiv.remove(); // Remove the banner div from the DOM
            console.log('Injected banner removed.');
        } else {
            console.log('Banner not found, nothing to remove.');
        }
    }

    function trackImpressionWhenVisible() {
        var banner = document.getElementById(DIV_NAME);
        if (!banner) {
            console.error("Banner not found for tracking impression.");
            return;
        }
        if (!impressionURLs) {
            console.error("Impression URL not found")
        }

        // Create the intersection observer
        var observer = new IntersectionObserver(function (entries, observer) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Banner is in the viewport (visible), fire the impression tracking
                    fetch(impressionURLs).then(response => {
                        if (response.ok) {
                            console.log('Impression tracked successfully. Status:', response.status);
                        } else {
                            console.error('Error tracking impression. Status:', response.status);
                        }
                    })
                        .catch(error => {
                            console.error('Error tracking impression:', error);
                        });

                    // Stop observing after firing the impression
                    observer.unobserve(banner);
                }
            });
        });

        // Observe the banner
        observer.observe(banner);
    }

    function injectBanner() {
        if (!imageURLs){
            return
        }
        var parentElements = document.getElementsByClassName(PARENT_DIV_CLASS_NAME);
        if (parentElements.length > 0) {
            var parentDiv = parentElements[0];

            // Add padding to the parent div to create space below the banner
            parentDiv.style.paddingBottom = "80px";  // Adjust as needed
            parentDiv.style.clear = "both"; // Ensure clear if using floats

            if (!document.getElementById(DIV_NAME)) {  // Prevent re-injecting
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
        }
    }

    async function fetchTrackAndInjectBanner() {
        removeInjectedBanner();
        await fetchBannerAds();
        if (imageURLs) {
            injectBanner();
            trackImpressionWhenVisible();
        }
    }

    // Create a new MutationObserver instance
    const observer = new MutationObserver((mutationsList, _) => {
        for (let _ of mutationsList) {
            var urlParams = new URLSearchParams(location.search);

            // Get the value of the 'scq' parameter
            var currentCategoryId = urlParams.get('scq');

            if (!currentCategoryId) {
                removeInjectedBanner();
                categoryId = currentCategoryId;
                return
            }
            if (currentCategoryId !== categoryId) {
                categoryId = currentCategoryId;
                fetchTrackAndInjectBanner();
                return
            }
            if (currentCategoryId === categoryId) {
                if (imageURLs) { injectBanner(); }
                else { removeInjectedBanner(); }
            }
        }

    });

    // Define the target node and observer options
    const targetNode = document.body; // Or any specific element you want to watch
    const config = {
        attributes: true,       // Watch for attribute changes
        childList: true,        // Watch for additions or removals of child nodes
        subtree: true           // Watch all descendant nodes
    };

    // Start observing the target node
    observer.observe(targetNode, config);
}

