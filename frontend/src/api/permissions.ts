import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';

// ---------------------------------------------------------------------------
// Types aligned with backend DTOs
// ---------------------------------------------------------------------------

/** Backend: PermissionGroupResponse */
export interface PermissionGroup {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  category?: string;
  parentGroupId?: string;
  isActive: boolean;
  sequence: number;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  // Client-enriched fields (not from backend):
  children?: PermissionGroup[];
  userCount?: number;
}

/** Backend: CreatePermissionGroupRequest */
export interface CreateGroupRequest {
  name: string;
  displayName: string;
  description?: string;
  category: string;
  parentGroupId?: string;
  sequence?: number;
}

/** Backend: UpdatePermissionGroupRequest (no 'name' field — name is immutable) */
export interface UpdateGroupRequest {
  displayName?: string;
  description?: string;
  category?: string;
  parentGroupId?: string;
  sequence?: number;
  isActive?: boolean;
}

/** Backend: ModelAccessResponse */
export interface ModelAccess {
  id: string;
  modelName: string;
  groupId: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Backend: RecordRuleResponse */
export interface RecordRule {
  id: string;
  name: string;
  modelName: string;
  groupId: string;
  domainFilter: string;
  permRead: boolean;
  permWrite: boolean;
  permCreate: boolean;
  permUnlink: boolean;
  isGlobal: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Backend: FieldAccessResponse */
export interface FieldAccess {
  id: string;
  modelName: string;
  fieldName: string;
  groupId: string;
  canRead: boolean;
  canWrite: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Backend: UserResponse (from /api/admin/users) */
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone?: string;
  position?: string;
  avatarUrl?: string;
  enabled: boolean;
  organizationId?: string;
  roles: string[];
  createdAt: string;
  lastLoginAt?: string;
  twoFactorEnabled?: boolean;
  status?: string;
  groupNames?: string[];
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

// ---------------------------------------------------------------------------
// Default list of models for permission matrix (when backend returns empty)
// Covers all main entities in the system
// ---------------------------------------------------------------------------

const DEFAULT_MODEL_NAMES = [
  'Project',
  'ProjectTask',
  'Budget',
  'BudgetItem',
  'Invoice',
  'Contract',
  'Estimate',
  'EstimateItem',
  'Specification',
  'SpecItem',
  'PurchaseRequest',
  'PurchaseOrder',
  'Counterparty',
  'Employee',
  'Department',
  'User',
  'Document',
  'Ks2Document',
  'Ks3Document',
  'DailyReport',
  'Defect',
  'WorkOrder',
  'SafetyIncident',
  'SafetyTraining',
  'Permit',
  'CrmLead',
  'Submittal',
  'HiddenWorkAct',
  'SiteAssessment',
  'Prequalification',
  'AnalyticsReport',
  'SupportTicket',
  'Channel',
  'Message',
  'FleetVehicle',
  'WarehouseItem',
  'CommercialProposal',
  'ChangeOrderRequest',
  'RiskRegister',
  'Meeting',
  'Notification',
];

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const permissionsApi = {
  // ===================== Permission Groups =====================

  getPermissionGroups: async (): Promise<PermissionGroup[]> => {
    try {
      const response = await apiClient.get<PermissionGroup[]>('/admin/permission-groups/active');
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  createGroup: async (data: CreateGroupRequest): Promise<PermissionGroup> => {
    const response = await apiClient.post<PermissionGroup>('/admin/permission-groups', data);
    return response.data;
  },

  updateGroup: async (id: string, data: UpdateGroupRequest): Promise<PermissionGroup> => {
    const response = await apiClient.put<PermissionGroup>(`/admin/permission-groups/${id}`, data);
    return response.data;
  },

  deleteGroup: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/permission-groups/${id}`);
  },

  // ===================== Model Access =====================

  /** Get all known model names (union of DB + default list) */
  getAllModelNames: async (): Promise<string[]> => {
    try {
      const response = await apiClient.get<string[]>('/admin/model-access/models');
      const fromBackend = Array.isArray(response.data) ? response.data : [];
      // Merge with defaults to ensure complete coverage
      const set = new Set([...DEFAULT_MODEL_NAMES, ...fromBackend]);
      return Array.from(set).sort();
    } catch {
      return [...DEFAULT_MODEL_NAMES].sort();
    }
  },

  getModelAccess: async (groupId: string): Promise<ModelAccess[]> => {
    try {
      const response = await apiClient.get<ModelAccess[]>(`/admin/model-access/group/${groupId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  /** Save model access rules — uses individual POST calls (backend has no bulk PUT) */
  setModelAccess: async (groupId: string, access: ModelAccess[]): Promise<ModelAccess[]> => {
    const results: ModelAccess[] = [];
    for (const rule of access) {
      const response = await apiClient.post<ModelAccess>('/admin/model-access', {
        modelName: rule.modelName,
        groupId,
        canRead: rule.canRead,
        canCreate: rule.canCreate,
        canUpdate: rule.canUpdate,
        canDelete: rule.canDelete,
      });
      results.push(response.data);
    }
    return results;
  },

  // ===================== Record Rules =====================

  getRecordRules: async (groupId: string): Promise<RecordRule[]> => {
    try {
      const response = await apiClient.get<RecordRule[]>(`/admin/record-rules/group/${groupId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  createRecordRule: async (groupId: string, rule: Omit<RecordRule, 'id' | 'groupId'>): Promise<RecordRule> => {
    const response = await apiClient.post<RecordRule>('/admin/record-rules', { ...rule, groupId });
    return response.data;
  },

  deleteRecordRule: async (_groupId: string, ruleId: string): Promise<void> => {
    await apiClient.delete(`/admin/record-rules/${ruleId}`);
  },

  // ===================== Field Access =====================

  getFieldAccess: async (groupId: string): Promise<FieldAccess[]> => {
    try {
      const response = await apiClient.get<FieldAccess[]>(`/admin/field-access/group/${groupId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  /** Save field access rules — uses individual POST calls (backend has no bulk PUT) */
  setFieldAccess: async (groupId: string, access: FieldAccess[]): Promise<FieldAccess[]> => {
    const results: FieldAccess[] = [];
    for (const rule of access) {
      const response = await apiClient.post<FieldAccess>('/admin/field-access', {
        modelName: rule.modelName,
        fieldName: rule.fieldName,
        groupId,
        canRead: rule.canRead,
        canWrite: rule.canWrite,
      });
      results.push(response.data);
    }
    return results;
  },

  // ===================== Users =====================

  getUsers: async (params?: PaginationParams & { search?: string; status?: string }): Promise<PaginatedResponse<AdminUser>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<AdminUser>>('/admin/users', { params });
      const data = response.data;
      return {
        content: Array.isArray(data?.content) ? data.content : [],
        totalElements: data?.totalElements ?? 0,
        totalPages: data?.totalPages ?? 0,
        page: data?.page ?? 0,
        size: data?.size ?? 20,
      };
    } catch {
      return { content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 };
    }
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

  // ===================== User-Group Assignments =====================

  /** Get groups for a specific user */
  getUserGroups: async (userId: string): Promise<PermissionGroup[]> => {
    try {
      const response = await apiClient.get<PermissionGroup[]>(`/admin/user-groups/user/${userId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  /** Get user-group assignments for a specific group (returns UserGroupResponse with userId/groupId) */
  getGroupUserAssignments: async (groupId: string): Promise<{ id: string; userId: string; groupId: string }[]> => {
    try {
      const response = await apiClient.get<{ id: string; userId: string; groupId: string }[]>(
        `/admin/user-groups/group/${groupId}/users`,
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  assignUserToGroup: async (userId: string, groupId: string): Promise<void> => {
    await apiClient.post('/admin/user-groups', { userId, groupId });
  },

  bulkAssignUsersToGroup: async (userIds: string[], groupId: string): Promise<void> => {
    await apiClient.post('/admin/user-groups/bulk-assign', { userIds, groupId });
  },

  removeUserFromGroup: async (userId: string, groupId: string): Promise<void> => {
    await apiClient.delete(`/admin/user-groups/user/${userId}/group/${groupId}`);
  },

  // ===================== Sessions & Activity =====================

  getUserSessions: async (userId: string): Promise<UserSession[]> => {
    try {
      const response = await apiClient.get<UserSession[]>(`/admin/users/${userId}/sessions`);
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  getUserActivityLog: async (userId: string): Promise<UserActivityLog[]> => {
    try {
      const response = await apiClient.get<UserActivityLog[]>(`/admin/users/${userId}/activity`);
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },
};
