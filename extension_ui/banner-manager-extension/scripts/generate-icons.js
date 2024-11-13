const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Define icon sizes needed
const sizes = [16, 32, 48, 128];

// Ensure the dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Generate icons for each size
async function generateIcons() {
  try {
    // Read the source icon
    const sourceIcon = path.join(__dirname, '../public/icon.jpg');
    
    // Generate each size
    for (const size of sizes) {
      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png() // Convert to PNG
        .toFile(path.join(__dirname, `../dist/icon${size}.png`));
      
      console.log(`Generated ${size}x${size} icon`);
    }
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();