import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { ImportJob, ExportJob, OneCConfig, OneCExchangeLog, OneCMapping } from './types';

export interface SyncJobFilters extends PaginationParams {
  endpointId?: string;
}

export interface SyncMappingFilters extends PaginationParams {
  endpointId?: string;
}

export interface IntegrationConfig {
  id: string;
  code: string;
  name: string;
  type: string;
  isActive: boolean;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncJob {
  id: string;
  endpointId: string;
  entityType: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  errorCount: number;
  startedAt: string;
  completedAt?: string;
}

export interface SyncMapping {
  id: string;
  endpointId: string;
  localEntityType: string;
  remoteEntityType: string;
  localField: string;
  remoteField: string;
  transformRule?: string;
  isRequired: boolean;
  createdAt: string;
}

export const dataExchangeApi = {
  // ---- Integration Configs (/api/admin/integrations) ----

  getIntegrations: async (): Promise<IntegrationConfig[]> => {
    const response = await apiClient.get<IntegrationConfig[]>('/admin/integrations');
    return response.data;
  },

  getIntegrationById: async (id: string): Promise<IntegrationConfig> => {
    const response = await apiClient.get<IntegrationConfig>(`/admin/integrations/${id}`);
    return response.data;
  },

  getIntegrationByCode: async (code: string): Promise<IntegrationConfig> => {
    const response = await apiClient.get<IntegrationConfig>(`/admin/integrations/code/${code}`);
    return response.data;
  },

  createIntegration: async (data: Partial<IntegrationConfig>): Promise<IntegrationConfig> => {
    const response = await apiClient.post<IntegrationConfig>('/admin/integrations', data);
    return response.data;
  },

  updateIntegration: async (id: string, data: Partial<IntegrationConfig>): Promise<IntegrationConfig> => {
    const response = await apiClient.put<IntegrationConfig>(`/admin/integrations/${id}`, data);
    return response.data;
  },

  deleteIntegration: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/integrations/${id}`);
  },

  testConnection: async (code: string): Promise<Record<string, unknown>> => {
    const response = await apiClient.post<Record<string, unknown>>(`/admin/integrations/code/${code}/test`);
    return response.data;
  },

  startIntegrationSync: async (code: string): Promise<IntegrationConfig> => {
    const response = await apiClient.post<IntegrationConfig>(`/admin/integrations/code/${code}/sync`);
    return response.data;
  },

  getIntegrationStatus: async (code: string): Promise<Record<string, unknown>> => {
    const response = await apiClient.get<Record<string, unknown>>(`/admin/integrations/code/${code}/status`);
    return response.data;
  },

  // ---- Sync Jobs (/api/admin/integrations/sync) ----

  startSync: async (data: { endpointId: string; entityType: string; direction?: string }): Promise<SyncJob> => {
    const response = await apiClient.post<SyncJob>('/admin/integrations/sync/start', data);
    return response.data;
  },

  cancelSync: async (id: string): Promise<SyncJob> => {
    const response = await apiClient.post<SyncJob>(`/admin/integrations/sync/${id}/cancel`);
    return response.data;
  },

  retrySync: async (id: string): Promise<SyncJob> => {
    const response = await apiClient.post<SyncJob>(`/admin/integrations/sync/${id}/retry`);
    return response.data;
  },

  getSyncJobById: async (id: string): Promise<SyncJob> => {
    const response = await apiClient.get<SyncJob>(`/admin/integrations/sync/${id}`);
    return response.data;
  },

  getSyncHistory: async (params?: SyncJobFilters): Promise<PaginatedResponse<SyncJob>> => {
    const response = await apiClient.get<PaginatedResponse<SyncJob>>('/admin/integrations/sync/history', { params });
    return response.data;
  },

  getLastSync: async (endpointId: string, entityType: string): Promise<SyncJob> => {
    const response = await apiClient.get<SyncJob>('/admin/integrations/sync/last', { params: { endpointId, entityType } });
    return response.data;
  },

  // ---- Sync Mappings (/api/admin/integrations/sync/mappings) ----

  getMappings: async (params?: SyncMappingFilters): Promise<PaginatedResponse<SyncMapping>> => {
    const response = await apiClient.get<PaginatedResponse<SyncMapping>>('/admin/integrations/sync/mappings', { params });
    return response.data;
  },

  getMappingById: async (id: string): Promise<SyncMapping> => {
    const response = await apiClient.get<SyncMapping>(`/admin/integrations/sync/mappings/${id}`);
    return response.data;
  },

  getFieldMappings: async (endpointId: string, localEntityType: string): Promise<SyncMapping[]> => {
    const response = await apiClient.get<SyncMapping[]>('/admin/integrations/sync/mappings/fields', {
      params: { endpointId, localEntityType },
    });
    return response.data;
  },

  createMapping: async (data: Partial<SyncMapping>): Promise<SyncMapping> => {
    const response = await apiClient.post<SyncMapping>('/admin/integrations/sync/mappings', data);
    return response.data;
  },

  updateMapping: async (id: string, data: Partial<SyncMapping>): Promise<SyncMapping> => {
    const response = await apiClient.put<SyncMapping>(`/admin/integrations/sync/mappings/${id}`, data);
    return response.data;
  },

  deleteMapping: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/integrations/sync/mappings/${id}`);
  },
};
