import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  OneCConfig,
  OneCExchangeLog,
  OneCMapping,
  OneCExchangeStatus,
  OneCEntityType,
} from '@/modules/dataExchange/types';

export interface OneCExchangeLogFilters extends PaginationParams {
  configId?: string;
  status?: OneCExchangeStatus;
  entityType?: OneCEntityType;
  search?: string;
}

export const onecApi = {
  getConfigs: async (): Promise<OneCConfig[]> => {
    const response = await apiClient.get<OneCConfig[]>('/integrations/1c/configs');
    return response.data;
  },

  getConfig: async (id: string): Promise<OneCConfig> => {
    const response = await apiClient.get<OneCConfig>(`/integrations/1c/configs/${id}`);
    return response.data;
  },

  createConfig: async (data: Partial<OneCConfig>): Promise<OneCConfig> => {
    const response = await apiClient.post<OneCConfig>('/integrations/1c/configs', data);
    return response.data;
  },

  updateConfig: async (id: string, data: Partial<OneCConfig>): Promise<OneCConfig> => {
    const response = await apiClient.put<OneCConfig>(`/integrations/1c/configs/${id}`, data);
    return response.data;
  },

  toggleConfig: async (id: string, isActive: boolean): Promise<OneCConfig> => {
    const response = await apiClient.patch<OneCConfig>(`/integrations/1c/configs/${id}/toggle`, { isActive });
    return response.data;
  },

  triggerSync: async (id: string): Promise<OneCExchangeLog> => {
    const response = await apiClient.post<OneCExchangeLog>(`/integrations/1c/configs/${id}/sync`);
    return response.data;
  },

  getExchangeLogs: async (params?: OneCExchangeLogFilters): Promise<PaginatedResponse<OneCExchangeLog>> => {
    const response = await apiClient.get<PaginatedResponse<OneCExchangeLog>>('/integrations/1c/exchange-logs', { params });
    return response.data;
  },

  getExchangeLog: async (id: string): Promise<OneCExchangeLog> => {
    const response = await apiClient.get<OneCExchangeLog>(`/integrations/1c/exchange-logs/${id}`);
    return response.data;
  },

  getMappings: async (configId: string, entityType: OneCEntityType): Promise<OneCMapping[]> => {
    const response = await apiClient.get<OneCMapping[]>(`/integrations/1c/configs/${configId}/mappings/${entityType}`);
    return response.data;
  },

  updateMappings: async (configId: string, entityType: OneCEntityType, mappings: OneCMapping[]): Promise<OneCMapping[]> => {
    const response = await apiClient.put<OneCMapping[]>(`/integrations/1c/configs/${configId}/mappings/${entityType}`, mappings);
    return response.data;
  },
};
