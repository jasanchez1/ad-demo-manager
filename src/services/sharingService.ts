import type { AdConfig } from '../types';

/**
 * Service for handling sharing and importing ad configurations
 */
export class SharingService {
  /**
   * Encode an ad configuration to a share string
   * @param config - The ad configuration to encode
   * @returns Encoded string representation of the ad configuration
   */
  encodeAdConfig(config: AdConfig): string {
    try {
      const configJson = JSON.stringify(config);
      return btoa(encodeURIComponent(configJson));
    } catch (error) {
      console.error('Error encoding ad config:', error);
      throw new Error('Failed to encode ad configuration');
    }
  }

  /**
   * Decode a share string to an ad configuration
   * @param shareString - The encoded share string
   * @returns The decoded ad configuration
   */
  decodeAdConfig(shareString: string): any {
    try {
      // Trim and remove any whitespace
      const cleanCode = shareString.trim();
      
      // Decode the string
      const jsonString = decodeURIComponent(atob(cleanCode));
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error decoding share string:', error);
      throw new Error('Invalid share code. Please check and try again.');
    }
  }

  /**
   * Validate a decoded ad configuration
   * @param config - The configuration to validate
   * @returns Whether the configuration is valid
   */
  validateAdConfig(config: any): boolean {
    // Basic validation of required fields
    return !!(
      config && 
      config.name && 
      config.adType && 
      config.adType.name && 
      config.adType.width && 
      config.adType.height && 
      config.site && 
      config.site.name && 
      config.url && 
      config.divId
    );
  }
}

// Create a singleton instance for use throughout the app
export const sharingService = new SharingService();