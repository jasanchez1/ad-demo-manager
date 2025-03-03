import type { Site, AdType, KevelAPIResponse, SiteResponse, AdTypeResponse } from '../types';

const MANAGEMENT_URL = "https://api.kevel.co/v1";

export class KevelApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'KevelApiError';
  }
}

export class UnauthorizedError extends KevelApiError {
  constructor(message: string = 'Invalid API key') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Service for interacting with the Kevel API
 */
export class ApiService {
  /**
   * Fetch sites from the Kevel API
   * @param apiKey - The Kevel API key
   * @returns A promise that resolves to an array of sites
   */
  async getSites(apiKey: string): Promise<Site[]> {
    const response = await new Promise<KevelAPIResponse<SiteResponse>>(resolve => {
      chrome.runtime.sendMessage({
        type: 'site',
        apiKey: apiKey
      }, resolve);
    });

    if (!response.success) {
      if (response.status === 403) {
        throw new UnauthorizedError();
      }
      throw new KevelApiError(response.status || 500, response.error || 'Unknown error');
    }

    if (!response.data?.items) {
      throw new KevelApiError(500, 'Invalid response format');
    }

    return response.data.items.map((x) => ({
      id: x.Id,
      name: x.Title
    }));
  }

  /**
   * Fetch ad types from the Kevel API
   * @param apiKey - The Kevel API key
   * @returns A promise that resolves to an array of ad types
   */
  async getAdTypes(apiKey: string): Promise<AdType[]> {
    const response = await new Promise<KevelAPIResponse<AdTypeResponse>>(resolve => {
      chrome.runtime.sendMessage({
        type: 'adtypes',
        apiKey: apiKey
      }, resolve);
    });

    if (!response.success) {
      if (response.status === 403) {
        throw new UnauthorizedError();
      }
      throw new KevelApiError(response.status || 500, response.error || 'Unknown error');
    }

    if (!response.data?.items) {
      throw new KevelApiError(500, 'Invalid response format');
    }

    return response.data.items.map(x => {
      return {
        id: x.Id,
        name: x.Name,
        height: x.Height,
        width: x.Width
      }
    });
  }
}

// Create a singleton instance for use throughout the app
export const apiService = new ApiService();