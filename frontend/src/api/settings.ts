import { apiClient } from './client';

// ---- Interfaces used by SettingsPage / ProfilePage ----

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

// ---- Backend system_settings key-value model ----
// The backend stores settings as flat key-value rows with categories:
//   GENERAL, EMAIL, SECURITY, INTEGRATION, NOTIFICATION, BACKUP
// Endpoints: GET /api/admin/settings, GET /api/admin/settings/category/{cat},
//            PUT /api/admin/settings/key/{key}
interface SystemSettingRow {
  id: string;
  settingKey: string;
  settingValue: string;
  settingType: string;
  category: string;
  displayName: string;
  description: string;
  isEditable: boolean;
  isEncrypted: boolean;
}

/** Extract a typed object from flat key-value settings rows */
function settingsToMap(rows: SystemSettingRow[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const r of rows) {
    map[r.settingKey] = r.settingValue;
  }
  return map;
}

/** Convert a flat map back to key-value updates via individual PUT calls */
async function updateSettingsByKeys(data: Record<string, string | number | boolean>): Promise<void> {
  const promises = Object.entries(data).map(([key, value]) =>
    apiClient.put(`/admin/settings/key/${key}`, { settingValue: String(value) }).catch(() => {
      // Ignore keys that don't exist in backend yet
    }),
  );
  await Promise.all(promises);
}

const COMPANY_DEFAULTS: CompanySettings = {
  companyName: '',
  inn: '',
  kpp: '',
  ogrn: '',
  address: '',
  phone: '',
  email: '',
  logoUrl: '',
  defaultCurrency: 'RUB',
  language: 'ru',
  timezone: 'Europe/Moscow',
};

const EMAIL_DEFAULTS: EmailSettings = {
  smtpHost: '',
  smtpPort: 587,
  smtpUsername: '',
  smtpPassword: '',
  fromEmail: '',
  fromName: '',
  useTls: true,
};

const SECURITY_DEFAULTS: SecuritySettings = {
  sessionTimeoutMinutes: 30,
  maxLoginAttempts: 5,
  passwordMinLength: 8,
  twoFactorEnabled: false,
  passwordExpiryDays: 90,
  ipWhitelistEnabled: false,
};

const BACKUP_DEFAULTS: BackupSettings = {
  schedule: 'DAILY',
  retentionDays: 30,
  time: '03:00',
  includeAttachments: true,
};

function mapRowsToCompany(m: Record<string, string>): CompanySettings {
  return {
    companyName: m['company.name'] ?? COMPANY_DEFAULTS.companyName,
    inn: m['company.inn'] ?? COMPANY_DEFAULTS.inn,
    kpp: m['company.kpp'] ?? COMPANY_DEFAULTS.kpp,
    ogrn: m['company.ogrn'] ?? COMPANY_DEFAULTS.ogrn,
    address: m['company.address'] ?? COMPANY_DEFAULTS.address,
    phone: m['company.phone'] ?? COMPANY_DEFAULTS.phone,
    email: m['company.email'] ?? COMPANY_DEFAULTS.email,
    logoUrl: m['company.logoUrl'] ?? COMPANY_DEFAULTS.logoUrl,
    defaultCurrency: m['company.defaultCurrency'] ?? COMPANY_DEFAULTS.defaultCurrency,
    language: m['company.language'] ?? COMPANY_DEFAULTS.language,
    timezone: m['company.timezone'] ?? COMPANY_DEFAULTS.timezone,
  };
}

function mapRowsToEmail(m: Record<string, string>): EmailSettings {
  return {
    smtpHost: m['email.smtpHost'] ?? EMAIL_DEFAULTS.smtpHost,
    smtpPort: Number(m['email.smtpPort']) || EMAIL_DEFAULTS.smtpPort,
    smtpUsername: m['email.smtpUsername'] ?? EMAIL_DEFAULTS.smtpUsername,
    smtpPassword: m['email.smtpPassword'] ?? EMAIL_DEFAULTS.smtpPassword,
    fromEmail: m['email.fromEmail'] ?? EMAIL_DEFAULTS.fromEmail,
    fromName: m['email.fromName'] ?? EMAIL_DEFAULTS.fromName,
    useTls: m['email.useTls'] === 'true' || (m['email.useTls'] === undefined && EMAIL_DEFAULTS.useTls),
  };
}

