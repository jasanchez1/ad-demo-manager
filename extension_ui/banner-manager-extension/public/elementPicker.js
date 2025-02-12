// Global state
let isActive = false;
let lastHighlightedElement = null;
let selectedElement = null;

// Get element info - more robust version
function getElementInfo(element) {
  if (element.id) {
    return { type: "id", value: element.id };
  }

  try {
    // Handle SVG elements and other special cases
    const className = element.className?.baseVal || element.className;
    if (className && typeof className === 'string') {
      const classes = className
        .split(' ')
        .filter(cls => !['inspector-highlight', 'inspector-selected'].includes(cls))
        .join(' ');
      if (classes) {
        return { type: "class name", value: classes };
      }
    }
  } catch (e) {
    console.log('Error getting className:', e);
  }

  return { type: "error", value: "No identifier found" };
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleExtension') {
    isActive = !isActive;

    if (!isActive) {
      if (lastHighlightedElement) {
        lastHighlightedElement.classList.remove('inspector-highlight');
      }
      if (selectedElement) {
        selectedElement.classList.remove('inspector-selected');
      }
      selectedElement = null;
      lastHighlightedElement = null;
    }

    sendResponse({ status: 'toggled', isActive: isActive });
    return true; // Keep message channel open
  }
});

// Hover handling
document.addEventListener('mouseover', function (event) {
  if (!isActive) return;

  const targetElement = event.target;

  if (lastHighlightedElement && lastHighlightedElement !== selectedElement) {
    lastHighlightedElement.classList.remove('inspector-highlight');
  }

  if (!selectedElement && targetElement !== document.body) {
    targetElement.classList.add('inspector-highlight');
    lastHighlightedElement = targetElement;

    const elementInfo = getElementInfo(targetElement);
    chrome.runtime.sendMessage({
      type: 'containerHover',
      elementInfo: elementInfo
    }, (response) => {
      if (chrome.runtime.lastError) {
        // Ignore chrome runtime errors
      }
    });
  }
}, true);

// Mouse out handling
document.addEventListener('mouseout', function (event) {
  if (!isActive) return;

  const targetElement = event.target;
  if (targetElement !== selectedElement) {
    targetElement.classList.remove('inspector-highlight');
  }
}, true);

// Click handling
document.addEventListener('click', function (event) {
  if (!isActive) return;

  event.preventDefault();
  event.stopPropagation();

  const targetElement = event.target;
  selectedElement = targetElement;
  selectedElement.classList.add('inspector-selected');

  chrome.runtime.sendMessage({
    type: 'elementSelected',
    elementInfo: getElementInfo(selectedElement)
  }, (response) => {
    if (chrome.runtime.lastError) {
      // Ignore chrome runtime errors
    }
  });

  // Turn off picker mode
  isActive = false;
}, true);

// Prevent all clicks when active
document.addEventListener('click', function (event) {
  if (isActive) {
    event.preventDefault();
    event.stopPropagation();
  }
}, true);