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

// --- Gov Registries specific ---

export interface RegistryConfigData {
  id: number;
  registryType: string;
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  description: string;
  lastCheckAt: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
}

export interface CheckResultData {
  id: number;
  registryType: string;
  inn: string;
  checkDate: string;
  status: string;
  riskLevel: string;
  details: Record<string, unknown>;
  source: string;
}

export interface CounterpartyCheckSummaryData {
  inn: string;
  companyName: string;
  overallRisk: string;
  results: CheckResultData[];
  checkedAt: string;
}

// --- SMS specific ---

export interface SmsConfigData {
  id: number;
  provider: string;
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  senderName: string;
  balance: number;
  lastSyncAt: string | null;
}

export interface SmsMessageData {
  id: number;
  recipient: string;
  text: string;
  status: string;
  sentAt: string;
  deliveredAt: string | null;
  provider: string;
  cost: number;
}

export interface SendSmsForm {
  recipient: string;
  text: string;
}

// --- WebDAV specific ---

export interface WebDavConfigData {
  id: number;
  serverUrl: string;
  username: string;
  password: string;
  basePath: string;
  enabled: boolean;
  autoSync: boolean;
  syncIntervalMinutes: number;
  lastSyncAt: string | null;
  status: string;
}

export interface WebDavFileData {
  id: number;
  remotePath: string;
  localPath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  syncStatus: string;
  lastModified: string;
  syncedAt: string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const integrationsApi = {
  // Unified settings
  getSettings: async (): Promise<IntegrationSettingsResponse> => {
    const response = await apiClient.get<IntegrationSettingsResponse>('/integrations/settings', { _silentErrors: true } as any);
    return response.data;
  },

  // 1C endpoints
  oneC: {
    getConfigs: async (): Promise<{ content: OneCConfigData[] }> => {
      const response = await apiClient.get('/integrations/1c/configs', { _silentErrors: true } as any);
      return response.data;
    },
    getConfig: async (id: string): Promise<OneCConfigData> => {
      const response = await apiClient.get(`/integrations/1c/configs/${id}`, { _silentErrors: true } as any);
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
      const response = await apiClient.get('/integrations/1c/status', { _silentErrors: true } as any);
      return response.data;
    },
    getExchangeLogs: async (configId?: string): Promise<{ content: unknown[] }> => {
      const response = await apiClient.get('/integrations/1c/exchange-logs', {
        params: configId ? { configId } : {},
        _silentErrors: true,
      } as any);
      return response.data;
    },
  },

  // Telegram endpoints
  telegram: {
    getConfig: async (organizationId: string): Promise<unknown> => {
      const response = await apiClient.get('/integrations/telegram/config', {
        params: { organizationId },
        _silentErrors: true,
      } as any);
      return response.data;
    },
    updateConfig: async (data: TelegramConfigForm): Promise<unknown> => {
      const response = await apiClient.put('/integrations/telegram/config', data);
      return response.data;
    },
    getStatus: async (): Promise<TelegramStatusData> => {
      const response = await apiClient.get<TelegramStatusData>('/integrations/telegram/status', { _silentErrors: true } as any);
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
      const response = await apiClient.get('/integrations/telegram/subscriptions', { _silentErrors: true } as any);
      return response.data;
    },
    getMessages: async (): Promise<{ content: unknown[] }> => {
      const response = await apiClient.get('/integrations/telegram/messages', { _silentErrors: true } as any);
      return response.data;
    },
  },

  // SBIS endpoints
  sbis: {
    getConfigs: async (): Promise<{ content: SbisConfigData[] }> => {
      const response = await apiClient.get('/integrations/sbis/configs', { _silentErrors: true } as any);
      return response.data;
    },
    getConfig: async (id: string): Promise<SbisConfigData> => {
      const response = await apiClient.get(`/integrations/sbis/configs/${id}`, { _silentErrors: true } as any);
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
      const response = await apiClient.get('/integrations/sbis/documents', { _silentErrors: true } as any);
      return response.data;
    },
  },

  // EDO endpoints
  edo: {
    getStatus: async (): Promise<EdoStatusData> => {
      const response = await apiClient.get<EdoStatusData>('/integrations/edo/status', { _silentErrors: true } as any);
      return response.data;
    },
    getInbox: async (provider?: string): Promise<{ content: unknown[] }> => {
      const response = await apiClient.get('/integrations/edo/inbox', {
        params: provider ? { provider } : {},
        _silentErrors: true,
      } as any);
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
      const response = await apiClient.get(`/integrations/edo/${id}/status`, { _silentErrors: true } as any);
      return response.data;
    },
  },

  // Gov Registries endpoints
  govRegistries: {
    getConfigs: async (): Promise<{ content: RegistryConfigData[] }> => {
      const response = await apiClient.get('/integrations/gov-registries/config', { _silentErrors: true } as any);
      return response.data;
    },
    updateConfig: async (id: number, data: Partial<RegistryConfigData>): Promise<RegistryConfigData> => {
      const response = await apiClient.put(`/integrations/gov-registries/config/${id}`, data);
      return response.data;
    },
    checkCounterparty: async (inn: string): Promise<CounterpartyCheckSummaryData> => {
      const response = await apiClient.post('/integrations/gov-registries/check', null, { params: { inn } });
      return response.data;
    },
    getCheckHistory: async (params?: Record<string, unknown>): Promise<{ content: CheckResultData[]; totalElements: number }> => {
      const response = await apiClient.get('/integrations/gov-registries/results', { params, _silentErrors: true } as any);
      return response.data;
    },
    getCheckResult: async (id: number): Promise<CheckResultData> => {
      const response = await apiClient.get(`/integrations/gov-registries/results/${id}`, { _silentErrors: true } as any);
      return response.data;
    },
  },

  // SMS endpoints
  sms: {
    getConfig: async (): Promise<SmsConfigData> => {
      const response = await apiClient.get('/integrations/sms/config', { _silentErrors: true } as any);
      return response.data;
    },
    updateConfig: async (data: Partial<SmsConfigData>): Promise<SmsConfigData> => {
      const response = await apiClient.put('/integrations/sms/config', data);
      return response.data;
    },
    getMessages: async (params?: Record<string, unknown>): Promise<{ content: SmsMessageData[]; totalElements: number }> => {
      const response = await apiClient.get('/integrations/sms/messages', { params, _silentErrors: true } as any);
      return response.data;
    },
    sendMessage: async (data: SendSmsForm): Promise<SmsMessageData> => {
      const response = await apiClient.post('/integrations/sms/send', data);
      return response.data;
    },
    getBalance: async (): Promise<{ balance: number; currency: string }> => {
      try {
        const config = await apiClient.get<SmsConfigData>('/integrations/sms/config', { _silentErrors: true } as any);
        return { balance: config.data?.balance ?? 0, currency: 'RUB' };
      } catch {
        return { balance: 0, currency: 'RUB' };
      }
    },
  },

  // WebDAV endpoints
  webdav: {
    getConfig: async (): Promise<WebDavConfigData> => {
      const response = await apiClient.get('/integrations/webdav/config', { _silentErrors: true } as any);
      return response.data;
    },
    updateConfig: async (data: Partial<WebDavConfigData>): Promise<WebDavConfigData> => {
      const response = await apiClient.put('/integrations/webdav/config', data);
      return response.data;
    },
    getFiles: async (params?: Record<string, unknown>): Promise<{ content: WebDavFileData[]; totalElements: number }> => {
      const response = await apiClient.get('/integrations/webdav/files', { params, _silentErrors: true } as any);
      return response.data;
    },
    syncAll: async (documentId?: string): Promise<{ totalFiles: number; synced: number; failed: number; conflicts: number; duration: number }> => {
      const docId = documentId ?? 'all';
      const response = await apiClient.post(`/integrations/webdav/sync/${docId}`);
      return response.data;
    },
    syncFile: async (id: number): Promise<WebDavFileData> => {
      const response = await apiClient.post(`/integrations/webdav/sync/${id}`);
      return response.data;
    },
    testConnection: async (): Promise<ConnectionTestResult> => {
      const response = await apiClient.post('/integrations/webdav/test-connection');
      return response.data;
    },
  },
};
