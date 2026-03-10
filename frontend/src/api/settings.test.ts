// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { settingsApi } from './settings';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from './client';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);
const mockPut = vi.mocked(apiClient.put);

describe('settingsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCompanySettings', () => {
    it('fetches GENERAL category and maps to CompanySettings', async () => {
      const rows = [
        { settingKey: 'company.name', settingValue: 'PRIVOD' },
        { settingKey: 'company.inn', settingValue: '1234567890' },
      ];
      mockGet.mockResolvedValue({ data: { data: rows } } as never);

      const result = await settingsApi.getCompanySettings();
      expect(mockGet).toHaveBeenCalledWith('/admin/settings/category/GENERAL');
      expect(result.companyName).toBe('PRIVOD');
      expect(result.inn).toBe('1234567890');
    });

    it('returns defaults on error', async () => {
      mockGet.mockRejectedValue(new Error('Unauthorized'));

      const result = await settingsApi.getCompanySettings();
      expect(result.companyName).toBe('');
      expect(result.defaultCurrency).toBe('RUB');
    });
  });

  describe('updateCompanySettings', () => {
    it('calls PUT /admin/settings/key/{key} for each changed field', async () => {
      mockPut.mockResolvedValue({ data: {} } as never);
      // getCompanySettings is called after update — mock the GET
      mockGet.mockResolvedValue({ data: { data: [{ settingKey: 'company.name', settingValue: 'Updated PRIVOD' }] } } as never);

      await settingsApi.updateCompanySettings({ companyName: 'Updated PRIVOD' });
      expect(mockPut).toHaveBeenCalledWith('/admin/settings/key/company.name', { settingValue: 'Updated PRIVOD' });
    });
  });

  describe('getEmailSettings', () => {
    it('fetches EMAIL category and maps to EmailSettings', async () => {
      const rows = [
        { settingKey: 'email.smtpHost', settingValue: 'smtp.example.com' },
        { settingKey: 'email.smtpPort', settingValue: '587' },
      ];
      mockGet.mockResolvedValue({ data: { data: rows } } as never);

      const result = await settingsApi.getEmailSettings();
      expect(mockGet).toHaveBeenCalledWith('/admin/settings/category/EMAIL');
      expect(result.smtpHost).toBe('smtp.example.com');
      expect(result.smtpPort).toBe(587);
    });

    it('returns defaults on error', async () => {
      mockGet.mockRejectedValue(new Error('Network'));

      const result = await settingsApi.getEmailSettings();
      expect(result.smtpHost).toBe('');
      expect(result.useTls).toBe(true);
    });
  });

  describe('testEmailConnection', () => {
    it('calls POST /admin/settings/email/test and returns result', async () => {
      mockPost.mockResolvedValue({ data: { success: true, message: 'Connection OK' } } as never);
      const result = await settingsApi.testEmailConnection();
      expect(mockPost).toHaveBeenCalledWith('/admin/settings/email/test');
      expect(result.success).toBe(true);
    });

    it('returns failure on network error', async () => {
      mockPost.mockRejectedValue({ response: { data: { message: 'SMTP unreachable' } } } as never);
      const result = await settingsApi.testEmailConnection();
      expect(result.success).toBe(false);
      expect(result.message).toBe('SMTP unreachable');
    });
  });

  describe('getSecuritySettings', () => {
    it('fetches SECURITY category and maps to SecuritySettings', async () => {
      const rows = [
        { settingKey: 'security.sessionTimeoutMinutes', settingValue: '60' },
        { settingKey: 'security.maxLoginAttempts', settingValue: '3' },
      ];
      mockGet.mockResolvedValue({ data: { data: rows } } as never);

      const result = await settingsApi.getSecuritySettings();
      expect(mockGet).toHaveBeenCalledWith('/admin/settings/category/SECURITY');
      expect(result.sessionTimeoutMinutes).toBe(60);
      expect(result.maxLoginAttempts).toBe(3);
    });
  });

  describe('getIntegrations', () => {
    it('fetches from /integrations/settings and maps statuses', async () => {
      const data = {
        integrations: [
          { id: '1c', name: '1С', type: '1c', enabled: true, status: 'connected' },
          { id: 'sbis', name: 'СБИС', type: 'sbis', enabled: false, status: 'disconnected' },
        ],
      };
      mockGet.mockResolvedValue({ data: { data } } as never);

      const result = await settingsApi.getIntegrations();
      expect(mockGet).toHaveBeenCalledWith('/integrations/settings');
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('ACTIVE');
      expect(result[1].status).toBe('INACTIVE');
    });

    it('returns empty array on error', async () => {
      mockGet.mockRejectedValue(new Error('Network'));

      const result = await settingsApi.getIntegrations();
      expect(result).toEqual([]);
    });
  });

  describe('testIntegration', () => {
    it('returns not-implemented response (no backend endpoint)', async () => {
      const result = await settingsApi.testIntegration('1c');
      expect(result.success).toBe(false);
    });
  });

  describe('updateNotificationSettings', () => {
    it('calls POST /settings/notifications/bulk with expanded rows', async () => {
      mockPost.mockResolvedValue({ data: {} } as never);
      // getNotificationSettings is called after → mock GET
      mockGet.mockResolvedValue({ data: { data: [] } } as never);

      const settings = [{
        id: 'n1',
        type: 'TASK_ASSIGNED',
        label: 'Task Assigned',
        description: '',
        channels: { email: true, push: false, telegram: false, inApp: true },
      }];

      await settingsApi.updateNotificationSettings(settings);
      expect(mockPost).toHaveBeenCalledWith('/settings/notifications/bulk', expect.objectContaining({
        settings: expect.arrayContaining([
          expect.objectContaining({ eventType: 'TASK_ASSIGNED', notificationType: 'EMAIL', enabled: true }),
          expect.objectContaining({ eventType: 'TASK_ASSIGNED', notificationType: 'IN_APP', enabled: true }),
        ]),
      }));
    });
  });

  describe('getBackupHistory', () => {
    it('returns empty array (no backend endpoint)', async () => {
      const result = await settingsApi.getBackupHistory();
      expect(result).toEqual([]);
    });
  });

  describe('createBackup', () => {
    it('returns a placeholder backup entry (no backend endpoint)', async () => {
      const result = await settingsApi.createBackup();
      expect(result.status).toBe('IN_PROGRESS');
      expect(result.type).toBe('MANUAL');
    });
  });

  describe('getEmailTemplates', () => {
    it('returns empty array (no backend endpoint)', async () => {
      const result = await settingsApi.getEmailTemplates();
      expect(result).toEqual([]);
    });
  });

  describe('changePassword', () => {
    it('calls POST /auth/change-password', async () => {
      mockPost.mockResolvedValue({ data: {} } as never);

      await settingsApi.changePassword({ currentPassword: 'old', newPassword: 'new' });
      expect(mockPost).toHaveBeenCalledWith('/auth/change-password', { currentPassword: 'old', newPassword: 'new' });
    });
  });

  describe('saveNotificationBulk', () => {
    it('calls POST /settings/notifications/bulk', async () => {
      mockPost.mockResolvedValue({ data: {} } as never);
      const payload = { settings: [{ eventType: 'X', notificationType: 'EMAIL', enabled: true }] };

      await settingsApi.saveNotificationBulk(payload);
      expect(mockPost).toHaveBeenCalledWith('/settings/notifications/bulk', payload);
    });
  });

  describe('getNotificationDefaults', () => {
    it('calls GET /settings/notifications/defaults', async () => {
      mockGet.mockResolvedValue({ data: { data: [{ id: 'd1' }] } } as never);

      const result = await settingsApi.getNotificationDefaults();
      expect(mockGet).toHaveBeenCalledWith('/settings/notifications/defaults');
      expect(result).toEqual([{ id: 'd1' }]);
    });

    it('returns empty array on error', async () => {
      mockGet.mockRejectedValue(new Error('Network'));

      const result = await settingsApi.getNotificationDefaults();
      expect(result).toEqual([]);
    });
  });
});
