export type SettingsTab = 'GENERAL' | 'EMAIL' | 'SECURITY' | 'INTEGRATIONS' | 'NOTIFICATIONS' | 'BACKUP';

export interface CompanySettings {
  id: string;
  name: string;
  inn: string;
  kpp?: string;
  ogrn?: string;
  phone?: string;
  email?: string;
  legalAddress?: string;
  logoUrl?: string;
  currency: string;
  language: string;
  timezone: string;
}

export interface SmtpSettings {
  host: string;
  port: number;
  username: string;
  password: string;
  senderEmail: string;
  senderName?: string;
  useTls: boolean;
}

export interface SecuritySettings {
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  minPasswordLength: number;
  passwordExpiryDays: number;
  twoFactorEnabled: boolean;
}

export type IntegrationStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'CONNECTED' | 'DISCONNECTED';

export type IntegrationType = '1c' | 'BANK' | 'SBIS' | 'EDO' | 'EMAIL' | 'TELEGRAM';

export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  description: string;
  status: IntegrationStatus;
  lastSyncAt?: string;
  syncInterval?: string;
  version?: string;
  documentsProcessed?: number;
  serverUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSetting {
  id: string;
  type: string;
  label: string;
  description: string;
  channels: NotificationChannelConfig;
}

export interface NotificationChannelConfig {
  email: boolean;
  push: boolean;
  telegram: boolean;
  inApp: boolean;
}

export type BackupStatus = 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';

export type BackupType = 'AUTO' | 'MANUAL';

export interface Backup {
  id: string;
  createdAt: string;
  size: string;
  status: BackupStatus;
  type: BackupType;
}

export interface BackupSchedule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  time: string;
  retentionDays: number;
  includeAttachments: boolean;
}

export type AdminUserStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING';

export type AdminUserRole = 'ADMIN' | 'MANAGER' | 'ENGINEER' | 'ACCOUNTANT' | 'VIEWER';

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  groups: string[];
  lastLoginAt?: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  ipAddress: string;
  userAgent: string;
  startedAt: string;
  lastActivityAt: string;
  isCurrent: boolean;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface PermGroup {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  userCount: number;
  isSystem: boolean;
  children?: PermGroup[];
}

export interface ModelAccessRow {
  model: string;
  label: string;
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface RecordRuleRow {
  id: string;
  model: string;
  name: string;
  domain: string;
  permRead: boolean;
  permWrite: boolean;
  isActive: boolean;
}

export interface FieldAccessRow {
  id: string;
  model: string;
  field: string;
  fieldLabel: string;
  canRead: boolean;
  canWrite: boolean;
}

export interface GroupUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: AdminUserRole;
  password: string;
  groups: string[];
}
