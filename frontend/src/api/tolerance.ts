import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  ToleranceRule,
  ToleranceCategory,
  ToleranceCheck,
  ToleranceCheckStatus,
} from '@/modules/quality/types';

export interface ToleranceRuleFilters extends PaginationParams {
  category?: ToleranceCategory;
  isActive?: boolean;
  projectId?: string;
  search?: string;
}

export interface ToleranceCheckFilters extends PaginationParams {
  status?: ToleranceCheckStatus;
  ruleId?: string;
  projectId?: string;
  search?: string;
}

export const toleranceApi = {
  getRules: async (params?: ToleranceRuleFilters): Promise<PaginatedResponse<ToleranceRule>> => {
    const response = await apiClient.get<PaginatedResponse<ToleranceRule>>('/tolerances', { params });
    return response.data;
  },

  getRule: async (id: string): Promise<ToleranceRule> => {
    const response = await apiClient.get<ToleranceRule>(`/tolerances/${id}`);
    return response.data;
  },

  createRule: async (data: Partial<ToleranceRule>): Promise<ToleranceRule> => {
    const response = await apiClient.post<ToleranceRule>('/tolerances', data);
    return response.data;
  },

  updateRule: async (id: string, data: Partial<ToleranceRule>): Promise<ToleranceRule> => {
    const response = await apiClient.put<ToleranceRule>(`/tolerances/${id}`, data);
    return response.data;
  },

  getChecks: async (params?: ToleranceCheckFilters): Promise<PaginatedResponse<ToleranceCheck>> => {
    const response = await apiClient.get<PaginatedResponse<ToleranceCheck>>('/tolerances/checks', { params });
    return response.data;
  },

  getCheck: async (id: string): Promise<ToleranceCheck> => {
    const response = await apiClient.get<ToleranceCheck>(`/tolerances/checks/${id}`);
    return response.data;
  },

  createCheck: async (data: Partial<ToleranceCheck>): Promise<ToleranceCheck> => {
    const response = await apiClient.post<ToleranceCheck>('/tolerances/checks', data);
    return response.data;
  },

  updateCheckStatus: async (id: string, status: ToleranceCheckStatus): Promise<ToleranceCheck> => {
    const response = await apiClient.patch<ToleranceCheck>(`/tolerances/checks/${id}/status`, { status });
    return response.data;
  },
};
