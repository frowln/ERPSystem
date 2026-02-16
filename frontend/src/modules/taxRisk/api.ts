import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { TaxRiskAssessment } from './types';

export interface TaxRiskFilters extends PaginationParams {
  riskLevel?: string;
  status?: string;
  projectId?: string;
  search?: string;
}

export const taxRiskApi = {
  getAll: async (params?: TaxRiskFilters): Promise<PaginatedResponse<TaxRiskAssessment>> => {
    const response = await apiClient.get<PaginatedResponse<TaxRiskAssessment>>('/tax-risk', { params });
    return response.data;
  },

  getById: async (id: string): Promise<TaxRiskAssessment> => {
    const response = await apiClient.get<TaxRiskAssessment>(`/tax-risk/${id}`);
    return response.data;
  },

  create: async (data: Partial<TaxRiskAssessment>): Promise<TaxRiskAssessment> => {
    const response = await apiClient.post<TaxRiskAssessment>('/tax-risk', data);
    return response.data;
  },

  update: async (id: string, data: Partial<TaxRiskAssessment>): Promise<TaxRiskAssessment> => {
    const response = await apiClient.put<TaxRiskAssessment>(`/tax-risk/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tax-risk/${id}`);
  },
};
