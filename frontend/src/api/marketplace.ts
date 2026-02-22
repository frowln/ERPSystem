import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PluginCategory =
  | 'ANALYTICS'
  | 'INTEGRATION'
  | 'AUTOMATION'
  | 'REPORTING'
  | 'COMMUNICATION'
  | 'SAFETY'
  | 'FINANCE';

export type PluginPrice = 'FREE' | 'PREMIUM' | 'ENTERPRISE';

export type PluginStatus = 'AVAILABLE' | 'INSTALLED' | 'UPDATE_AVAILABLE' | 'DEPRECATED';

export interface MarketplacePlugin {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  category: PluginCategory;
  developer: string;
  developerUrl: string;
  version: string;
  rating: number;
  reviewCount: number;
  installCount: number;
  price: PluginPrice;
  iconUrl: string;
  screenshotUrls: string[];
  tags: string[];
  status: PluginStatus;
  installedVersion?: string;
  installedAt?: string;
  permissions: string[];
  configSchema?: Record<string, unknown>;
}

export interface MarketplaceReview {
  id: string;
  pluginId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface PluginConfig {
  pluginId: string;
  settings: Record<string, unknown>;
  enabled: boolean;
}

export interface MarketplaceFilters {
  category?: PluginCategory;
  search?: string;
  price?: PluginPrice;
  page?: number;
  size?: number;
}

export interface PaginatedPlugins {
  content: MarketplacePlugin[];
  totalElements: number;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const marketplaceApi = {
  getPlugins: async (params?: MarketplaceFilters): Promise<PaginatedPlugins> => {
    const response = await apiClient.get<PaginatedPlugins>('/marketplace/plugins', { params });
    return response.data;
  },

  getPlugin: async (id: string): Promise<MarketplacePlugin> => {
    const response = await apiClient.get<MarketplacePlugin>(`/marketplace/plugins/${id}`);
    return response.data;
  },

  installPlugin: async (id: string): Promise<void> => {
    await apiClient.post(`/marketplace/plugins/${id}/install`);
  },

  uninstallPlugin: async (id: string): Promise<void> => {
    await apiClient.delete(`/marketplace/plugins/${id}/uninstall`);
  },

  getPluginReviews: async (id: string): Promise<MarketplaceReview[]> => {
    const response = await apiClient.get<MarketplaceReview[]>(`/marketplace/plugins/${id}/reviews`);
    return response.data;
  },

  getInstalledPlugins: async (): Promise<MarketplacePlugin[]> => {
    const response = await apiClient.get<MarketplacePlugin[]>('/marketplace/installed');
    return response.data;
  },

  getPluginConfig: async (id: string): Promise<PluginConfig> => {
    const response = await apiClient.get<PluginConfig>(`/marketplace/plugins/${id}/config`);
    return response.data;
  },

  updatePluginConfig: async (id: string, config: PluginConfig): Promise<PluginConfig> => {
    const response = await apiClient.put<PluginConfig>(`/marketplace/plugins/${id}/config`, config);
    return response.data;
  },
};
