import { apiClient } from './client';

export interface CompanySettings {
  companyName: string;
  inn: string;
  kpp: string;
  ogrn: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  defaultCurrency: string;
  language: string;
  timezone: string;
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  useTls: boolean;
}

export interface SecuritySettings {
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  twoFactorEnabled: boolean;
  passwordExpiryDays: number;
  ipWhitelistEnabled: boolean;
}

export interface Integration {
  id: string;
  name: string;
  type: '1c' | 'BANK' | 'SBIS' | 'EDO';
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  lastSyncAt?: string;
  config?: Record<string, string>;
  errorMessage?: string;
}

export interface NotificationChannel {
  email: boolean;
  push: boolean;
  telegram: boolean;
  inApp: boolean;
}

export interface NotificationSetting {
  id: string;
  type: string;
  label: string;
  description: string;
  channels: NotificationChannel;
}

export interface BackupEntry {
  id: string;
  createdAt: string;
  size: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  type: 'AUTO' | 'MANUAL';
  downloadUrl?: string;
}

export interface BackupSettings {
  schedule: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  retentionDays: number;
  time: string;
  includeAttachments: boolean;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export const settingsApi = {
  getCompanySettings: async (): Promise<CompanySettings> => {
    const response = await apiClient.get<CompanySettings>('/settings/company');
    return response.data;
  },

  updateCompanySettings: async (data: Partial<CompanySettings>): Promise<CompanySettings> => {
    const response = await apiClient.put<CompanySettings>('/settings/company', data);
    return response.data;
  },

  getEmailSettings: async (): Promise<EmailSettings> => {
    const response = await apiClient.get<EmailSettings>('/settings/email');
    return response.data;
  },

  updateEmailSettings: async (data: Partial<EmailSettings>): Promise<EmailSettings> => {
    const response = await apiClient.put<EmailSettings>('/settings/email', data);
    return response.data;
  },

  testEmailConnection: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>('/settings/email/test');
    return response.data;
  },

  getSecuritySettings: async (): Promise<SecuritySettings> => {
    const response = await apiClient.get<SecuritySettings>('/settings/security');
    return response.data;
  },

  updateSecuritySettings: async (data: Partial<SecuritySettings>): Promise<SecuritySettings> => {
    const response = await apiClient.put<SecuritySettings>('/settings/security', data);
    return response.data;
  },

  getIntegrations: async (): Promise<Integration[]> => {
    const response = await apiClient.get<Integration[]>('/settings/integrations');
    return response.data;
  },

  testIntegration: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(`/settings/integrations/${id}/test`);
    return response.data;
  },

  updateIntegration: async (id: string, data: Partial<Integration>): Promise<Integration> => {
    const response = await apiClient.put<Integration>(`/settings/integrations/${id}`, data);
    return response.data;
  },

  getNotificationSettings: async (): Promise<NotificationSetting[]> => {
    const response = await apiClient.get<NotificationSetting[]>('/settings/notifications');
    return response.data;
  },

  updateNotificationSettings: async (settings: NotificationSetting[]): Promise<NotificationSetting[]> => {
    const response = await apiClient.put<NotificationSetting[]>('/settings/notifications', { settings });
    return response.data;
  },

  getBackupSettings: async (): Promise<BackupSettings> => {
    const response = await apiClient.get<BackupSettings>('/settings/backup');
    return response.data;
  },

  updateBackupSettings: async (data: Partial<BackupSettings>): Promise<BackupSettings> => {
    const response = await apiClient.put<BackupSettings>('/settings/backup', data);
    return response.data;
  },

  getBackupHistory: async (): Promise<BackupEntry[]> => {
    const response = await apiClient.get<BackupEntry[]>('/settings/backup/history');
    return response.data;
  },

  createBackup: async (): Promise<BackupEntry> => {
    const response = await apiClient.post<BackupEntry>('/settings/backup/create');
    return response.data;
  },

  getEmailTemplates: async (): Promise<EmailTemplate[]> => {
    const response = await apiClient.get<EmailTemplate[]>('/settings/email/templates');
    return response.data;
  },
};
