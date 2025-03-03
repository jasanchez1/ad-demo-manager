# Ad Demo Manager Chrome Extension

A Chrome extension that allows you to seamlessly manage and inject banner ads on websites for demonstration and testing purposes.

## Overview

The Ad Demo Manager Chrome Extension is designed to help ad operations teams and developers test ad placements on websites without requiring modifications to the actual site code. It connects to the Kevel (formerly Adzerk) API to serve real ads in specified containers on targeted web pages.

## Features

- **Multiple Ad Configurations**: Create and manage multiple ad configurations for different sites
- **Targeted Injection**: Define custom URL patterns to determine where ads should appear
- **Element Picker**: Visual UI tool to select target containers on the page
- **Category Targeting**: Support for keyword/category URL parameters for dynamic ad serving
- **Demo Mode**: Highlight injected ads with visual indicators for easy identification
- **Real-time Tracking**: Display notifications for impression and click tracking events
- **Network Settings**: Configure network ID and API key for Kevel integration
- **Configuration Sharing**: Easily share ad configurations with team members via encoded strings

## Installation

### Development Mode

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Build the extension:
   ```
   npm run build
   ```
4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory created during the build

## Usage

### Initial Setup

1. Click the extension icon to open the popup
2. Navigate to the Settings tab
3. Enter your Kevel Network ID and API key
4. Save the settings

### Creating Ad Configurations

1. From the main view, click "Create New Ad Config"
2. Fill out the form:
   - **Name**: A descriptive name for this configuration
   - **Ad Type**: Select from available ad types in your Kevel network
   - **Site**: Select from available sites in your Kevel network
   - **URL Pattern**: Define where the ad should appear (supports regex patterns)
   - **Container ID**: The HTML element where the ad will be injected
   - **Keyword URL Parameter** (Optional): URL parameter that contains category information

### Using the Element Picker

1. While creating or editing an ad configuration, click the "Pick" button next to Container ID
2. The extension will highlight elements as you hover over them on the page
3. Click to select a container
4. Confirm your selection

### Managing Configurations

- Toggle configurations on/off using the switch
- Edit existing configurations by clicking on them
- Delete configurations using the menu options

### Sharing Configurations

1. Click the menu icon (⋮) for an ad configuration
2. Select "Share"
3. Copy the generated share code
4. Share the code with your team members

### Importing Configurations

1. Click the "Import Ad" button
2. Paste a share code into the import modal
3. Click "Import"
4. The configuration will be added to your list

### Demo Mode

Enable Demo Mode in settings to add visual highlighting to injected ads, making them easier to identify during testing.

## Architecture

The extension follows a modular, service-oriented architecture using Vue.js Composition API:

### Core Components

- **UI Layer**: Vue components for user interaction
- **State Management**: Composable functions that manage specific aspects of application state
- **Services Layer**: Service classes that handle external interactions (API, storage, etc.)
- **Content Scripts**: Scripts that run in the context of web pages for ad injection
- **Background Scripts**: Service worker for cross-context communication

### Architecture Diagram

```
App
├── Components (UI)
│   ├── AdForm
│   ├── AdItemMenu
│   └── ShareString
│
├── Composables (State & Logic)
│   ├── useAdConfigs
│   ├── useDemoMode
│   ├── useElementPicker
│   ├── useNavigation
│   ├── useNetworkSettings
│   └── useSharing
│
├── Services (External Interactions)
│   ├── ApiService
│   ├── StorageService
│   ├── TabService
│   └── SharingService
│
├── Content Scripts
│   ├── content.js (Ad injection)
│   └── picker.js (Element picker)
│
└── Background Scripts
    └── background.js (Message handling)
```

### Technical Details

#### Content Scripts

The content scripts run in the context of web pages:

1. **content.js**: Injects ads into matched web pages:
   - Retrieves active configurations from storage
   - Matches URL patterns
   - Requests ads from Kevel API
   - Injects banners into the page
   - Handles impression/click tracking

2. **picker.js**: Provides the element picker functionality:
   - Highlights elements on hover
   - Enables selection of target containers
   - Communicates with background script to save selection

#### Background Script

Acts as a communication bridge between different contexts:

- Forwards API requests to the Kevel API
- Handles configuration changes and tab refreshes
- Manages popup reopening after element selection
- Facilitates data sharing between contexts

#### Services

Service classes provide encapsulated functionality:

- **ApiService**: Handles Kevel API communication
- **StorageService**: Manages Chrome storage operations
- **TabService**: Controls tab operations
- **SharingService**: Handles configuration sharing/importing

#### Composables

Composable functions manage application state:

- **useAdConfigs**: Manages ad configuration CRUD operations
- **useDemoMode**: Controls demo mode settings
- **useElementPicker**: Manages element picker state
- **useNavigation**: Handles navigation between pages
- **useNetworkSettings**: Manages API credentials
- **useSharing**: Controls sharing UI and logic

## Project Structure

```
/                              # Root directory
├── public/                    # Static assets
│   ├── background.js          # Background service worker
│   ├── content.js             # Content script for ad injection
│   ├── manifest.json          # Extension manifest
│   ├── picker.js              # Element picker script
│   └── styles.css             # Global styles
├── src/                       # Vue application
│   ├── components/            # Vue components
│   │   ├── AdForm/            # Ad configuration form component
│   │   ├── AdItemMenu/        # Menu for ad configuration actions
│   │   └── ShareString/       # String-based sharing component
│   ├── composables/           # Reusable state and logic
│   │   ├── useAdConfigs.ts    # Ad configuration management
│   │   ├── useDemoMode.ts     # Demo mode settings
│   │   ├── useElementPicker.ts # Element picker functionality
│   │   ├── useNavigation.ts   # Page navigation
│   │   ├── useNetworkSettings.ts # API credentials management
│   │   └── useSharing.ts      # Sharing functionality
│   ├── services/              # External interaction services
│   │   ├── api.service.ts     # Kevel API interactions
│   │   ├── storage.service.ts # Chrome storage operations
│   │   ├── tab.service.ts     # Chrome tabs operations
│   │   └── sharing.service.ts # Configuration encoding/decoding
│   ├── utils/                 # Utility functions
│   │   └── message.ts         # Message display utilities
│   ├── App.vue                # Main application component
│   ├── main.ts                # Application entry point
│   └── types/                 # TypeScript type definitions
├── scripts/                   # Build scripts
├── popup.html                 # Popup HTML template
├── package.json               # Dependencies and scripts
└── tsconfig.json              # TypeScript configuration
```

## Troubleshooting

### Common Issues

- **Ads not appearing**: Verify the URL pattern and container ID
- **API errors**: Check your Network ID and API key in settings
- **Container not found**: Use the element picker to select a valid container
- **Duplicate impressions**: The extension uses debouncing to prevent duplicate tracking notifications
- **Import errors**: Ensure you're using the complete share code without any added spaces

## Development

### Building the Extension

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Clean build artifacts
npm run clean
```

### Key Technologies

- **Vue.js**: UI framework with Composition API
- **TypeScript**: Type-safe JavaScript
- **Chrome Extension API**: Browser integration
- **Kevel API**: Ad serving platform

## License

This project is licensed under the MIT License - see the LICENSE file for details.
