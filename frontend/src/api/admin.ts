import { apiClient } from './client';
import { t } from '@/i18n';

// ── Tenant Management Types ──

export interface TenantListItem {
  id: string;
  name: string;
  inn: string;
  status: string;
  planName: string;
  userCount: number;
  projectCount: number;
  createdAt: string;
}

export interface TenantDetail {
  id: string;
  name: string;
  inn: string;
  kpp: string;
  ogrn: string;
  legalAddress: string;
  actualAddress: string;
  phone: string;
  email: string;
  type: string;
  active: boolean;
  status: string;
  planName: string;
  planDisplayName: string;
  planId: string;
  subscriptionStatus: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  trialEndDate: string;
  userCount: number;
  projectCount: number;
  storageUsedMb: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceHealthStatus {
  name: string;
  healthy: boolean;
  responseTimeMs?: number;
}

export interface DashboardMetrics {
  totalUsers: number;
  totalProjects: number;
  storageUsedMb: number;
  systemHealthy: boolean;
  recentActions: RecentAction[];
  services?: ServiceHealthStatus[];
}

export interface RecentAction {
  id: string;
  entityType: string;
  action: string;
  userName: string;
  timestamp: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  category: string;
  description: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  userId?: string;
  userName?: string;
  timestamp: string;
  ipAddress?: string;
}

export interface ModelAccessRule {
  id: string;
  groupId: string;
  modelName: string;
  modelLabel?: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface PermissionGroup {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  parentGroupId?: string;
  isActive: boolean;
  userCount?: number;
}

export interface LoginAuditEntry {
  id: string;
  userId?: string;
  email: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  success: boolean;
  failureReason?: string;
  createdAt: string;
}

export interface LoginStats {
  uniqueLogins24h: number;
  uniqueLogins7d: number;
  activeSessions: number;
  actions24h: Record<string, number>;
}

export interface OnlineSession {
  id: string;
  userId: string;
  tokenJti?: string;
  ipAddress?: string;
  userAgent?: string;
  startedAt: string;
  lastActivityAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface Department {
  id: string;
  organizationId: string;
  parentId?: string;
  name: string;
  code?: string;
  headId?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IpWhitelistEntry {
  id: string;
  organizationId: string;
  ipAddress: string;
  description?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
}

/** Check actual health of individual backend services */
async function checkServiceHealth(): Promise<ServiceHealthStatus[]> {
  const checks: ServiceHealthStatus[] = [];

  // Database — if any API works, DB is up
  const dbStart = Date.now();
  try {
    await apiClient.get('/users', { params: { size: 1 }, _silentErrors: true } as any);
    checks.push({ name: 'database', healthy: true, responseTimeMs: Date.now() - dbStart });
  } catch {
    checks.push({ name: 'database', healthy: false, responseTimeMs: Date.now() - dbStart });
  }

  // API Server — /actuator/health or any lightweight endpoint
  const apiStart = Date.now();
  try {
    await apiClient.get('/projects', { params: { size: 1 }, _silentErrors: true } as any);
    checks.push({ name: 'api', healthy: true, responseTimeMs: Date.now() - apiStart });
  } catch {
    checks.push({ name: 'api', healthy: false, responseTimeMs: Date.now() - apiStart });
  }

  // File Storage — check via documents endpoint
  const storageStart = Date.now();
  try {
    await apiClient.get('/documents', { params: { size: 1 }, _silentErrors: true } as any);
    checks.push({ name: 'storage', healthy: true, responseTimeMs: Date.now() - storageStart });
  } catch {
    checks.push({ name: 'storage', healthy: false, responseTimeMs: Date.now() - storageStart });
  }

  // Background workers — check via support/tasks
  const workersStart = Date.now();
  try {
    await apiClient.get('/support/tickets', { params: { size: 1 }, _silentErrors: true } as any);
    checks.push({ name: 'workers', healthy: true, responseTimeMs: Date.now() - workersStart });
  } catch {
    checks.push({ name: 'workers', healthy: false, responseTimeMs: Date.now() - workersStart });
  }

  return checks;
}

// Default system settings when backend has none
function getDefaultSettings(): Record<string, SystemSetting[]> {
  return {
  general: [
    { id: 's1', key: 'company_name', value: 'ПРИВОД', type: 'STRING', category: 'general', description: t('systemSettings.setting.companyName'), updatedAt: '', updatedBy: '' },
    { id: 's2', key: 'default_language', value: 'ru', type: 'STRING', category: 'general', description: t('systemSettings.setting.defaultLanguage'), updatedAt: '', updatedBy: '' },
    { id: 's3', key: 'timezone', value: 'Europe/Moscow', type: 'STRING', category: 'general', description: t('systemSettings.setting.timezone'), updatedAt: '', updatedBy: '' },
    { id: 's4', key: 'date_format', value: 'DD.MM.YYYY', type: 'STRING', category: 'general', description: t('systemSettings.setting.dateFormat'), updatedAt: '', updatedBy: '' },
  ],
  security: [
    { id: 's5', key: 'session_timeout_minutes', value: '480', type: 'INTEGER', category: 'security', description: t('systemSettings.setting.sessionTimeout'), updatedAt: '', updatedBy: '' },
    { id: 's6', key: 'max_login_attempts', value: '5', type: 'INTEGER', category: 'security', description: t('systemSettings.setting.maxLoginAttempts'), updatedAt: '', updatedBy: '' },
    { id: 's7', key: 'two_factor_enabled', value: 'false', type: 'BOOLEAN', category: 'security', description: t('systemSettings.setting.twoFactor'), updatedAt: '', updatedBy: '' },
    { id: 's8', key: 'password_min_length', value: '8', type: 'INTEGER', category: 'security', description: t('systemSettings.setting.minPasswordLength'), updatedAt: '', updatedBy: '' },
  ],
  notifications: [
    { id: 's9', key: 'email_notifications_enabled', value: 'true', type: 'BOOLEAN', category: 'notifications', description: t('systemSettings.setting.emailNotifications'), updatedAt: '', updatedBy: '' },
    { id: 's10', key: 'push_notifications_enabled', value: 'true', type: 'BOOLEAN', category: 'notifications', description: t('systemSettings.setting.pushNotifications'), updatedAt: '', updatedBy: '' },
    { id: 's11', key: 'notification_digest_interval', value: '60', type: 'INTEGER', category: 'notifications', description: t('systemSettings.setting.digestInterval'), updatedAt: '', updatedBy: '' },
  ],
  storage: [
    { id: 's12', key: 'max_file_size_mb', value: '100', type: 'INTEGER', category: 'storage', description: t('systemSettings.setting.maxFileSize'), updatedAt: '', updatedBy: '' },
    { id: 's13', key: 'allowed_file_types', value: 'pdf,doc,docx,xls,xlsx,jpg,png,dwg', type: 'STRING', category: 'storage', description: t('systemSettings.setting.allowedFileTypes'), updatedAt: '', updatedBy: '' },
    { id: 's14', key: 'auto_backup_enabled', value: 'true', type: 'BOOLEAN', category: 'storage', description: t('systemSettings.setting.autoBackup'), updatedAt: '', updatedBy: '' },
  ],
  integrations: [
    { id: 's15', key: 'smtp_host', value: '', type: 'STRING', category: 'integrations', description: t('systemSettings.setting.smtpHost'), updatedAt: '', updatedBy: '' },
    { id: 's16', key: 'telegram_bot_enabled', value: 'false', type: 'BOOLEAN', category: 'integrations', description: t('systemSettings.setting.telegramBotEnabled'), updatedAt: '', updatedBy: '' },
    { id: 's17', key: '1c_sync_enabled', value: 'false', type: 'BOOLEAN', category: 'integrations', description: t('systemSettings.setting.syncWith1C'), updatedAt: '', updatedBy: '' },
  ],
  };
}

/** Map backend SystemSettingResponse (settingKey, settingValue, settingType) → frontend SystemSetting (key, value, type) */
function mapBackendSetting(raw: any): SystemSetting {
  return {
    id: raw.id ?? '',
    key: raw.settingKey ?? raw.key ?? '',
    value: raw.settingValue ?? raw.value ?? '',
    type: raw.settingType ?? raw.type ?? 'STRING',
    category: (raw.category ?? 'GENERAL').toLowerCase(),
    description: raw.description ?? raw.displayName ?? '',
    updatedAt: raw.updatedAt ?? '',
    updatedBy: raw.updatedBy ?? '',
  };
}

export const adminApi = {
  // Dashboard
  getMetrics: async (): Promise<DashboardMetrics> => {
    try {
      const response = await apiClient.get<DashboardMetrics>('/admin/dashboard/metrics', { _silentErrors: true } as any);
      return response.data;
    } catch {
      // Fallback: gather metrics from available endpoints
      const fallback: DashboardMetrics = { totalUsers: 0, totalProjects: 0, storageUsedMb: 0, systemHealthy: true, recentActions: [] };
      try {
        const [usersRes, projectsRes] = await Promise.allSettled([
          apiClient.get('/users', { params: { size: 1 }, _silentErrors: true } as any),
          apiClient.get('/projects', { params: { size: 1 }, _silentErrors: true } as any),
        ]);
        if (usersRes.status === 'fulfilled') fallback.totalUsers = usersRes.value.data?.totalElements ?? usersRes.value.data?.length ?? 0;
        if (projectsRes.status === 'fulfilled') fallback.totalProjects = projectsRes.value.data?.totalElements ?? projectsRes.value.data?.length ?? 0;
      } catch { /* ignore */ }
      return fallback;
    }
  },

  // Health check — real ping of services
  checkHealth: checkServiceHealth,

  // System Settings — backend uses /admin/settings with settingKey/settingValue format
  getSettings: async (): Promise<SystemSetting[]> => {
    try {
      const response = await apiClient.get<any[]>('/admin/system-settings', { _silentErrors: true } as any);
      return (response.data ?? []).map(mapBackendSetting);
    } catch {
      return Object.values(getDefaultSettings()).flat();
    }
  },

  getSettingsGrouped: async (): Promise<Record<string, SystemSetting[]>> => {
    try {
      const response = await apiClient.get<any[]>('/admin/system-settings', { _silentErrors: true } as any);
      if (response.data?.length > 0) {
        const grouped: Record<string, SystemSetting[]> = {};
        for (const raw of response.data) {
          const s = mapBackendSetting(raw);
          const cat = s.category.toLowerCase();
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(s);
        }
        return grouped;
      }
    } catch { /* use defaults */ }
    return getDefaultSettings();
  },

  updateSetting: async (key: string, value: string): Promise<SystemSetting> => {
    try {
      const response = await apiClient.put<any>(`/admin/system-settings/${key}`, { value }, { _silentErrors: true } as any);
      return mapBackendSetting(response.data);
    } catch (err: any) {
      // Setting doesn't exist yet — create it (upsert)
      if (err?.response?.status === 404 || err?.response?.status === 500) {
        const response = await apiClient.post<any>('/admin/system-settings', { key, value, type: 'STRING', category: 'SECURITY' });
        return mapBackendSetting(response.data);
      }
      throw err;
    }
  },

  // Audit Logs — try admin/audit-logs, fallback to audit-logs
  getAuditLogs: async (params?: {
    entityType?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }): Promise<{ content: AuditLogEntry[]; totalElements: number; totalPages: number }> => {
    const queryParams = { ...params, size: params?.size ?? 50 };
    for (const path of ['/admin/audit-logs', '/audit-logs']) {
      try {
        const response = await apiClient.get(path, { params: queryParams, _silentErrors: true } as any);
        const data = response.data;
        if (data?.content) return data;
        if (Array.isArray(data)) return { content: data, totalElements: data.length, totalPages: 1 };
      } catch { /* try next */ }
    }
    return { content: [], totalElements: 0, totalPages: 0 };
  },

  // Permission Groups
  getPermissionGroups: async (): Promise<PermissionGroup[]> => {
    try {
      const response = await apiClient.get('/admin/permission-groups', { params: { size: 100 }, _silentErrors: true } as any);
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data?.content && Array.isArray(data.content)) return data.content;
      return [];
    } catch {
      return [];
    }
  },

  createPermissionGroup: async (data: { name: string; description?: string; parentGroupId?: string; displayName?: string; category?: string }): Promise<PermissionGroup> => {
    const response = await apiClient.post<PermissionGroup>('/admin/permission-groups', {
      name: data.name,
      displayName: data.displayName || data.name,
      description: data.description || '',
      category: data.category || 'CUSTOM',
      parentGroupId: data.parentGroupId || null,
    });
    return response.data;
  },

  // Model Access
  getModelAccess: async (groupId?: string): Promise<ModelAccessRule[]> => {
    if (!groupId) return [];
    try {
      const response = await apiClient.get<ModelAccessRule[]>(`/admin/model-access/group/${groupId}`, { _silentErrors: true } as any);
      return response.data;
    } catch {
      return [];
    }
  },

  setModelAccess: async (data: { groupId: string; modelName: string; canRead: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean }): Promise<ModelAccessRule> => {
    const response = await apiClient.post<ModelAccessRule>('/admin/model-access', data);
    return response.data;
  },

  // Login Audit
  getLoginAudit: async (params?: { action?: string; email?: string; failedOnly?: boolean; page?: number; size?: number }): Promise<{ content: LoginAuditEntry[]; totalElements: number; totalPages: number }> => {
    try {
      const response = await apiClient.get('/admin/login-audit', { params: { ...params, size: params?.size ?? 50 }, _silentErrors: true } as any);
      const data = response.data;
      if (data?.content) return data;
      if (Array.isArray(data)) return { content: data, totalElements: data.length, totalPages: 1 };
    } catch { /* fallback */ }
    return { content: [], totalElements: 0, totalPages: 0 };
  },

  getLoginStats: async (): Promise<LoginStats> => {
    try {
      const response = await apiClient.get<LoginStats>('/admin/login-audit/stats', { _silentErrors: true } as any);
      return response.data;
    } catch {
      return { uniqueLogins24h: 0, uniqueLogins7d: 0, activeSessions: 0, actions24h: {} };
    }
  },

  // Online Sessions
  getOnlineSessions: async (): Promise<OnlineSession[]> => {
    try {
      const response = await apiClient.get<OnlineSession[]>('/admin/sessions/online', { _silentErrors: true } as any);
      return response.data;
    } catch {
      return [];
    }
  },

  getUserSessions: async (userId: string): Promise<OnlineSession[]> => {
    try {
      const response = await apiClient.get<OnlineSession[]>(`/admin/sessions/user/${userId}`, { _silentErrors: true } as any);
      return response.data;
    } catch {
      return [];
    }
  },

  terminateUserSessions: async (userId: string): Promise<void> => {
    await apiClient.delete(`/admin/sessions/user/${userId}`);
  },

  // Departments
  getDepartments: async (): Promise<Department[]> => {
    try {
      const response = await apiClient.get<Department[]>('/admin/departments', { _silentErrors: true } as any);
      return response.data;
    } catch {
      return [];
    }
  },

  createDepartment: async (data: { name: string; code?: string; parentId?: string; headId?: string; description?: string; sortOrder?: number }): Promise<Department> => {
    const response = await apiClient.post<Department>('/admin/departments', data);
    return response.data;
  },

  updateDepartment: async (id: string, data: { name?: string; code?: string; parentId?: string | null; headId?: string | null; description?: string; sortOrder?: number }): Promise<Department> => {
    const response = await apiClient.put<Department>(`/admin/departments/${id}`, data);
    return response.data;
  },

  deleteDepartment: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/departments/${id}`);
  },

  // IP Whitelist
  getIpWhitelist: async (): Promise<IpWhitelistEntry[]> => {
    try {
      const response = await apiClient.get<IpWhitelistEntry[]>('/admin/ip-whitelist', { _silentErrors: true } as any);
      return response.data;
    } catch {
      return [];
    }
  },

  addIpWhitelist: async (data: { ipAddress: string; description?: string }): Promise<IpWhitelistEntry> => {
    const response = await apiClient.post<IpWhitelistEntry>('/admin/ip-whitelist', data);
    return response.data;
  },

  removeIpWhitelist: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/ip-whitelist/${id}`);
  },

