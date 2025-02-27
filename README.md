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
- Delete configurations using the X icon

### Demo Mode

Enable Demo Mode in settings to add visual highlighting to injected ads, making them easier to identify during testing.

## Technical Details

### Architecture

The extension consists of:

- **Popup UI**: Vue.js application for configuration management
- **Background Script**: Handles API communication and extension events
- **Content Script**: Injects ads into the target website
- **Element Picker**: Visual tool for selecting page elements

### Ad Injection Process

1. Content script loads on matched URLs
2. Active configurations are retrieved from storage
3. For each matching configuration:
   - Request ad decisions from Kevel API
   - Create and inject the ad into the specified container
   - Set up impression tracking using IntersectionObserver
   - Handle click tracking

### Category Parameter Support

When a URL contains a category parameter (e.g., `?category=electronics`), the extension:
1. Extracts the parameter value 
2. Passes it to the Kevel API as a keyword
3. Updates ads when the parameter changes without page reload

## Development

### Project Structure

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
│   ├── App.vue                # Main application component
│   ├── main.ts                # Application entry point
│   └── types/                 # TypeScript type definitions
├── scripts/                   # Build scripts
├── popup.html                 # Popup HTML template
├── package.json               # Dependencies and scripts
└── styles.css                 # Extension styles
```

### Build Process

The build process:
1. Compiles the Vue application
2. Generates icon assets
3. Copies manifest and static files to the distribution folder

## Troubleshooting

### Common Issues

- **Ads not appearing**: Verify the URL pattern and container ID
- **API errors**: Check your Network ID and API key in settings
- **Container not found**: Use the element picker to select a valid container
- **Duplicate impressions**: The extension uses debouncing to prevent duplicate tracking notifications

## License

This project is licensed under the MIT License - see the LICENSE file for details.
