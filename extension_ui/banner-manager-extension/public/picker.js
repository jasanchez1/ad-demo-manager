// Debug logging function
function debugLog(message) {
    console.log(`[Element Picker] ${message}`);
}

function formatContainerId(id) {
    return id.length > 20 ? id.slice(0, 20) + '...' : id;
}

debugLog('Picker script loaded');

function initDisplayInfoElement(initialMessage) {
    const infoDisplay = document.createElement('div');
    infoDisplay.className = 'element-info-display';
    infoDisplay.style.display = 'none';

    const content = document.createElement('div');
    content.className = 'picking-content';

    const icon = document.createElement('img');
    icon.src = chrome.runtime.getURL('icon48.png');
    icon.alt = 'Banner Manager Icon';
    icon.className = 'header-icon';

    const textContainer = document.createElement('div');
    textContainer.className = 'picking-text-container';

    const message = document.createElement('span');
    message.className = 'picking-instruction';
    message.textContent = initialMessage;

    const containerInfo = document.createElement('span');
    containerInfo.className = 'picking-container-id';
    containerInfo.innerHTML = '&nbsp;';

    const cancelButton = document.createElement('button');
    cancelButton.className = 'cancel-button';
    cancelButton.textContent = 'Cancel';

    // Assemble the elements
    textContainer.appendChild(message);
    textContainer.appendChild(containerInfo);
    content.appendChild(icon);
    content.appendChild(textContainer);
    content.appendChild(cancelButton);
    infoDisplay.appendChild(content);
    document.body.appendChild(infoDisplay);

    // Update the cancel button click handler
    cancelButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        isActive = false;
        infoDisplay.style.display = 'none';

        if (lastHighlightedElement) {
            lastHighlightedElement.classList.remove('inspector-highlight');
        }
        if (selectedElement) {
            selectedElement.classList.remove('inspector-selected');
        }
        selectedElement = null;
        lastHighlightedElement = null;

        chrome.runtime.sendMessage({
            type: 'pickingCanceled'
        });
    });

    return {
        element: infoDisplay,
        message: message,
        containerInfo: containerInfo
    };
}

// Ready to select message
const selectReadyMessage = 'Hover and select a container';
const { element: infoDisplay, message, containerInfo } = initDisplayInfoElement(selectReadyMessage);

// Track if picker is active
let isActive = false;
let lastHighlightedElement = null;
let selectedElement = null;

// Function to get element details
function getElementInfo(element) {
    if (element.id) {
        return { type: "id", value: element.id };
    }

    if (element.className) {
        const classes = element.className.split(' ')
            .filter(cls => !['inspector-highlight', 'inspector-selected'].includes(cls))
            .join(' ');
        if (classes) {
            return { type: "class name", value: classes };
        }
    }
    return { type: "error", value: "No identifier found" };
}

function setSelectedElementInfo(element) {
    const elementInfo = getElementInfo(element);
    containerInfo.textContent = 'Container: ' + formatContainerId(elementInfo.value);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    debugLog(`Message received: ${JSON.stringify(request)}`);

    if (request.action === 'startPicking') {
        isActive = true;
        debugLog('Picker activated');

        infoDisplay.style.display = 'block';
        message.textContent = selectReadyMessage;

        sendResponse({ status: 'activated' });
    }
});

// Click handling
document.addEventListener('click', function (event) {
    if (!isActive) return;

    event.preventDefault();
    event.stopPropagation();

    const targetElement = event.target;

    // Check if clicking the cancel button
    if (targetElement.classList.contains('cancel-button')) {
        isActive = false;
        infoDisplay.style.display = 'none';
        if (lastHighlightedElement) {
            lastHighlightedElement.classList.remove('inspector-highlight');
        }
        if (selectedElement) {
            selectedElement.classList.remove('inspector-selected');
        }
        selectedElement = null;
        lastHighlightedElement = null;
        chrome.runtime.sendMessage({
            type: 'pickingCanceled'
        });
        return;
    }

    if (!selectedElement) {
        selectedElement = targetElement;
        selectedElement.classList.add('inspector-selected');
        
        const elementInfo = getElementInfo(selectedElement);
        containerInfo.textContent = `Selected container: ${formatContainerId(elementInfo.value)}`;
        containerInfo.classList.add('selected'); // Just add selected class
    }

    // Check if clicking the info display
    if (targetElement === infoDisplay || infoDisplay.contains(targetElement)) {
        return;
    }

    // Handle element selection
    selectedElement = targetElement;
    selectedElement.classList.add('inspector-selected');

    const elementInfo = getElementInfo(selectedElement);
    containerInfo.textContent = `Selected container: ${formatContainerId(elementInfo.value)}`;

    chrome.runtime.sendMessage({
        type: 'elementSelected',
        elementInfo: elementInfo
    });
}, true);

// Update mouseover to respect selection
document.addEventListener('mouseover', function (event) {
    if (!isActive) return;

    const targetElement = event.target;

    if (targetElement === infoDisplay || infoDisplay.contains(targetElement)) return;

    if (lastHighlightedElement && lastHighlightedElement !== selectedElement) {
        lastHighlightedElement.classList.remove('inspector-highlight');
    }

    function formatContainerId(id) {
        return id.length > 20 ? id.slice(0, 20) + '...' : id;
    }

    if (!selectedElement) {
        targetElement.classList.add('inspector-highlight');
        lastHighlightedElement = targetElement;

        const elementInfo = getElementInfo(targetElement);
        containerInfo.textContent = `Container: ${formatContainerId(elementInfo.value)}`;
        containerInfo.style.color = '#4299e1';  // Blue for hover state
    }
}, true);


document.addEventListener('mouseout', function (event) {
    if (!isActive) return;

    const targetElement = event.target;

    if (targetElement === infoDisplay || infoDisplay.contains(targetElement)) return;

    if (targetElement !== selectedElement) {
        targetElement.classList.remove('inspector-highlight');
        // Only reset text if no selection
        if (!selectedElement) {
            containerInfo.textContent = '\u00A0';
        }
    }
}, true);


debugLog('Picker script initialized');