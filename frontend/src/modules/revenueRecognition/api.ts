import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { RevenueContract, RevenuePeriod, RecognitionMethod, AccountingStandard } from './types';

export interface RevenueContractFilters extends PaginationParams {
  organizationId?: string;
  projectId?: string;
  method?: RecognitionMethod;
  standard?: AccountingStandard;
  search?: string;
}

export interface RevenuePeriodFilters extends PaginationParams {
  revenueContractId: string;
}

export const revenueRecognitionApi = {
  // ---- Revenue Contracts ----

  getContracts: async (params?: RevenueContractFilters): Promise<PaginatedResponse<RevenueContract>> => {
    const response = await apiClient.get<PaginatedResponse<RevenueContract>>('/revenue-contracts', { params });
    return response.data;
  },

  getContractById: async (id: string): Promise<RevenueContract> => {
    const response = await apiClient.get<RevenueContract>(`/revenue-contracts/${id}`);
    return response.data;
  },

  createContract: async (data: Partial<RevenueContract>): Promise<RevenueContract> => {
    const response = await apiClient.post<RevenueContract>('/revenue-contracts', data);
    return response.data;
  },

  updateContract: async (id: string, data: Partial<RevenueContract>): Promise<RevenueContract> => {
    const response = await apiClient.put<RevenueContract>(`/revenue-contracts/${id}`, data);
    return response.data;
  },

  deleteContract: async (id: string): Promise<void> => {
    await apiClient.delete(`/revenue-contracts/${id}`);
  },

  // ---- Revenue Recognition Periods ----

  getPeriods: async (params: RevenuePeriodFilters): Promise<PaginatedResponse<RevenuePeriod>> => {
    const response = await apiClient.get<PaginatedResponse<RevenuePeriod>>('/revenue-recognition-periods', { params });
    return response.data;
  },

  getPeriodById: async (id: string): Promise<RevenuePeriod> => {
    const response = await apiClient.get<RevenuePeriod>(`/revenue-recognition-periods/${id}`);
    return response.data;
  },

  createPeriod: async (data: Partial<RevenuePeriod>): Promise<RevenuePeriod> => {
    const response = await apiClient.post<RevenuePeriod>('/revenue-recognition-periods', data);
    return response.data;
  },

  calculatePeriod: async (id: string, data: { completionPercentage?: number }): Promise<RevenuePeriod> => {
    const response = await apiClient.post<RevenuePeriod>(`/revenue-recognition-periods/${id}/calculate`, data);
    return response.data;
  },

  changePeriodStatus: async (id: string, data: { status: string }): Promise<RevenuePeriod> => {
    const response = await apiClient.patch<RevenuePeriod>(`/revenue-recognition-periods/${id}/status`, data);
    return response.data;
  },

  deletePeriod: async (id: string): Promise<void> => {
    await apiClient.delete(`/revenue-recognition-periods/${id}`);
  },

  // ---- Revenue Adjustments ----

  getAdjustments: async (params?: PaginationParams & { revenueContractId?: string }): Promise<PaginatedResponse<unknown>> => {
    const response = await apiClient.get('/revenue-adjustments', { params });
    return response.data;
  },

  // ---- Completion Percentages ----

  getCompletionPercentages: async (params?: PaginationParams & { revenueContractId?: string }): Promise<PaginatedResponse<unknown>> => {
    const response = await apiClient.get('/completion-percentages', { params });
    return response.data;
  },
};
