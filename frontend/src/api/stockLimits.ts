import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  StockLimit,
  StockLimitType,
  StockLimitAlert,
  StockAlertSeverity,
  StockAlertStatus,
} from '@/modules/warehouse/types';

export interface StockLimitFilters extends PaginationParams {
  limitType?: StockLimitType;
  isBreached?: boolean;
  locationId?: string;
  search?: string;
}

export interface StockAlertFilters extends PaginationParams {
  severity?: StockAlertSeverity;
  status?: StockAlertStatus;
  search?: string;
}

export const stockLimitsApi = {
  getLimits: async (params?: StockLimitFilters): Promise<PaginatedResponse<StockLimit>> => {
    const response = await apiClient.get<PaginatedResponse<StockLimit>>('/warehouse/stock-limits', { params });
    return response.data;
  },

  getLimit: async (id: string): Promise<StockLimit> => {
    const response = await apiClient.get<StockLimit>(`/warehouse/stock-limits/${id}`);
    return response.data;
  },

  createLimit: async (data: Partial<StockLimit>): Promise<StockLimit> => {
    const response = await apiClient.post<StockLimit>('/warehouse/stock-limits', data);
    return response.data;
  },

  updateLimit: async (id: string, data: Partial<StockLimit>): Promise<StockLimit> => {
    const response = await apiClient.put<StockLimit>(`/warehouse/stock-limits/${id}`, data);
    return response.data;
  },

  deleteLimit: async (id: string): Promise<void> => {
    await apiClient.delete(`/warehouse/stock-limits/${id}`);
  },

  getAlerts: async (params?: StockAlertFilters): Promise<PaginatedResponse<StockLimitAlert>> => {
    const response = await apiClient.get<PaginatedResponse<StockLimitAlert>>('/warehouse/stock-limits/alerts', { params });
    return response.data;
  },

  acknowledgeAlert: async (id: string): Promise<StockLimitAlert> => {
    const response = await apiClient.post<StockLimitAlert>(`/warehouse/stock-limits/alerts/${id}/acknowledge`);
    return response.data;
  },

  resolveAlert: async (id: string): Promise<StockLimitAlert> => {
    const response = await apiClient.post<StockLimitAlert>(`/warehouse/stock-limits/alerts/${id}/resolve`);
    return response.data;
  },
};
