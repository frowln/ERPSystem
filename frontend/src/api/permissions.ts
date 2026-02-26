import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export interface PermissionGroup {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  parentName?: string;
  userCount: number;
  isSystem: boolean;
  children?: PermissionGroup[];
  createdAt: string;
}

export interface ModelAccess {
  id: string;
  groupId: string;
  modelName: string;
  modelLabel: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface RecordRule {
  id: string;
  groupId: string;
  modelName: string;
  modelLabel: string;
  name: string;
  domainFilter: string;
  permRead: boolean;
  permWrite: boolean;
  permCreate: boolean;
  permUnlink: boolean;
  isActive: boolean;
}

export interface FieldAccess {
  id: string;
  groupId: string;
  modelName: string;
  modelLabel: string;
  fieldName: string;
  fieldLabel: string;
  canRead: boolean;
  canWrite: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  role: string;
  status: 'ACTIVE' | 'BLOCKED' | 'PENDING';
  groups: string[];
  groupNames: string[];
  lastLoginAt?: string;
  createdAt: string;
  avatarUrl?: string;
}

export interface UserSession {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  startedAt: string;
  lastActivityAt: string;
  isCurrent: boolean;
}

export interface UserActivityLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  password: string;
  groups: string[];
}

export const permissionsApi = {
  getPermissionGroups: async (): Promise<PermissionGroup[]> => {
    const response = await apiClient.get<PermissionGroup[]>('/admin/groups');
    return response.data;
  },

  createGroup: async (data: { name: string; description?: string; parentId?: string }): Promise<PermissionGroup> => {
    const response = await apiClient.post<PermissionGroup>('/admin/groups', data);
    return response.data;
  },

  updateGroup: async (id: string, data: Partial<PermissionGroup>): Promise<PermissionGroup> => {
    const response = await apiClient.put<PermissionGroup>(`/admin/groups/${id}`, data);
    return response.data;
  },

  deleteGroup: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/groups/${id}`);
  },

  getModelAccess: async (groupId: string): Promise<ModelAccess[]> => {
    const response = await apiClient.get<ModelAccess[]>(`/admin/groups/${groupId}/model-access`);
    return response.data;
  },

  setModelAccess: async (groupId: string, access: ModelAccess[]): Promise<ModelAccess[]> => {
    const response = await apiClient.put<ModelAccess[]>(`/admin/groups/${groupId}/model-access`, { access });
    return response.data;
  },

  getRecordRules: async (groupId: string): Promise<RecordRule[]> => {
    const response = await apiClient.get<RecordRule[]>(`/admin/groups/${groupId}/record-rules`);
    return response.data;
  },

  createRecordRule: async (groupId: string, rule: Omit<RecordRule, 'id' | 'groupId'>): Promise<RecordRule> => {
    const response = await apiClient.post<RecordRule>(`/admin/groups/${groupId}/record-rules`, rule);
    return response.data;
  },

  deleteRecordRule: async (groupId: string, ruleId: string): Promise<void> => {
    await apiClient.delete(`/admin/groups/${groupId}/record-rules/${ruleId}`);
  },

  getFieldAccess: async (groupId: string): Promise<FieldAccess[]> => {
    const response = await apiClient.get<FieldAccess[]>(`/admin/groups/${groupId}/field-access`);
    return response.data;
  },

  setFieldAccess: async (groupId: string, access: FieldAccess[]): Promise<FieldAccess[]> => {
    const response = await apiClient.put<FieldAccess[]>(`/admin/groups/${groupId}/field-access`, { access });
    return response.data;
  },

  getUsers: async (params?: PaginationParams & { search?: string; status?: string }): Promise<PaginatedResponse<AdminUser>> => {
    const response = await apiClient.get<PaginatedResponse<AdminUser>>('/admin/users', { params });
    return response.data;
  },

  getUser: async (id: string): Promise<AdminUser> => {
    const response = await apiClient.get<AdminUser>(`/admin/users/${id}`);
    return response.data;
  },

  createUser: async (data: CreateUserRequest): Promise<AdminUser> => {
    const response = await apiClient.post<AdminUser>('/admin/users', data);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<AdminUser>): Promise<AdminUser> => {
    const response = await apiClient.put<AdminUser>(`/admin/users/${id}`, data);
    return response.data;
  },

  blockUser: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/users/${id}/block`);
  },

  unblockUser: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/users/${id}/unblock`);
  },

  resetPassword: async (id: string): Promise<{ tempPassword: string }> => {
    const response = await apiClient.post<{ tempPassword: string }>(`/admin/users/${id}/reset-password`);
    return response.data;
  },

  forceLogout: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/users/${id}/force-logout`);
  },

  getUserGroups: async (userId: string): Promise<PermissionGroup[]> => {
    const response = await apiClient.get<PermissionGroup[]>(`/admin/users/${userId}/groups`);
    return response.data;
  },

  assignUserToGroup: async (userId: string, groupId: string): Promise<void> => {
    await apiClient.post(`/admin/users/${userId}/groups/${groupId}`);
  },

  removeUserFromGroup: async (userId: string, groupId: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}/groups/${groupId}`);
  },

  getUserSessions: async (userId: string): Promise<UserSession[]> => {
    const response = await apiClient.get<UserSession[]>(`/admin/users/${userId}/sessions`);
    return response.data;
  },

  getUserActivityLog: async (userId: string): Promise<UserActivityLog[]> => {
    const response = await apiClient.get<UserActivityLog[]>(`/admin/users/${userId}/activity`);
    return response.data;
  },
};
