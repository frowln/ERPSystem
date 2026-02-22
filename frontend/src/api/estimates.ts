import { apiClient } from './client';
import type {
  Estimate,
  EstimateItem,
  EstimateStatus,
  LocalEstimate,
  LocalEstimateLine,
  FmReconciliationItem,
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

  createEstimateFromSpec: async (data: { specificationId: string; name?: string; contractId?: string; notes?: string }): Promise<Estimate> => {
    const response = await apiClient.post<Estimate>('/estimates/from-spec', data);
    return response.data;
  },

  updateEstimate: async (id: string, data: Partial<Estimate>): Promise<Estimate> => {
    const response = await apiClient.put<Estimate>(`/estimates/${id}`, data);
    return response.data;
  },

  // === Local Estimates (normative-based) ===

  getLocalEstimates: async (params?: { projectId?: string; status?: string; page?: number; size?: number }): Promise<PaginatedResponse<LocalEstimate>> => {
    const response = await apiClient.get<PaginatedResponse<LocalEstimate>>('/local-estimates', { params });
    return response.data;
  },

  getLocalEstimate: async (id: string): Promise<{ estimate: LocalEstimate; lines: LocalEstimateLine[] }> => {
    const response = await apiClient.get<{ estimate: LocalEstimate; lines: LocalEstimateLine[] }>(`/local-estimates/${id}`);
    return response.data;
  },

  calculateLocalEstimate: async (id: string): Promise<{ estimate: LocalEstimate; lines: LocalEstimateLine[] }> => {
    const response = await apiClient.post<{ estimate: LocalEstimate; lines: LocalEstimateLine[] }>(`/local-estimates/${id}/calculate`);
    return response.data;
  },

  getFmReconciliation: async (estimateId: string, budgetId: string): Promise<FmReconciliationItem[]> => {
    const response = await apiClient.get<FmReconciliationItem[]>(`/local-estimates/${estimateId}/fm-reconciliation`, {
      params: { budgetId },
    });
    return response.data;
  },
};
