// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { integrationsApi } from './integrations';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from './client';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);
const mockPut = vi.mocked(apiClient.put);
const mockDelete = vi.mocked(apiClient.delete);

describe('integrationsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSettings', () => {
    it('calls GET /integrations/settings', async () => {
      const mockData = { integrations: [], totalConfigured: 0, totalConnected: 0, lastGlobalSync: null };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const result = await integrationsApi.getSettings();
      expect(mockGet).toHaveBeenCalledWith('/integrations/settings');
      expect(result).toEqual(mockData);
    });
  });

  describe('oneC', () => {
    it('getConfigs calls GET /integrations/1c/configs', async () => {
      const mockData = { content: [{ id: 'c1', name: 'Config 1' }] };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const result = await integrationsApi.oneC.getConfigs();
      expect(mockGet).toHaveBeenCalledWith('/integrations/1c/configs');
      expect(result).toEqual(mockData);
    });

    it('getConfig calls GET /integrations/1c/configs/:id', async () => {
      const mockConfig = { id: 'c1', name: 'Test Config', baseUrl: 'http://1c.local' };
      mockGet.mockResolvedValue({ data: mockConfig } as never);

      const result = await integrationsApi.oneC.getConfig('c1');
      expect(mockGet).toHaveBeenCalledWith('/integrations/1c/configs/c1');
      expect(result).toEqual(mockConfig);
    });

    it('createConfig calls POST /integrations/1c/configs', async () => {
      const data = {
        name: 'New Config',
        baseUrl: 'http://1c.local',
        username: 'admin',
        password: 'secret',
        databaseName: 'erp',
        syncDirection: 'BIDIRECTIONAL' as const,
        syncIntervalMinutes: 30,
      };
      const created = { id: 'c2', ...data };
      mockPost.mockResolvedValue({ data: created } as never);

      const result = await integrationsApi.oneC.createConfig(data);
      expect(mockPost).toHaveBeenCalledWith('/integrations/1c/configs', data);
      expect(result).toEqual(created);
    });

    it('updateConfig calls PUT /integrations/1c/configs/:id', async () => {
      const data = {
        name: 'Updated',
        baseUrl: 'http://1c.new',
        username: 'admin',
        password: 'secret2',
        databaseName: 'erp',
        syncDirection: 'IMPORT' as const,
        syncIntervalMinutes: 60,
      };
      const updated = { id: 'c1', ...data };
      mockPut.mockResolvedValue({ data: updated } as never);

      const result = await integrationsApi.oneC.updateConfig('c1', data);
      expect(mockPut).toHaveBeenCalledWith('/integrations/1c/configs/c1', data);
      expect(result).toEqual(updated);
    });

    it('deleteConfig calls DELETE /integrations/1c/configs/:id', async () => {
      mockDelete.mockResolvedValue({} as never);

      await integrationsApi.oneC.deleteConfig('c1');
      expect(mockDelete).toHaveBeenCalledWith('/integrations/1c/configs/c1');
    });

    it('toggleConfig calls POST /integrations/1c/configs/:id/toggle', async () => {
      const toggled = { id: 'c1', isActive: true };
      mockPost.mockResolvedValue({ data: toggled } as never);

      const result = await integrationsApi.oneC.toggleConfig('c1');
      expect(mockPost).toHaveBeenCalledWith('/integrations/1c/configs/c1/toggle');
      expect(result).toEqual(toggled);
    });

    it('testConnection calls POST /integrations/1c/configs/:id/test-connection', async () => {
      const testResult = { success: true, healthStatus: 'HEALTHY', message: 'OK', responseTimeMs: 120, testedAt: '2026-01-01' };
      mockPost.mockResolvedValue({ data: testResult } as never);

      const result = await integrationsApi.oneC.testConnection('c1');
      expect(mockPost).toHaveBeenCalledWith('/integrations/1c/configs/c1/test-connection');
      expect(result.success).toBe(true);
    });

    it('getStatus calls GET /integrations/1c/status', async () => {
      mockGet.mockResolvedValue({ data: null } as never);

      const result = await integrationsApi.oneC.getStatus();
      expect(mockGet).toHaveBeenCalledWith('/integrations/1c/status');
      expect(result).toBeNull();
    });

    it('getExchangeLogs passes configId param', async () => {
      const mockData = { content: [] };
      mockGet.mockResolvedValue({ data: mockData } as never);

      await integrationsApi.oneC.getExchangeLogs('c1');
      expect(mockGet).toHaveBeenCalledWith('/integrations/1c/exchange-logs', { params: { configId: 'c1' } });
    });

    it('getExchangeLogs passes empty params when no configId', async () => {
      mockGet.mockResolvedValue({ data: { content: [] } } as never);

      await integrationsApi.oneC.getExchangeLogs();
      expect(mockGet).toHaveBeenCalledWith('/integrations/1c/exchange-logs', { params: {} });
    });
  });

  describe('telegram', () => {
    it('getStatus calls GET /integrations/telegram/status', async () => {
      const status = { enabled: true, configured: true, botUsername: 'test_bot', subscriberCount: 5, pendingMessages: 0, failedMessages: 0 };
      mockGet.mockResolvedValue({ data: status } as never);

      const result = await integrationsApi.telegram.getStatus();
      expect(mockGet).toHaveBeenCalledWith('/integrations/telegram/status');
      expect(result.botUsername).toBe('test_bot');
    });

    it('generateLinkCode calls POST with userId param', async () => {
      const link = { code: 'ABC123', deepLink: 'https://t.me/bot?start=ABC123', expiresAt: '2026-01-01' };
      mockPost.mockResolvedValue({ data: link } as never);

      const result = await integrationsApi.telegram.generateLinkCode('user1');
      expect(mockPost).toHaveBeenCalledWith('/integrations/telegram/generate-link', null, { params: { userId: 'user1' } });
      expect(result.code).toBe('ABC123');
    });

    it('sendTestMessage calls POST with chatId and message', async () => {
      mockPost.mockResolvedValue({ data: { success: true } } as never);

      await integrationsApi.telegram.sendTestMessage('123456', 'Hello!');
      expect(mockPost).toHaveBeenCalledWith('/integrations/telegram/test', { chatId: '123456', message: 'Hello!' });
    });
  });

  describe('sbis', () => {
    it('getConfigs calls GET /integrations/sbis/configs', async () => {
      mockGet.mockResolvedValue({ data: { content: [] } } as never);

      const result = await integrationsApi.sbis.getConfigs();
      expect(mockGet).toHaveBeenCalledWith('/integrations/sbis/configs');
      expect(result.content).toEqual([]);
    });

    it('testConnection calls POST /integrations/sbis/configs/:id/test', async () => {
      const testResult = { success: true, healthStatus: 'HEALTHY', healthStatusDisplayName: '', message: 'OK', responseTimeMs: 80, testedAt: '2026-01-01' };
      mockPost.mockResolvedValue({ data: testResult } as never);

      const result = await integrationsApi.sbis.testConnection('s1');
      expect(mockPost).toHaveBeenCalledWith('/integrations/sbis/configs/s1/test');
      expect(result.success).toBe(true);
    });

    it('syncDocuments calls POST /integrations/sbis/sync', async () => {
      mockPost.mockResolvedValue({} as never);

      await integrationsApi.sbis.syncDocuments();
      expect(mockPost).toHaveBeenCalledWith('/integrations/sbis/sync');
    });
  });

  describe('edo', () => {
    it('getStatus calls GET /integrations/edo/status', async () => {
      const status = { configured: true, connected: true, provider: 'DIADOC', totalDocuments: 10, pendingDocuments: 2, lastReceivedAt: null };
      mockGet.mockResolvedValue({ data: status } as never);

      const result = await integrationsApi.edo.getStatus();
      expect(mockGet).toHaveBeenCalledWith('/integrations/edo/status');
      expect(result.provider).toBe('DIADOC');
    });

    it('getInbox passes provider param', async () => {
      mockGet.mockResolvedValue({ data: { content: [] } } as never);

      await integrationsApi.edo.getInbox('DIADOC');
      expect(mockGet).toHaveBeenCalledWith('/integrations/edo/inbox', { params: { provider: 'DIADOC' } });
    });

    it('getInbox passes empty params when no provider', async () => {
      mockGet.mockResolvedValue({ data: { content: [] } } as never);

      await integrationsApi.edo.getInbox();
      expect(mockGet).toHaveBeenCalledWith('/integrations/edo/inbox', { params: {} });
    });

    it('signDocument calls POST /integrations/edo/:id/sign', async () => {
      mockPost.mockResolvedValue({ data: { signed: true } } as never);

      await integrationsApi.edo.signDocument('doc1');
      expect(mockPost).toHaveBeenCalledWith('/integrations/edo/doc1/sign');
    });

    it('rejectDocument calls POST with reason', async () => {
      mockPost.mockResolvedValue({ data: { rejected: true } } as never);

      await integrationsApi.edo.rejectDocument('doc1', 'Invalid data');
      expect(mockPost).toHaveBeenCalledWith('/integrations/edo/doc1/reject', { reason: 'Invalid data' });
    });
  });

  describe('govRegistries', () => {
    it('getConfigs calls GET /integrations/gov-registries/configs', async () => {
      const mockData = { content: [{ id: 1, registryType: 'FNS', enabled: true }] };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const result = await integrationsApi.govRegistries.getConfigs();
      expect(mockGet).toHaveBeenCalledWith('/integrations/gov-registries/configs');
      expect(result).toEqual(mockData);
    });

    it('updateConfig calls PUT /integrations/gov-registries/configs/:id', async () => {
      const data = { enabled: true, apiUrl: 'https://api.fns.ru' };
      const updated = { id: 1, registryType: 'FNS', ...data, apiKey: 'key', description: 'FNS registry', lastCheckAt: null, status: 'ACTIVE' as const };
      mockPut.mockResolvedValue({ data: updated } as never);

      const result = await integrationsApi.govRegistries.updateConfig(1, data);
      expect(mockPut).toHaveBeenCalledWith('/integrations/gov-registries/configs/1', data);
      expect(result).toEqual(updated);
    });

    it('checkCounterparty calls POST /integrations/gov-registries/check with inn param', async () => {
      const mockResult = { inn: '7712345678', companyName: 'Test LLC', overallRisk: 'LOW', results: [], checkedAt: '2026-01-01' };
      mockPost.mockResolvedValue({ data: mockResult } as never);

      const result = await integrationsApi.govRegistries.checkCounterparty('7712345678');
      expect(mockPost).toHaveBeenCalledWith('/integrations/gov-registries/check', null, { params: { inn: '7712345678' } });
      expect(result.inn).toBe('7712345678');
      expect(result.overallRisk).toBe('LOW');
    });

    it('getCheckHistory calls GET /integrations/gov-registries/history with params', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const params = { inn: '7712345678', page: 0, size: 20 };
      const result = await integrationsApi.govRegistries.getCheckHistory(params);
      expect(mockGet).toHaveBeenCalledWith('/integrations/gov-registries/history', { params });
      expect(result).toEqual(mockData);
    });

    it('getCheckHistory calls GET without params when none provided', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const result = await integrationsApi.govRegistries.getCheckHistory();
      expect(mockGet).toHaveBeenCalledWith('/integrations/gov-registries/history', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('getCheckResult calls GET /integrations/gov-registries/results/:id', async () => {
      const mockResult = { id: 42, registryType: 'FNS', inn: '7712345678', checkDate: '2026-01-01', status: 'OK', riskLevel: 'LOW', details: {}, source: 'FNS' };
      mockGet.mockResolvedValue({ data: mockResult } as never);

      const result = await integrationsApi.govRegistries.getCheckResult(42);
      expect(mockGet).toHaveBeenCalledWith('/integrations/gov-registries/results/42');
      expect(result.id).toBe(42);
      expect(result.status).toBe('OK');
    });
  });

  describe('sms', () => {
    it('getConfig calls GET /integrations/sms/config', async () => {
      const mockConfig = { id: 1, provider: 'SMSC', enabled: true, apiUrl: 'https://smsc.ru/api', apiKey: 'key', senderName: 'Privod', balance: 500, lastSyncAt: null };
      mockGet.mockResolvedValue({ data: mockConfig } as never);

      const result = await integrationsApi.sms.getConfig();
      expect(mockGet).toHaveBeenCalledWith('/integrations/sms/config');
      expect(result.provider).toBe('SMSC');
      expect(result.balance).toBe(500);
    });

    it('updateConfig calls PUT /integrations/sms/config', async () => {
      const data = { enabled: true, senderName: 'PrivodERP' };
      const updated = { id: 1, provider: 'SMSC', enabled: true, apiUrl: 'https://smsc.ru/api', apiKey: 'key', senderName: 'PrivodERP', balance: 500, lastSyncAt: null };
      mockPut.mockResolvedValue({ data: updated } as never);

      const result = await integrationsApi.sms.updateConfig(data);
      expect(mockPut).toHaveBeenCalledWith('/integrations/sms/config', data);
      expect(result.senderName).toBe('PrivodERP');
    });

    it('getMessages calls GET /integrations/sms/messages with params', async () => {
      const mockData = { content: [{ id: 1, recipient: '+79001234567', text: 'Test', status: 'DELIVERED' }], totalElements: 1 };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const params = { page: 0, size: 20, status: 'DELIVERED' };
      const result = await integrationsApi.sms.getMessages(params);
      expect(mockGet).toHaveBeenCalledWith('/integrations/sms/messages', { params });
      expect(result.totalElements).toBe(1);
    });

    it('getMessages calls GET without params when none provided', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const result = await integrationsApi.sms.getMessages();
      expect(mockGet).toHaveBeenCalledWith('/integrations/sms/messages', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('sendMessage calls POST /integrations/sms/send', async () => {
      const data = { recipient: '+79001234567', text: 'Hello from Privod' };
      const sent = { id: 2, recipient: '+79001234567', text: 'Hello from Privod', status: 'PENDING', sentAt: '2026-01-01', deliveredAt: null, provider: 'SMSC', cost: 1.5 };
      mockPost.mockResolvedValue({ data: sent } as never);

      const result = await integrationsApi.sms.sendMessage(data);
      expect(mockPost).toHaveBeenCalledWith('/integrations/sms/send', data);
      expect(result.recipient).toBe('+79001234567');
      expect(result.status).toBe('PENDING');
    });

    it('getBalance calls GET /integrations/sms/balance', async () => {
      const mockBalance = { balance: 1250.50, currency: 'RUB' };
      mockGet.mockResolvedValue({ data: mockBalance } as never);

      const result = await integrationsApi.sms.getBalance();
      expect(mockGet).toHaveBeenCalledWith('/integrations/sms/balance');
      expect(result.balance).toBe(1250.50);
      expect(result.currency).toBe('RUB');
    });
  });

  describe('webdav', () => {
    it('getConfig calls GET /integrations/webdav/config', async () => {
      const mockConfig = { id: 1, serverUrl: 'https://cloud.example.com/dav', username: 'user', password: 'pass', basePath: '/docs', enabled: true, autoSync: true, syncIntervalMinutes: 30, lastSyncAt: null, status: 'CONNECTED' };
      mockGet.mockResolvedValue({ data: mockConfig } as never);

      const result = await integrationsApi.webdav.getConfig();
      expect(mockGet).toHaveBeenCalledWith('/integrations/webdav/config');
      expect(result.serverUrl).toBe('https://cloud.example.com/dav');
      expect(result.status).toBe('CONNECTED');
    });

    it('updateConfig calls PUT /integrations/webdav/config', async () => {
      const data = { serverUrl: 'https://new.cloud.com/dav', enabled: true };
      const updated = { id: 1, serverUrl: 'https://new.cloud.com/dav', username: 'user', password: 'pass', basePath: '/docs', enabled: true, autoSync: true, syncIntervalMinutes: 30, lastSyncAt: null, status: 'CONNECTED' };
      mockPut.mockResolvedValue({ data: updated } as never);

      const result = await integrationsApi.webdav.updateConfig(data);
      expect(mockPut).toHaveBeenCalledWith('/integrations/webdav/config', data);
      expect(result.serverUrl).toBe('https://new.cloud.com/dav');
    });

    it('getFiles calls GET /integrations/webdav/files with params', async () => {
      const mockData = { content: [{ id: 1, fileName: 'doc.pdf', syncStatus: 'SYNCED' }], totalElements: 1 };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const params = { page: 0, size: 50, status: 'SYNCED' };
      const result = await integrationsApi.webdav.getFiles(params);
      expect(mockGet).toHaveBeenCalledWith('/integrations/webdav/files', { params });
      expect(result.totalElements).toBe(1);
    });

    it('getFiles calls GET without params when none provided', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const result = await integrationsApi.webdav.getFiles();
      expect(mockGet).toHaveBeenCalledWith('/integrations/webdav/files', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('syncAll calls POST /integrations/webdav/sync', async () => {
      const mockResult = { totalFiles: 10, synced: 8, failed: 1, conflicts: 1, duration: 5200 };
      mockPost.mockResolvedValue({ data: mockResult } as never);

      const result = await integrationsApi.webdav.syncAll();
      expect(mockPost).toHaveBeenCalledWith('/integrations/webdav/sync');
      expect(result.synced).toBe(8);
      expect(result.failed).toBe(1);
    });

    it('syncFile calls POST /integrations/webdav/files/:id/sync', async () => {
      const mockFile = { id: 5, remotePath: '/docs/report.pdf', localPath: '/tmp/report.pdf', fileName: 'report.pdf', fileSize: 1024, mimeType: 'application/pdf', syncStatus: 'SYNCED', lastModified: '2026-01-01', syncedAt: '2026-01-01' };
      mockPost.mockResolvedValue({ data: mockFile } as never);

      const result = await integrationsApi.webdav.syncFile(5);
      expect(mockPost).toHaveBeenCalledWith('/integrations/webdav/files/5/sync');
      expect(result.fileName).toBe('report.pdf');
      expect(result.syncStatus).toBe('SYNCED');
    });

    it('testConnection calls POST /integrations/webdav/test-connection', async () => {
      const testResult = { success: true, healthStatus: 'HEALTHY', healthStatusDisplayName: 'Healthy', message: 'Connection OK', responseTimeMs: 95, testedAt: '2026-01-01' };
      mockPost.mockResolvedValue({ data: testResult } as never);

      const result = await integrationsApi.webdav.testConnection();
      expect(mockPost).toHaveBeenCalledWith('/integrations/webdav/test-connection');
      expect(result.success).toBe(true);
      expect(result.responseTimeMs).toBe(95);
    });
  });

  describe('error propagation', () => {
    it('propagates API errors from get requests', async () => {
      const error = new Error('Network Error');
      mockGet.mockRejectedValue(error);

      await expect(integrationsApi.getSettings()).rejects.toThrow('Network Error');
    });

    it('propagates API errors from post requests', async () => {
      const error = new Error('Forbidden');
      mockPost.mockRejectedValue(error);

      await expect(integrationsApi.oneC.testConnection('c1')).rejects.toThrow('Forbidden');
    });
  });
});
