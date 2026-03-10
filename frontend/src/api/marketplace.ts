import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Backend ConnectorCategory enum values */
export type PluginCategory =
  | 'ACCOUNTING'
  | 'BIM'
  | 'COST_ESTIMATION'
  | 'MESSAGING'
  | 'BANKING'
  | 'GOVERNMENT';

export type PluginPrice = 'FREE' | 'PREMIUM' | 'ENTERPRISE';

export type PluginStatus = 'AVAILABLE' | 'INSTALLED' | 'UPDATE_AVAILABLE' | 'DEPRECATED';

/** Maps to backend ConnectorResponse */
export interface MarketplacePlugin {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  category: PluginCategory;
  categoryDisplayName: string;
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
  /** Backend fields from ConnectorResponse */
  documentationUrl?: string;
  apiBaseUrl?: string;
  authType?: string;
  authTypeDisplayName?: string;
  isFirstParty?: boolean;
  isActive?: boolean;
  configSchemaJson?: string;
}

/** Maps to backend ConnectorInstallationResponse */
export interface ConnectorInstallation {
  id: string;
  organizationId: string;
  connectorId: string;
  configJson: string | null;
  status: string;
  statusDisplayName: string;
  lastSyncAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
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
// Normalize backend ConnectorResponse → frontend MarketplacePlugin
// Backend does not return: price, rating, installCount, status, developer,
// reviewCount, longDescription, screenshotUrls, tags, permissions.
// ---------------------------------------------------------------------------

function normalizeConnector(raw: Record<string, unknown>): MarketplacePlugin {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    slug: String(raw.slug ?? ''),
    description: String(raw.description ?? ''),
    longDescription: String(raw.longDescription ?? raw.description ?? ''),
    category: (raw.category as PluginCategory) ?? 'ACCOUNTING',
    categoryDisplayName: String(raw.categoryDisplayName ?? ''),
    developer: String(raw.developer ?? 'PRIVOD'),
    developerUrl: String(raw.developerUrl ?? ''),
    version: String(raw.version ?? '1.0.0'),
    rating: Number(raw.rating ?? 0),
    reviewCount: Number(raw.reviewCount ?? 0),
    installCount: Number(raw.installCount ?? 0),
    price: (raw.price as PluginPrice) ?? (raw.isFirstParty ? 'FREE' : 'PREMIUM'),
    iconUrl: String(raw.iconUrl ?? ''),
    screenshotUrls: Array.isArray(raw.screenshotUrls) ? raw.screenshotUrls : [],
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    status: (raw.status as PluginStatus) ?? 'AVAILABLE',
    permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
    documentationUrl: raw.documentationUrl as string | undefined,
    apiBaseUrl: raw.apiBaseUrl as string | undefined,
    authType: raw.authType as string | undefined,
    authTypeDisplayName: raw.authTypeDisplayName as string | undefined,
    isFirstParty: Boolean(raw.isFirstParty),
    isActive: Boolean(raw.isActive),
    configSchemaJson: raw.configSchemaJson as string | undefined,
  };
}

// ---------------------------------------------------------------------------
// API — aligned with IntegrationMarketplaceController endpoints
// ---------------------------------------------------------------------------

export const marketplaceApi = {
  /**
   * GET /api/marketplace/connectors?category=...
   * Backend returns ApiResponse<List<ConnectorResponse>>
   */
  getPlugins: async (params?: MarketplaceFilters): Promise<PaginatedPlugins> => {
    try {
      const response = await apiClient.get('/marketplace/connectors', {
        params: params?.category ? { category: params.category } : undefined,
        _silentErrors: true,
      } as never);
      const raw = response.data;
      // Backend may wrap in ApiResponse { data: [...] } or return array directly
      const list: unknown[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
      const connectors: MarketplacePlugin[] = list.map((item) => normalizeConnector(item as Record<string, unknown>));

      // Client-side filtering (backend only supports category filter)
      let filtered = connectors;
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
        );
      }
      if (params?.price) {
        filtered = filtered.filter((c) => c.price === params.price);
      }
      return { content: filtered, totalElements: filtered.length };
    } catch {
      return { content: [], totalElements: 0 };
    }
  },

  /**
   * GET /api/marketplace/connectors/{slug}
   * Backend returns ApiResponse<ConnectorResponse>
   */
  getPlugin: async (slugOrId: string): Promise<MarketplacePlugin> => {
    const response = await apiClient.get(`/marketplace/connectors/${slugOrId}`);
    const raw = response.data?.data ?? response.data ?? {};
    return normalizeConnector(raw as Record<string, unknown>);
  },

  /**
   * POST /api/marketplace/connectors/{connectorId}/install
   * Backend returns ApiResponse<ConnectorInstallationResponse>
   */
  installPlugin: async (connectorId: string): Promise<ConnectorInstallation> => {
    const response = await apiClient.post<ConnectorInstallation>(
      `/marketplace/connectors/${connectorId}/install`,
    );
    return response.data;
  },

  /** DELETE /api/marketplace/installations/{installationId} → ApiResponse<Void> */
  uninstallPlugin: async (installationId: string): Promise<void> => {
    await apiClient.delete(`/marketplace/installations/${installationId}`);
  },

  /** Reviews — not yet implemented on backend, returns empty array */
  getPluginReviews: async (_id: string): Promise<MarketplaceReview[]> => {
    return [];
  },

  /**
   * GET /api/marketplace/installations
   * Backend returns ApiResponse<List<ConnectorInstallationResponse>>
   */
  getInstalledPlugins: async (): Promise<ConnectorInstallation[]> => {
    try {
      const response = await apiClient.get<ConnectorInstallation[]>('/marketplace/installations');
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  /**
   * GET /api/marketplace/installations/{installationId}
   * Backend returns ApiResponse<ConnectorInstallationResponse>
   */
  getPluginConfig: async (installationId: string): Promise<PluginConfig> => {
    try {
      const response = await apiClient.get<ConnectorInstallation>(
        `/marketplace/installations/${installationId}`,
      );
      const installation = response.data;
      if (!installation) {
        return { pluginId: '', settings: {}, enabled: false };
      }
      let settings: Record<string, unknown> = {};
      if (installation.configJson) {
        try { settings = JSON.parse(installation.configJson); } catch { /* empty */ }
      }
      return {
        pluginId: installation.connectorId,
        settings,
        enabled: installation.status === 'ACTIVE',
      };
    } catch {
      return { pluginId: '', settings: {}, enabled: false };
    }
  },

  /**
   * PUT /api/marketplace/installations/{installationId}/configure
   * Backend expects ConfigureConnectorRequest: { configJson }
   * Returns ApiResponse<ConnectorInstallationResponse>
   */
  updatePluginConfig: async (installationId: string, config: PluginConfig): Promise<PluginConfig> => {
    const configJson = JSON.stringify(config.settings);
    const response = await apiClient.put<ConnectorInstallation>(
      `/marketplace/installations/${installationId}/configure`,
      { configJson },
    );
    const installation = response.data;
    let settings: Record<string, unknown> = {};
    if (installation?.configJson) {
      try { settings = JSON.parse(installation.configJson); } catch { /* empty */ }
    }
    return {
      pluginId: installation?.connectorId ?? '',
      settings,
      enabled: installation?.status === 'ACTIVE',
    };
  },
};
