/**
 * Ad Demo Manager - Element Picker
 * 
 * This script provides a visual element picker for selecting ad container elements.
 * It allows users to hover over elements on the page, see element information,
 * and select elements to use as ad containers.
 */

// ====== Configuration and State ======
const PICKER_DEBUG = false;
let isActive = false;
let isConfirmationMode = false;
let lastHighlightedElement = null;
let selectedElement = null;

/**
 * Logger utility for debugging
 */
const logger = {
    log: (message) => {
        if (PICKER_DEBUG) {
            console.log(`[Element Picker] ${message}`);
        }
    },
    error: (message) => {
        console.error(`[Element Picker] ${message}`);
    }
};

logger.log('Picker script loaded');

// ====== Helper Functions ======

/**
 * Format container ID for display
 * @param {string} id - Container ID or class name
 * @returns {string} - Formatted ID for display
 */
function formatContainerId(id) {
    return id.length > 20 ? id.slice(0, 20) + '...' : id;
}

/**
 * Get element identification information
 * @param {HTMLElement} element - The element to get info for
 * @returns {Object} - Element identification information
 */
function getElementInfo(element) {
    if (element.id) {
        return { type: "id", value: element.id };
    }

    if (element.className && typeof element.className === 'string') {
        const classes = element.className.split(' ')
            .filter(cls => !['inspector-highlight', 'inspector-selected'].includes(cls))
            .join(' ');
        if (classes) {
            return { type: "class name", value: classes };
        }
    }
    return { type: "error", value: "No identifier found" };
}

// ====== UI Elements ======

/**
 * Initialize display info element
 * @param {string} initialMessage - Initial message to display
 * @returns {Object} - Display elements references
 */
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

// Ready to select message and initialize UI
const selectReadyMessage = 'Click where you want to place your Ad';
const { element: infoDisplay, message, containerInfo } = initDisplayInfoElement(selectReadyMessage);

// ====== UI Manipulation Functions ======

/**
 * Reset the picker UI to its initial state
 */
function resetPickerUI() {
    // Reset state
    isActive = false;
    isConfirmationMode = false;
    selectedElement = null;
    lastHighlightedElement = null;

    // Reset UI
    message.textContent = selectReadyMessage;
    containerInfo.textContent = '\u00A0';
    containerInfo.classList.remove('selected');

    // Reset button UI
    const content = document.querySelector('.picking-content');
    const buttonContainer = content.querySelector('.button-container');
    if (buttonContainer) {
        // Remove button container and add single cancel button
        const cancelButton = document.createElement('button');
        cancelButton.className = 'cancel-button';
        cancelButton.textContent = 'Cancel';

        // Add click handler
        cancelButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isActive = false;
            infoDisplay.style.display = 'none';
            resetPickerUI();
            chrome.runtime.sendMessage({ type: 'pickingCanceled' });
        });

        // Replace button container with plain cancel button
        content.replaceChild(cancelButton, buttonContainer);
    }

    // Hide display
    infoDisplay.style.display = 'none';

    // Remove element highlights
    document.querySelectorAll('.inspector-highlight, .inspector-selected').forEach(el => {
        el.classList.remove('inspector-highlight');
        el.classList.remove('inspector-selected');
    });
}

/**
 * Deactivate the element picker
 */
function deactivatePicker() {
    isActive = false;
    isConfirmationMode = false;  // Reset confirmation mode

    // Remove all highlights
    if (lastHighlightedElement) {
        lastHighlightedElement.classList.remove('inspector-highlight');
    }
    if (selectedElement) {
        selectedElement.classList.remove('inspector-selected');
    }

    // Reset state
    selectedElement = null;
    lastHighlightedElement = null;

    // Reset UI
    message.textContent = selectReadyMessage;
    containerInfo.textContent = '\u00A0';
    containerInfo.classList.remove('selected');

    // Remove button container if it exists
    const content = document.querySelector('.picking-content');
    const buttonContainer = content.querySelector('.button-container');
    if (buttonContainer) {
        const cancelButton = document.createElement('button');
        cancelButton.className = 'cancel-button';
        cancelButton.textContent = 'Cancel';
        content.replaceChild(cancelButton, buttonContainer);

        // Re-add cancel button click handler
        cancelButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            chrome.runtime.sendMessage({ type: 'pickingCanceled' });
            deactivatePicker();
        });
    }

    infoDisplay.style.display = 'none';
}

/**
 * Update UI for confirmation mode
 */
