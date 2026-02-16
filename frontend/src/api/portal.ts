import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  PortalUser,
  PortalProject,
  PortalMessage,
  PortalDocument,
  PortalAccess,
  CreatePortalUserRequest,
  SendPortalMessageRequest,
} from '@/modules/portal/types';

export interface PortalFilters extends PaginationParams {
  search?: string;
  projectId?: string;
}

export const portalApi = {
  // Portal projects
  getProjects: async (params?: PortalFilters): Promise<PaginatedResponse<PortalProject>> => {
    const response = await apiClient.get<PaginatedResponse<PortalProject>>('/portal/projects', { params });
    return response.data;
  },

  getProject: async (id: string): Promise<PortalProject> => {
    const response = await apiClient.get<PortalProject>(`/portal/projects/${id}`);
    return response.data;
  },

  // Portal documents
  getDocuments: async (params?: PortalFilters): Promise<PaginatedResponse<PortalDocument>> => {
    const response = await apiClient.get<PaginatedResponse<PortalDocument>>('/portal/documents', { params });
    return response.data;
  },

  downloadDocument: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/portal/documents/${id}/download`, { responseType: 'blob' });
    return response.data;
  },

  // Portal messages
  getMessages: async (params?: PortalFilters): Promise<PaginatedResponse<PortalMessage>> => {
    const response = await apiClient.get<PaginatedResponse<PortalMessage>>('/portal/messages', { params });
    return response.data;
  },

  sendMessage: async (data: SendPortalMessageRequest): Promise<PortalMessage> => {
    const response = await apiClient.post<PortalMessage>('/portal/messages', data);
    return response.data;
  },

  markMessageRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/portal/messages/${id}/read`);
  },

  // Portal admin
  getUsers: async (params?: PaginationParams): Promise<PaginatedResponse<PortalUser>> => {
    const response = await apiClient.get<PaginatedResponse<PortalUser>>('/portal/admin/users', { params });
    return response.data;
  },

  createUser: async (data: CreatePortalUserRequest): Promise<PortalUser> => {
    const response = await apiClient.post<PortalUser>('/portal/admin/users', data);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<PortalUser>): Promise<PortalUser> => {
    const response = await apiClient.put<PortalUser>(`/portal/admin/users/${id}`, data);
    return response.data;
  },

  deactivateUser: async (id: string): Promise<void> => {
    await apiClient.patch(`/portal/admin/users/${id}/deactivate`);
  },

  getAccessList: async (params?: PortalFilters): Promise<PaginatedResponse<PortalAccess>> => {
    const response = await apiClient.get<PaginatedResponse<PortalAccess>>('/portal/admin/access', { params });
    return response.data;
  },

  grantAccess: async (userId: string, projectId: string, accessLevel: string): Promise<PortalAccess> => {
    const response = await apiClient.post<PortalAccess>('/portal/admin/access', { userId, projectId, accessLevel });
    return response.data;
  },

  revokeAccess: async (id: string): Promise<void> => {
    await apiClient.delete(`/portal/admin/access/${id}`);
  },

  getDashboardStats: async (): Promise<{
    totalUsers: number;
    activeProjects: number;
    sharedDocuments: number;
    unreadMessages: number;
    recentActivity: { description: string; date: string }[];
  }> => {
    const response = await apiClient.get('/portal/dashboard/stats');
    return response.data;
  },
};
