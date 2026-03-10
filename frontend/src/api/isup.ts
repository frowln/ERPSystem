import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IsupConfiguration {
  id: string;
  organizationName: string;
  organizationInn: string;
  isupOrgId: string;
  apiUrl: string;
  apiKey: string;
  certificateThumbprint?: string;
  isActive: boolean;
  lastSyncAt?: string;
  createdAt: string;
}

export interface IsupProjectMapping {
  id: string;
  configurationId: string;
  privodProjectId: string;
  privodProjectName: string;
  isupProjectId: string;
  isupProjectName: string;
  syncEnabled: boolean;
  lastSyncAt?: string;
}

export interface IsupTransmission {
  id: string;
  configurationId: string;
  projectMappingId: string;
  projectName?: string;
  transmissionType: 'SCHEDULE' | 'PROGRESS' | 'MILESTONE' | 'COST' | 'PHOTO_REPORT' | 'FINANCIAL';
  status: 'PENDING' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'ERROR';
  sentAt?: string;
  responseAt?: string;
  errorMessage?: string;
  payloadSize: number;
  payloadSizeKb?: number;
  retryCount: number;
}

export interface IsupTransmissionStats {
  total: number;
  sent: number;
  accepted: number;
  rejected: number;
  error: number;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const isupApi = {
  getConfigurations: async (): Promise<IsupConfiguration[]> => {
    const response = await apiClient.get<IsupConfiguration[]>('/isup/configurations');
    return response.data;
  },

  getConfiguration: async (id: string): Promise<IsupConfiguration> => {
    const response = await apiClient.get<IsupConfiguration>(`/isup/configurations/${id}`);
    return response.data;
  },

  createConfiguration: async (data: Partial<IsupConfiguration>): Promise<IsupConfiguration> => {
    const response = await apiClient.post<IsupConfiguration>('/isup/configurations', data);
    return response.data;
  },

  updateConfiguration: async (id: string, data: Partial<IsupConfiguration>): Promise<IsupConfiguration> => {
    const response = await apiClient.put<IsupConfiguration>(`/isup/configurations/${id}`, data);
    return response.data;
  },

  testConnection: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(`/isup/configurations/${id}/test`);
    return response.data;
  },

  getProjectMappings: async (configId: string): Promise<IsupProjectMapping[]> => {
    const response = await apiClient.get<IsupProjectMapping[]>(`/isup/configurations/${configId}/mappings`);
    return response.data;
  },

  createProjectMapping: async (configId: string, data: Partial<IsupProjectMapping>): Promise<IsupProjectMapping> => {
    const response = await apiClient.post<IsupProjectMapping>(`/isup/configurations/${configId}/mappings`, data);
    return response.data;
  },

  updateProjectMapping: async (configId: string, mappingId: string, data: Partial<IsupProjectMapping>): Promise<IsupProjectMapping> => {
    const response = await apiClient.put<IsupProjectMapping>(`/isup/configurations/${configId}/mappings/${mappingId}`, data);
    return response.data;
  },

  deleteProjectMapping: async (_configId: string, mappingId: string): Promise<void> => {
    await apiClient.delete(`/integrations/isup/mappings/${mappingId}`);
  },

  getTransmissions: async (params?: PaginationParams & { status?: string; configId?: string }): Promise<PaginatedResponse<IsupTransmission>> => {
    const response = await apiClient.get<PaginatedResponse<IsupTransmission>>('/isup/transmissions', { params });
    return response.data;
  },

  retryTransmission: async (id: string): Promise<IsupTransmission> => {
    const response = await apiClient.post<IsupTransmission>(`/isup/transmissions/${id}/retry`);
    return response.data;
  },

  getTransmissionStats: async (): Promise<IsupTransmissionStats> => {
    const response = await apiClient.get<IsupTransmissionStats>('/isup/transmissions/stats');
    return response.data;
  },
};
