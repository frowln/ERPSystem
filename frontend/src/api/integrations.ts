import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IntegrationSummary {
  id: string;
  name: string;
  description: string;
  type: '1c' | 'TELEGRAM' | 'SBIS' | 'EDO';
  enabled: boolean;
  configured: boolean;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  lastSyncAt: string | null;
  configSummary: string | null;
  documentsProcessed: number;
}

export interface IntegrationSettingsResponse {
  integrations: IntegrationSummary[];
  totalConfigured: number;
  totalConnected: number;
  lastGlobalSync: string | null;
}

export interface ConnectionTestResult {
  success: boolean;
  healthStatus: string;
  healthStatusDisplayName: string;
  message: string;
  responseTimeMs: number;
  testedAt: string;
}

// --- 1C specific ---

export interface OneCConfigForm {
  name: string;
  baseUrl: string;
  username: string;
  password: string;
  databaseName: string;
  syncDirection: 'IMPORT' | 'EXPORT' | 'BIDIRECTIONAL';
  syncIntervalMinutes: number;
}

export interface OneCConfigData {
  id: string;
  name: string;
  baseUrl: string;
  username: string;
  databaseName: string;
  syncDirection: string;
  syncDirectionDisplayName: string;
  isActive: boolean;
  lastSyncAt: string | null;
  syncIntervalMinutes: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// --- Telegram specific ---

export interface TelegramConfigForm {
  botToken: string;
  botUsername: string;
  webhookUrl?: string;
  enabled: boolean;
  chatIds?: string;
  organizationId: string;
}

export interface TelegramLinkCodeResponse {
  code: string;
  deepLink: string;
  expiresAt: string;
}

export interface TelegramStatusData {
  enabled: boolean;
  configured: boolean;
  botUsername: string | null;
  subscriberCount: number;
  pendingMessages: number;
  failedMessages: number;
}

// --- SBIS specific ---

export interface SbisConfigForm {
  name: string;
  apiUrl: string;
  login: string;
  password: string;
  certificateThumbprint?: string;
  organizationInn: string;
  organizationKpp?: string;
  autoSend: boolean;
}

export interface SbisConfigData {
  id: string;
  name: string;
  apiUrl: string;
  login: string;
  certificateThumbprint: string | null;
  organizationInn: string;
  organizationKpp: string | null;
  isActive: boolean;
  autoSend: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- EDO specific ---

export interface EdoStatusData {
  configured: boolean;
  connected: boolean;
  provider: string;
  totalDocuments: number;
  pendingDocuments: number;
  lastReceivedAt: string | null;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const integrationsApi = {
  // Unified settings
  getSettings: async (): Promise<IntegrationSettingsResponse> => {
    const response = await apiClient.get<IntegrationSettingsResponse>('/integrations/settings');
    return response.data;
  },

  // 1C endpoints
  oneC: {
    getConfigs: async (): Promise<{ content: OneCConfigData[] }> => {
      const response = await apiClient.get('/integrations/1c/configs');
      return response.data;
    },
    getConfig: async (id: string): Promise<OneCConfigData> => {
      const response = await apiClient.get(`/integrations/1c/configs/${id}`);
      return response.data;
    },
    createConfig: async (data: OneCConfigForm): Promise<OneCConfigData> => {
      const response = await apiClient.post('/integrations/1c/configs', data);
      return response.data;
    },
    updateConfig: async (id: string, data: OneCConfigForm): Promise<OneCConfigData> => {
      const response = await apiClient.put(`/integrations/1c/configs/${id}`, data);
      return response.data;
    },
    deleteConfig: async (id: string): Promise<void> => {
      await apiClient.delete(`/integrations/1c/configs/${id}`);
    },
    toggleConfig: async (id: string): Promise<OneCConfigData> => {
      const response = await apiClient.post(`/integrations/1c/configs/${id}/toggle`);
      return response.data;
    },
    testConnection: async (id: string): Promise<ConnectionTestResult> => {
      const response = await apiClient.post(`/integrations/1c/configs/${id}/test-connection`);
      return response.data;
    },
    triggerSync: async (id: string): Promise<unknown> => {
      const response = await apiClient.post(`/integrations/1c/configs/${id}/sync`);
      return response.data;
    },
    getStatus: async (): Promise<OneCConfigData | null> => {
      const response = await apiClient.get('/integrations/1c/status');
      return response.data;
    },
    getExchangeLogs: async (configId?: string): Promise<{ content: unknown[] }> => {
      const response = await apiClient.get('/integrations/1c/exchange-logs', {
        params: configId ? { configId } : {},
      });
      return response.data;
    },
  },

  // Telegram endpoints
  telegram: {
    getConfig: async (organizationId: string): Promise<unknown> => {
      const response = await apiClient.get('/integrations/telegram/config', {
        params: { organizationId },
      });
      return response.data;
    },
    updateConfig: async (data: TelegramConfigForm): Promise<unknown> => {
      const response = await apiClient.put('/integrations/telegram/config', data);
      return response.data;
    },
    getStatus: async (): Promise<TelegramStatusData> => {
      const response = await apiClient.get<TelegramStatusData>('/integrations/telegram/status');
      return response.data;
    },
    generateLinkCode: async (userId: string): Promise<TelegramLinkCodeResponse> => {
      const response = await apiClient.post<TelegramLinkCodeResponse>(
        '/integrations/telegram/generate-link',
        null,
        { params: { userId } },
      );
      return response.data;
    },
    sendTestMessage: async (chatId: string, message: string): Promise<unknown> => {
      const response = await apiClient.post('/integrations/telegram/test', { chatId, message });
      return response.data;
    },
    getSubscriptions: async (): Promise<{ content: unknown[] }> => {
      const response = await apiClient.get('/integrations/telegram/subscriptions');
      return response.data;
    },
    getMessages: async (): Promise<{ content: unknown[] }> => {
      const response = await apiClient.get('/integrations/telegram/messages');
      return response.data;
    },
  },

  // SBIS endpoints
  sbis: {
    getConfigs: async (): Promise<{ content: SbisConfigData[] }> => {
      const response = await apiClient.get('/integrations/sbis/configs');
      return response.data;
    },
    getConfig: async (id: string): Promise<SbisConfigData> => {
      const response = await apiClient.get(`/integrations/sbis/configs/${id}`);
      return response.data;
    },
    createConfig: async (data: SbisConfigForm): Promise<SbisConfigData> => {
      const response = await apiClient.post('/integrations/sbis/configs', data);
      return response.data;
    },
    updateConfig: async (id: string, data: SbisConfigForm): Promise<SbisConfigData> => {
      const response = await apiClient.put(`/integrations/sbis/configs/${id}`, data);
      return response.data;
    },
    deleteConfig: async (id: string): Promise<void> => {
      await apiClient.delete(`/integrations/sbis/configs/${id}`);
    },
    toggleConfig: async (id: string): Promise<SbisConfigData> => {
      const response = await apiClient.post(`/integrations/sbis/configs/${id}/toggle`);
      return response.data;
    },
    testConnection: async (id: string): Promise<ConnectionTestResult> => {
      const response = await apiClient.post(`/integrations/sbis/configs/${id}/test`);
      return response.data;
    },
    syncDocuments: async (): Promise<void> => {
      await apiClient.post('/integrations/sbis/sync');
    },
    getDocuments: async (): Promise<{ content: unknown[] }> => {
      const response = await apiClient.get('/integrations/sbis/documents');
      return response.data;
    },
  },

  // EDO endpoints
  edo: {
    getStatus: async (): Promise<EdoStatusData> => {
      const response = await apiClient.get<EdoStatusData>('/integrations/edo/status');
      return response.data;
    },
    getInbox: async (provider?: string): Promise<{ content: unknown[] }> => {
      const response = await apiClient.get('/integrations/edo/inbox', {
        params: provider ? { provider } : {},
      });
      return response.data;
    },
    sendDocument: async (data: unknown): Promise<unknown> => {
      const response = await apiClient.post('/integrations/edo/send', data);
      return response.data;
    },
    signDocument: async (id: string): Promise<unknown> => {
      const response = await apiClient.post(`/integrations/edo/${id}/sign`);
      return response.data;
    },
    rejectDocument: async (id: string, reason: string): Promise<unknown> => {
      const response = await apiClient.post(`/integrations/edo/${id}/reject`, { reason });
      return response.data;
    },
    getDocumentStatus: async (id: string): Promise<unknown> => {
      const response = await apiClient.get(`/integrations/edo/${id}/status`);
      return response.data;
    },
  },
};
