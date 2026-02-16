import { apiClient } from './client';
import type {
  Estimate,
  EstimateItem,
  EstimateStatus,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export interface EstimateFilters extends PaginationParams {
  status?: EstimateStatus;
  projectId?: string;
  search?: string;
}

export interface EstimateFinancialSummary {
  totalPlanned: number;
  totalOrdered: number;
  totalInvoiced: number;
  totalSpent: number;
  balance: number;
  executionPercent: number;
}

export const estimatesApi = {
  getEstimates: async (params?: EstimateFilters): Promise<PaginatedResponse<Estimate>> => {
    const response = await apiClient.get<PaginatedResponse<Estimate>>('/estimates', { params });
    return response.data;
  },

  getEstimate: async (id: string): Promise<Estimate> => {
    const response = await apiClient.get<Estimate>(`/estimates/${id}`);
    return response.data;
  },

  getEstimateItems: async (estimateId: string): Promise<EstimateItem[]> => {
    const response = await apiClient.get<EstimateItem[]>(`/estimates/${estimateId}/items`);
    return response.data;
  },

  getEstimateFinancialSummary: async (estimateId: string): Promise<EstimateFinancialSummary> => {
    const response = await apiClient.get<EstimateFinancialSummary>(`/estimates/${estimateId}/financial-summary`);
    return response.data;
  },
};