function mapRowsToSecurity(m: Record<string, string>): SecuritySettings {
  return {
    sessionTimeoutMinutes: Number(m['security.sessionTimeoutMinutes']) || SECURITY_DEFAULTS.sessionTimeoutMinutes,
    maxLoginAttempts: Number(m['security.maxLoginAttempts']) || SECURITY_DEFAULTS.maxLoginAttempts,
    passwordMinLength: Number(m['security.passwordMinLength']) || SECURITY_DEFAULTS.passwordMinLength,
    twoFactorEnabled: m['security.twoFactorEnabled'] === 'true',
    passwordExpiryDays: Number(m['security.passwordExpiryDays']) || SECURITY_DEFAULTS.passwordExpiryDays,
    ipWhitelistEnabled: m['security.ipWhitelistEnabled'] === 'true',
  };
}

function mapRowsToBackup(m: Record<string, string>): BackupSettings {
  return {
    schedule: (m['backup.schedule'] as BackupSettings['schedule']) ?? BACKUP_DEFAULTS.schedule,
    retentionDays: Number(m['backup.retentionDays']) || BACKUP_DEFAULTS.retentionDays,
    time: m['backup.time'] ?? BACKUP_DEFAULTS.time,
    includeAttachments: m['backup.includeAttachments'] === 'true' || (m['backup.includeAttachments'] === undefined && BACKUP_DEFAULTS.includeAttachments),
  };
}

function companyToKeys(data: Partial<CompanySettings>): Record<string, string> {
  const result: Record<string, string> = {};
  if (data.companyName !== undefined) result['company.name'] = data.companyName;
  if (data.inn !== undefined) result['company.inn'] = data.inn;
  if (data.kpp !== undefined) result['company.kpp'] = data.kpp;
  if (data.ogrn !== undefined) result['company.ogrn'] = data.ogrn;
  if (data.address !== undefined) result['company.address'] = data.address;
  if (data.phone !== undefined) result['company.phone'] = data.phone;
  if (data.email !== undefined) result['company.email'] = data.email;
  if (data.logoUrl !== undefined) result['company.logoUrl'] = data.logoUrl;
  if (data.defaultCurrency !== undefined) result['company.defaultCurrency'] = data.defaultCurrency;
  if (data.language !== undefined) result['company.language'] = data.language;
  if (data.timezone !== undefined) result['company.timezone'] = data.timezone;
  return result;
}