function updateUIForConfirmation() {
    // Change message
    message.textContent = 'Confirm container selection?';
    containerInfo.classList.add('selected');

    // Find the picking-content div first
    const content = document.querySelector('.picking-content');
    if (!content) return;

    // Create confirm button
    const confirmButton = document.createElement('button');
    confirmButton.className = 'confirm-button';
    confirmButton.textContent = 'Confirm';

    // Create a new cancel button (to ensure proper event handling)
    const newCancelButton = document.createElement('button');
    newCancelButton.className = 'cancel-button';
    newCancelButton.textContent = 'Cancel';

    // Get existing cancel button and remove it
    const existingCancelButton = content.querySelector('.cancel-button');
    if (existingCancelButton) {
        existingCancelButton.remove();
    }

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.appendChild(confirmButton);
    buttonContainer.appendChild(newCancelButton);

    // Add event listeners to new buttons
    confirmButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (selectedElement) {
            const elementInfo = getElementInfo(selectedElement);
            logger.log('Confirming selection:', elementInfo.value);

            // Save directly to local storage first - this is the most important part
            chrome.storage.local.set({
                directContainerValue: elementInfo.value,
                directContainerTimestamp: Date.now() // Add timestamp for freshness check
            }, () => {
                logger.log('Container value saved directly');

                // Then send message to background script to handle reopening
                chrome.runtime.sendMessage({
                    type: 'containerConfirmedReopenNow',
                    elementInfo: elementInfo
                });

                // Clean up UI
                resetPickerUI();
            });
        }
    });

    newCancelButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isActive = false;
        infoDisplay.style.display = 'none';
        resetPickerUI();
        chrome.runtime.sendMessage({ type: 'pickingCanceled' });
    });

    // Replace the existing content with new button container
    content.appendChild(buttonContainer);
}

/**
 * Set selected element info in the UI
 * @param {HTMLElement} element - The selected element
 */
function setSelectedElementInfo(element) {
    const elementInfo = getElementInfo(element);
    containerInfo.textContent = 'Container: ' + formatContainerId(elementInfo.value);
}

// ====== Event Handlers ======

/**
 * Handle messages from the extension
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    logger.log(`Message received: ${JSON.stringify(request)}`);

    if (request.action === 'startPicking') {
        isActive = true;
        logger.log('Picker activated');

        infoDisplay.style.display = 'block';
        message.textContent = selectReadyMessage;

        sendResponse({ status: 'activated' });
    }
});

/**
 * Handle click events for element selection
 */
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
        resetPickerUI();
        return;
    }

    // Check if clicking the confirm button
    if (targetElement.classList.contains('confirm-button')) {
        logger.log('Confirm button clicked');
        if (selectedElement) {
            chrome.runtime.sendMessage({
                type: 'containerConfirmed',
                elementInfo: getElementInfo(selectedElement)
            }, () => {
                chrome.runtime.sendMessage({ type: 'reopenExtension' });
                resetPickerUI();
            });
        } else {
            resetPickerUI();
        }
        return;
    }

    // Check if clicking the info display
    if (targetElement === infoDisplay || infoDisplay.contains(targetElement)) {
        return;
    }

    // Handle first selection
    if (!selectedElement) {
        selectedElement = targetElement;
        selectedElement.classList.add('inspector-selected');

        const elementInfo = getElementInfo(selectedElement);
        containerInfo.textContent = `Selected container: ${formatContainerId(elementInfo.value)}`;
        containerInfo.classList.add('selected');

        isConfirmationMode = true;
        updateUIForConfirmation();
        return;  // Add return here to prevent the code below from executing
    }

    // This part should only execute if we want to select a different element
    selectedElement.classList.remove('inspector-selected'); // Remove old selection
    selectedElement = targetElement;
    selectedElement.classList.add('inspector-selected');

    const elementInfo = getElementInfo(selectedElement);
    containerInfo.textContent = `Selected container: ${formatContainerId(elementInfo.value)}`;

    chrome.runtime.sendMessage({
        type: 'elementSelected',
        elementInfo: elementInfo
    });
});

/**
 * Handle mouseover events for highlighting elements
 */
document.addEventListener('mouseover', function (event) {
    if (!isActive) return;

    const targetElement = event.target;

    if (targetElement === infoDisplay || infoDisplay.contains(targetElement)) return;

    if (lastHighlightedElement && lastHighlightedElement !== selectedElement) {
        lastHighlightedElement.classList.remove('inspector-highlight');
    }

    if (!selectedElement) {
        targetElement.classList.add('inspector-highlight');
        lastHighlightedElement = targetElement;

        const elementInfo = getElementInfo(targetElement);
        containerInfo.textContent = `Container: ${formatContainerId(elementInfo.value)}`;
        containerInfo.style.color = '#4299e1';  // Blue for hover state
    }
}, true);

/**
 * Handle mouseout events to remove highlights
 */
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

logger.log('Picker script initialized');