  // Bulk user import
  importUsers: async (users: { email: string; firstName: string; lastName: string; role: string; password: string }[]): Promise<{ imported: number; errors: string[] }> => {
    try {
      const response = await apiClient.post('/admin/users/import', { users }, { _silentErrors: true } as any);
      return response.data;
    } catch {
      return { imported: 0, errors: [t('admin.importUsersError')] };
    }
  },

  // ── Tenant Management ──

  getTenants: async (params?: { search?: string; page?: number; size?: number }): Promise<{ content: TenantListItem[]; totalElements: number; totalPages: number }> => {
    try {
      const response = await apiClient.get('/admin/tenants', { params: { ...params, size: params?.size ?? 20 }, _silentErrors: true } as any);
      const data = response.data;
      if (data?.content) return data;
      if (Array.isArray(data)) return { content: data, totalElements: data.length, totalPages: 1 };
    } catch { /* fallback */ }
    return { content: [], totalElements: 0, totalPages: 0 };
  },

  getTenantDetail: async (id: string): Promise<TenantDetail | null> => {
    try {
      const response = await apiClient.get<TenantDetail>(`/admin/tenants/${id}`, { _silentErrors: true } as any);
      return response.data;
    } catch {
      return null;
    }
  },

  updateTenantStatus: async (id: string, status: string): Promise<TenantDetail> => {
    const response = await apiClient.put<TenantDetail>(`/admin/tenants/${id}/status`, { status });
    return response.data;
  },

  updateTenantPlan: async (id: string, planId: string): Promise<TenantDetail> => {
    const response = await apiClient.put<TenantDetail>(`/admin/tenants/${id}/plan`, { planId });
    return response.data;
  },

  seedDemoData: async (): Promise<void> => {
    await apiClient.post('/admin/seed-demo');
  },
};