export const settingsApi = {
  // ---- Company (GENERAL category) ----
  // Backend: GET /api/admin/settings/category/GENERAL
  getCompanySettings: async (): Promise<CompanySettings> => {
    try {
      const response = await apiClient.get<{ data: SystemSettingRow[] }>('/admin/settings/category/GENERAL');
      const rows: SystemSettingRow[] = response.data?.data ?? response.data as unknown as SystemSettingRow[];
      const m = settingsToMap(Array.isArray(rows) ? rows : []);
      return mapRowsToCompany(m);
    } catch {
      return { ...COMPANY_DEFAULTS };
    }
  },

  updateCompanySettings: async (data: Partial<CompanySettings>): Promise<CompanySettings> => {
    await updateSettingsByKeys(companyToKeys(data));
    return settingsApi.getCompanySettings();
  },

  // ---- Email (EMAIL category) ----
  // Backend: GET /api/admin/settings/category/EMAIL
  getEmailSettings: async (): Promise<EmailSettings> => {
    try {
      const response = await apiClient.get<{ data: SystemSettingRow[] }>('/admin/settings/category/EMAIL');
      const rows: SystemSettingRow[] = response.data?.data ?? response.data as unknown as SystemSettingRow[];
      const m = settingsToMap(Array.isArray(rows) ? rows : []);
      return mapRowsToEmail(m);
    } catch {
      return { ...EMAIL_DEFAULTS };
    }
  },

  updateEmailSettings: async (data: Partial<EmailSettings>): Promise<EmailSettings> => {
    const keys: Record<string, string> = {};
    if (data.smtpHost !== undefined) keys['email.smtpHost'] = data.smtpHost;
    if (data.smtpPort !== undefined) keys['email.smtpPort'] = String(data.smtpPort);
    if (data.smtpUsername !== undefined) keys['email.smtpUsername'] = data.smtpUsername;
    if (data.smtpPassword !== undefined) keys['email.smtpPassword'] = data.smtpPassword;
    if (data.fromEmail !== undefined) keys['email.fromEmail'] = data.fromEmail;
    if (data.fromName !== undefined) keys['email.fromName'] = data.fromName;
    if (data.useTls !== undefined) keys['email.useTls'] = String(data.useTls);
    await updateSettingsByKeys(keys);
    return settingsApi.getEmailSettings();
  },

  testEmailConnection: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>('/admin/settings/email/test');
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return { success: false, message: error.response?.data?.message ?? 'Connection test failed' };
    }
  },

  // ---- Security (SECURITY category) ----
  // Backend: GET /api/admin/settings/category/SECURITY
  getSecuritySettings: async (): Promise<SecuritySettings> => {
    try {
      const response = await apiClient.get<{ data: SystemSettingRow[] }>('/admin/settings/category/SECURITY');
      const rows: SystemSettingRow[] = response.data?.data ?? response.data as unknown as SystemSettingRow[];
      const m = settingsToMap(Array.isArray(rows) ? rows : []);
      return mapRowsToSecurity(m);
    } catch {
      return { ...SECURITY_DEFAULTS };
    }
  },

  updateSecuritySettings: async (data: Partial<SecuritySettings>): Promise<SecuritySettings> => {
    const keys: Record<string, string> = {};
    if (data.sessionTimeoutMinutes !== undefined) keys['security.sessionTimeoutMinutes'] = String(data.sessionTimeoutMinutes);
    if (data.maxLoginAttempts !== undefined) keys['security.maxLoginAttempts'] = String(data.maxLoginAttempts);
    if (data.passwordMinLength !== undefined) keys['security.passwordMinLength'] = String(data.passwordMinLength);
    if (data.twoFactorEnabled !== undefined) keys['security.twoFactorEnabled'] = String(data.twoFactorEnabled);
    if (data.passwordExpiryDays !== undefined) keys['security.passwordExpiryDays'] = String(data.passwordExpiryDays);
    if (data.ipWhitelistEnabled !== undefined) keys['security.ipWhitelistEnabled'] = String(data.ipWhitelistEnabled);
    await updateSettingsByKeys(keys);
    return settingsApi.getSecuritySettings();
  },

  // ---- Integrations ----
  // Backend: GET /api/integrations/settings (IntegrationSettingsController)
  getIntegrations: async (): Promise<Integration[]> => {
    try {
      const response = await apiClient.get<{ data: { integrations: Array<{
        id: string; name: string; type: string; enabled: boolean; status: string; lastSyncAt?: string;
      }> } }>('/integrations/settings');
      const raw = response.data?.data?.integrations ?? [];
      return raw.map((item) => ({
        id: item.id,
        name: item.name,
        type: (item.type?.toUpperCase() === '1C' ? '1c' : item.type?.toUpperCase()) as Integration['type'],
        status: item.status === 'connected' ? 'ACTIVE' as const
          : item.status === 'disconnected' ? 'INACTIVE' as const
          : 'ERROR' as const,
        lastSyncAt: item.lastSyncAt ?? undefined,
      }));
    } catch {
      return [];
    }
  },

  testIntegration: async (_id: string): Promise<{ success: boolean; message: string }> => {
    // TODO: implement backend endpoint POST /api/integrations/settings/{id}/test
    return { success: false, message: 'Integration test not implemented on backend' };
  },

  updateIntegration: async (_id: string, _data: Partial<Integration>): Promise<Integration> => {
    // TODO: implement backend endpoint PUT /api/integrations/settings/{id}
    throw new Error('Integration update not implemented on backend');
  },

  // ---- Notifications ----
  // Backend: GET /api/settings/notifications (NotificationSettingController)
  getNotificationSettings: async (): Promise<NotificationSetting[]> => {
    try {
      const response = await apiClient.get<{ data: Array<{
        id: string;
        notificationType: string;
        notificationTypeDisplayName: string;
        eventType: string;
        eventTypeDisplayName: string;
        isEnabled: boolean;
      }> }>('/settings/notifications');
      const raw = response.data?.data ?? [];
      // Group by eventType, aggregate channels
      const grouped = new Map<string, NotificationSetting>();
      for (const r of raw) {
        const key = r.eventType;
        if (!grouped.has(key)) {
          grouped.set(key, {
            id: r.id,
            type: r.eventType,
            label: r.eventTypeDisplayName,
            description: '',
            channels: { email: false, push: false, telegram: false, inApp: false },
          });
        }
        const entry = grouped.get(key)!;
        const ch = r.notificationType.toLowerCase();
        if (ch === 'email') entry.channels.email = r.isEnabled;
        else if (ch === 'push') entry.channels.push = r.isEnabled;
        else if (ch === 'telegram') entry.channels.telegram = r.isEnabled;
        else if (ch === 'in_app' || ch === 'inapp') entry.channels.inApp = r.isEnabled;
      }
      return Array.from(grouped.values());
    } catch {
      return [];
    }
  },

  updateNotificationSettings: async (settings: NotificationSetting[]): Promise<NotificationSetting[]> => {
    // Backend uses PUT /api/settings/notifications for single updates
    // and POST /api/settings/notifications/bulk for batch updates.
    // Convert our grouped format back to individual rows.
    const items: Array<{ eventType: string; notificationType: string; enabled: boolean }> = [];
    for (const s of settings) {
      items.push({ eventType: s.type, notificationType: 'EMAIL', enabled: s.channels.email });
      items.push({ eventType: s.type, notificationType: 'PUSH', enabled: s.channels.push });
      items.push({ eventType: s.type, notificationType: 'TELEGRAM', enabled: s.channels.telegram });
      items.push({ eventType: s.type, notificationType: 'IN_APP', enabled: s.channels.inApp });
    }
    await apiClient.post('/settings/notifications/bulk', { settings: items });
    return settingsApi.getNotificationSettings();
  },

  // ---- Backup (BACKUP category) ----
  // Backend: GET /api/admin/settings/category/BACKUP
  getBackupSettings: async (): Promise<BackupSettings> => {
    try {
      const response = await apiClient.get<{ data: SystemSettingRow[] }>('/admin/settings/category/BACKUP');
      const rows: SystemSettingRow[] = response.data?.data ?? response.data as unknown as SystemSettingRow[];
      const m = settingsToMap(Array.isArray(rows) ? rows : []);
      return mapRowsToBackup(m);
    } catch {
      return { ...BACKUP_DEFAULTS };
    }
  },

  updateBackupSettings: async (data: Partial<BackupSettings>): Promise<BackupSettings> => {
    const keys: Record<string, string> = {};
    if (data.schedule !== undefined) keys['backup.schedule'] = data.schedule;
    if (data.retentionDays !== undefined) keys['backup.retentionDays'] = String(data.retentionDays);
    if (data.time !== undefined) keys['backup.time'] = data.time;
    if (data.includeAttachments !== undefined) keys['backup.includeAttachments'] = String(data.includeAttachments);
    await updateSettingsByKeys(keys);
    return settingsApi.getBackupSettings();
  },

  getBackupHistory: async (): Promise<BackupEntry[]> => {
    try {
      const response = await apiClient.get('/admin/backups/history', { params: { size: 20 }, _silentErrors: true } as any);
      const items = response.data?.content ?? response.data ?? [];
      return Array.isArray(items) ? items.map((b: any) => ({
        id: b.id ?? '',
        createdAt: b.createdAt ?? b.startedAt ?? '',
        size: b.sizeBytes ? `${(b.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : '—',
        status: (b.status ?? 'COMPLETED').toUpperCase(),
        type: b.backupType ?? 'FULL',
      })) : [];
    } catch {
      return [];
    }
  },

  createBackup: async (): Promise<BackupEntry> => {
    const response = await apiClient.post('/admin/backups/start', { backupType: 'FULL' });
    const b = response.data;
    return {
      id: b.id ?? crypto.randomUUID(),
      createdAt: b.createdAt ?? new Date().toISOString(),
      size: b.sizeBytes ? `${(b.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : '—',
      status: b.status ?? 'IN_PROGRESS',
      type: b.backupType ?? 'MANUAL',
    };
  },

  getEmailTemplates: async (): Promise<EmailTemplate[]> => {
    try {
      const response = await apiClient.get('/admin/email-templates', { params: { size: 100 }, _silentErrors: true } as any);
      const items = response.data?.content ?? response.data ?? [];
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  },

  // ---- Profile ----
  updateProfile: async (data: { firstName?: string; lastName?: string; phone?: string; position?: string }): Promise<void> => {
    await apiClient.put('/auth/profile', data).catch(() => {
      // Fallback: if no dedicated profile endpoint, silently skip
    });
  },

  // ---- Password ----
  // Backend: POST /api/auth/change-password
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await apiClient.post('/auth/change-password', data);
  },

  // ---- Notification Bulk / Defaults (used by ProfilePage) ----
  // Backend: POST /api/settings/notifications/bulk
  saveNotificationBulk: async (settings: unknown): Promise<void> => {
    await apiClient.post('/settings/notifications/bulk', settings);
  },

  // Backend: GET /api/settings/notifications/defaults
  getNotificationDefaults: async (): Promise<unknown> => {
    try {
      const response = await apiClient.get('/settings/notifications/defaults');
      return response.data?.data ?? response.data;
    } catch {
      return [];
    }
  },
};
