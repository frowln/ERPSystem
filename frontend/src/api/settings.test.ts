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
    it('calls GET /settings/company', async () => {
      const settings = { companyName: 'PRIVOD', inn: '1234567890' };
      mockGet.mockResolvedValue({ data: settings } as never);

      const result = await settingsApi.getCompanySettings();
      expect(mockGet).toHaveBeenCalledWith('/settings/company');
      expect(result).toEqual(settings);
    });
  });

  describe('updateCompanySettings', () => {
    it('calls PUT /settings/company with data', async () => {
      const data = { companyName: 'Updated PRIVOD' };
      const updated = { companyName: 'Updated PRIVOD', inn: '1234567890' };
      mockPut.mockResolvedValue({ data: updated } as never);

      const result = await settingsApi.updateCompanySettings(data);
      expect(mockPut).toHaveBeenCalledWith('/settings/company', data);
      expect(result).toEqual(updated);
    });
  });

  describe('getEmailSettings', () => {
    it('calls GET /settings/email', async () => {
      const settings = { smtpHost: 'smtp.example.com', smtpPort: 587 };
      mockGet.mockResolvedValue({ data: settings } as never);

      const result = await settingsApi.getEmailSettings();
      expect(mockGet).toHaveBeenCalledWith('/settings/email');
      expect(result).toEqual(settings);
    });
  });

  describe('updateEmailSettings', () => {
    it('calls PUT /settings/email with data', async () => {
      const data = { smtpHost: 'new-smtp.example.com' };
      mockPut.mockResolvedValue({ data: { ...data, smtpPort: 587 } } as never);

      const result = await settingsApi.updateEmailSettings(data);
      expect(mockPut).toHaveBeenCalledWith('/settings/email', data);
      expect(result).toEqual({ ...data, smtpPort: 587 });
    });
  });

  describe('testEmailConnection', () => {
    it('calls POST /settings/email/test', async () => {
      const response = { success: true, message: 'Connection successful' };
      mockPost.mockResolvedValue({ data: response } as never);

      const result = await settingsApi.testEmailConnection();
      expect(mockPost).toHaveBeenCalledWith('/settings/email/test');
      expect(result).toEqual(response);
    });
  });

  describe('getSecuritySettings', () => {
    it('calls GET /settings/security', async () => {
      const settings = { sessionTimeoutMinutes: 30, maxLoginAttempts: 5 };
      mockGet.mockResolvedValue({ data: settings } as never);

      const result = await settingsApi.getSecuritySettings();
      expect(mockGet).toHaveBeenCalledWith('/settings/security');
      expect(result).toEqual(settings);
    });
  });

  describe('getIntegrations', () => {
    it('calls GET /settings/integrations', async () => {
      const integrations = [{ id: 'i1', name: '1C', type: '1c', status: 'ACTIVE' }];
      mockGet.mockResolvedValue({ data: integrations } as never);

      const result = await settingsApi.getIntegrations();
      expect(mockGet).toHaveBeenCalledWith('/settings/integrations');
      expect(result).toEqual(integrations);
    });
  });

  describe('testIntegration', () => {
    it('calls POST /settings/integrations/:id/test', async () => {
      const response = { success: true, message: 'Integration OK' };
      mockPost.mockResolvedValue({ data: response } as never);

      const result = await settingsApi.testIntegration('i1');
      expect(mockPost).toHaveBeenCalledWith('/settings/integrations/i1/test');
      expect(result).toEqual(response);
    });
  });

  describe('updateNotificationSettings', () => {
    it('calls PUT /settings/notifications with settings array', async () => {
      const settings = [{ id: 'n1', type: 'PROJECT_UPDATE', label: 'Updates', description: 'desc', channels: { email: true, push: false, telegram: false, inApp: true } }];
      mockPut.mockResolvedValue({ data: settings } as never);

      const result = await settingsApi.updateNotificationSettings(settings as never);
      expect(mockPut).toHaveBeenCalledWith('/settings/notifications', { settings });
      expect(result).toEqual(settings);
    });
  });

  describe('getBackupHistory', () => {
    it('calls GET /settings/backup/history', async () => {
      const history = [{ id: 'b1', status: 'COMPLETED', type: 'AUTO' }];
      mockGet.mockResolvedValue({ data: history } as never);

      const result = await settingsApi.getBackupHistory();
      expect(mockGet).toHaveBeenCalledWith('/settings/backup/history');
      expect(result).toEqual(history);
    });
  });

  describe('createBackup', () => {
    it('calls POST /settings/backup/create', async () => {
      const backup = { id: 'b2', status: 'IN_PROGRESS', type: 'MANUAL' };
      mockPost.mockResolvedValue({ data: backup } as never);

      const result = await settingsApi.createBackup();
      expect(mockPost).toHaveBeenCalledWith('/settings/backup/create');
      expect(result).toEqual(backup);
    });
  });

  describe('getEmailTemplates', () => {
    it('calls GET /settings/email/templates', async () => {
      const templates = [{ id: 't1', name: 'Welcome', subject: 'Welcome!' }];
      mockGet.mockResolvedValue({ data: templates } as never);

      const result = await settingsApi.getEmailTemplates();
      expect(mockGet).toHaveBeenCalledWith('/settings/email/templates');
      expect(result).toEqual(templates);
    });
  });

  describe('error propagation', () => {
    it('propagates API errors from get requests', async () => {
      const error = new Error('Unauthorized');
      mockGet.mockRejectedValue(error);

      await expect(settingsApi.getCompanySettings()).rejects.toThrow('Unauthorized');
    });

    it('propagates API errors from put requests', async () => {
      const error = new Error('Validation Error');
      mockPut.mockRejectedValue(error);

      await expect(settingsApi.updateCompanySettings({})).rejects.toThrow('Validation Error');
    });
  });
});
