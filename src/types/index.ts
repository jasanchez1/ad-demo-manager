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

export interface KevelAPIResponse<T = any> {
    success: boolean;
    status?: number;
    error?: string;
    data?: T;
}

export interface SiteResponse {
    items: Array<{
        Id: number;
        Title: string;
    }>;
}

export interface AdTypeResponse {
    items: Array<{
        Id: number;
        Name: string;
        Width: number;
        Height: number;
    }>;
}
