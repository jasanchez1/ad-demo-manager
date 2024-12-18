export interface Site {
    id: number;
    name: string;
  }
  
  export interface AdType {
    id: number;
    name: string;
    width: number;
    height: number;
  }
  
  export interface AdConfig {
    id: number;
    name: string;
    adType: AdType;
    site: Site;
    url: string;
    isActive: boolean;
    divId: string;
    keywordQueryParam?: string;
  }