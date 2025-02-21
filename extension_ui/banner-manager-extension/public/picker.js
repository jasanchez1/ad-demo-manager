// Debug logging function
function debugLog(message) {
    console.log(`[Element Picker] ${message}`);
  }
  
  debugLog('Picker script loaded');
  
  function initDisplayInfoElement(initialMessage) {
    // Create main container (picking-header)
    const infoDisplay = document.createElement('div');
    infoDisplay.className = 'picking-header';
    infoDisplay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      padding: 12px;
      background: #001830;
      border-bottom: 1px solid #3182ce;
      z-index: 2147483647;
      display: none;
    `;
  
    // Create content container (picking-content)
    const content = document.createElement('div');
    content.className = 'picking-content';
    content.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
    `;
  
    // Create icon
    const icon = document.createElement('img');
    icon.src = chrome.runtime.getURL('icon48.png');
    icon.className = 'header-icon';
    icon.style.cssText = `
      width: 24px;
      height: 24px;
    `;
  
    // Create text container (picking-text-container)
    const textContainer = document.createElement('div');
    textContainer.className = 'picking-text-container';
    textContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-height: 42px;
    `;
  
    // Create instruction text
    const instruction = document.createElement('span');
    instruction.className = 'picking-instruction';
    instruction.textContent = 'Select where you want to place your ad';
    instruction.style.cssText = `
      color: white;
      font-size: 12px;
    `;
  
    // Create container ID text
    const containerId = document.createElement('span');
    containerId.className = 'picking-container-id';
    containerId.style.cssText = `
      color: #3182ce;
      font-size: 11px;
      font-weight: 500;
      min-height: 14px;
    `;
    containerId.textContent = initialMessage;
  
    // Create cancel button
    const cancelButton = document.createElement('button');
    cancelButton.className = 'cancel-pick';
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
      margin-left: auto;
      width: auto !important;
      background: transparent;
      border: 1px solid #fd563c;
      color: #fd563c;
      padding: 4px 12px;
      height: 24px;
      font-size: 12px;
      border-radius: 4px;
      cursor: pointer;
    `;
  
    // Add hover effect to cancel button
    cancelButton.addEventListener('mouseover', () => {
      cancelButton.style.backgroundColor = 'rgba(253, 86, 60, 0.1)';
    });
    cancelButton.addEventListener('mouseout', () => {
      cancelButton.style.backgroundColor = 'transparent';
    });
  
    // Add click handler to cancel button
    cancelButton.addEventListener('click', () => {
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
    });
  
    // Assemble the elements
    textContainer.appendChild(instruction);
    textContainer.appendChild(containerId);
    content.appendChild(icon);
    content.appendChild(textContainer);
    content.appendChild(cancelButton);
    infoDisplay.appendChild(content);
    document.body.appendChild(infoDisplay);
  
    debugLog('Info display element created');
    return {
      element: infoDisplay,
      containerId: containerId
    };
  }

  // Ready to select message
  const selectReadyMessage = 'Hover over elements to select container';
  const { element: infoDisplay, containerId } = initDisplayInfoElement(selectReadyMessage);
  
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
    containerId.textContent = 'Selected container: ' + elementInfo.value;
  }
  
  // Listen for picker activation message
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    debugLog(`Message received: ${JSON.stringify(request)}`);
  
    if (request.action === 'startPicking') {
      isActive = true;
      debugLog('Picker activated');
  
      infoDisplay.style.display = 'block';
      infoDisplay.textContent = selectReadyMessage;
  
      sendResponse({ status: 'activated' });
    }
  });
  
  // Hover handling
  document.addEventListener('mouseover', function(event) {
    if (!isActive) return;
  
    const targetElement = event.target;
  
    if (lastHighlightedElement && lastHighlightedElement !== selectedElement) {
      lastHighlightedElement.classList.remove('inspector-highlight');
    }
  
    if (targetElement === infoDisplay) return;
  
    if (!selectedElement) {
      targetElement.classList.add('inspector-highlight');
      lastHighlightedElement = targetElement;
    }
  }, true);
  
  document.addEventListener('mouseout', function(event) {
    if (!isActive) return;
    const targetElement = event.target;
  
    if (targetElement !== selectedElement) {
      targetElement.classList.remove('inspector-highlight');
    }
  }, true);
  
  // Click handling
  document.addEventListener('click', function(event) {
    if (!isActive) return;
  
    event.preventDefault();
    event.stopPropagation();
  
    const targetElement = event.target;
  
    if (targetElement === infoDisplay) return;
  
    if (!selectedElement) {
      selectedElement = targetElement;
      selectedElement.classList.add('inspector-selected');
      setSelectedElementInfo(infoDisplay, selectedElement);
      debugLog(`Element selected: ${targetElement.tagName}`);
    }
  }, true);
  
  // Prevent clicks while active
  document.addEventListener('click', function(event) {
    if (isActive) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
  
  debugLog('Picker script initialized');