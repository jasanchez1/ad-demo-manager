// Debug logging function
function debugLog(message) {
  console.log(`[Element Info Extension] ${message}`);
}

debugLog('Content script loaded');

// Create info display element
function initDisplayInfoElement(initialMessage) {
  const infoDisplay = document.createElement('div');
  infoDisplay.className = 'element-info-display';
  infoDisplay.style.display = 'none';
  infoDisplay.textContent = initialMessage
  document.body.appendChild(infoDisplay);
  debugLog('Info display element created');
  return infoDisplay
}

// Ready to select message
const selectReadyMessage = 'Extension ready - click elements to see info';
const infoDisplay = initDisplayInfoElement(selectReadyMessage)

// Track if extension is active
let isActive = false;
let lastHighlightedElement = null;
let selectedElement = null;

// Function to get element details
function getElementInfo(element) {
  if (element.id) {
    return { type: "id", value: element.id }
  }

  if (element.className) {
    // Filter out our custom classes from the display
    const classes = element.className.split(' ')
      .filter(cls => !['inspector-highlight', 'inspector-selected'].includes(cls))
      .join(' ');
    if (classes) {
      return { type: "class name", value: classes }
    }
  }
  // TODO: handle the error
  return { type: "error", value: "No identifier found" }
}

function setSelectedElementInfo(displayElement, element) {
  const elementInfo = getElementInfo(element)
  displayElement.textContent = 'Selected element with ' + elementInfo.type + ': ' + elementInfo.value;
}


// Listen for extension icon click
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  debugLog(`Message received: ${JSON.stringify(request)}`);

  if (request.action === 'toggleExtension') {
    isActive = !isActive;
    debugLog(`Extension toggled: ${isActive}`);

    // Clean up any existing highlights when toggling off
    if (!isActive) {
      if (lastHighlightedElement) {
        lastHighlightedElement.classList.remove('inspector-highlight');
      }
      if (selectedElement) {
        selectedElement.classList.remove('inspector-selected');
      }
    }

    infoDisplay.style.display = isActive ? 'block' : 'none';
    infoDisplay.textContent = isActive ? 'Hover over elements to inspect, click to select' : '';

    sendResponse({ status: 'toggled', isActive: isActive });
  }
});

// Hover handling
document.addEventListener('mouseover', function (event) {
  if (!isActive) return;

  const targetElement = event.target;

  // Remove highlight from previous element
  if (lastHighlightedElement && lastHighlightedElement !== selectedElement) {
    lastHighlightedElement.classList.remove('inspector-highlight');
  }

  // Don't highlight the info display itself
  if (targetElement === infoDisplay) return;

  if (!selectedElement) {
    // Add highlight to current element
    targetElement.classList.add('inspector-highlight');
    lastHighlightedElement = targetElement;
  }
}, true);

document.addEventListener('mouseout', function (event) {
  if (!isActive) return;
  const targetElement = event.target;

  // Don't remove highlight if this is the selected element
  if (targetElement !== selectedElement) {
    targetElement.classList.remove('inspector-highlight');
  }

}, true);

// Click handling
document.addEventListener('click', function (event) {
  if (!isActive) return;

  // Prevent default behavior when extension is active
  event.preventDefault();
  event.stopPropagation();

  const targetElement = event.target;

  // Don't select the info display itself
  if (targetElement === infoDisplay) return;

  // Remove previous selection
  if (!selectedElement) {

    // Update selection
    selectedElement = targetElement;
    selectedElement.classList.add('inspector-selected');

    // Update display
    setSelectedElementInfo(infoDisplay, selectedElement);
    debugLog(`Element selected: ${targetElement.tagName}`);
  }
}, true);

// Prevent all link clicks when active
document.addEventListener('click', function (event) {
  if (isActive) {
    event.preventDefault();
    event.stopPropagation();
  }
}, true);

// Test log to verify script is running
debugLog('Script initialized, waiting for activation');