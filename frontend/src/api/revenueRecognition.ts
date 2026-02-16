import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  RevenueContract,
  RevenueContractStatus,
  RevenuePeriod,
} from '@/modules/revenueRecognition/types';

export interface RevenueContractFilters extends PaginationParams {
  status?: RevenueContractStatus;
  method?: string;
  search?: string;
}

export const revenueRecognitionApi = {
  getContracts: async (params?: RevenueContractFilters): Promise<PaginatedResponse<RevenueContract>> => {
    const response = await apiClient.get<PaginatedResponse<RevenueContract>>('/revenue-contracts', { params });
    return response.data;
  },

  getContract: async (id: string): Promise<RevenueContract> => {
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

  changeContractStatus: async (id: string, status: RevenueContractStatus): Promise<RevenueContract> => {
    const response = await apiClient.patch<RevenueContract>(`/revenue-contracts/${id}/status`, { status });
    return response.data;
  },

  getPeriods: async (contractId: string): Promise<RevenuePeriod[]> => {
    const response = await apiClient.get<RevenuePeriod[]>('/revenue-recognition-periods', { params: { contractId } });
    return response.data;
  },

  createPeriod: async (contractId: string, data: Partial<RevenuePeriod>): Promise<RevenuePeriod> => {
    const response = await apiClient.post<RevenuePeriod>('/revenue-recognition-periods', { ...data, contractId });
    return response.data;
  },

  updatePeriod: async (contractId: string, periodId: string, data: Partial<RevenuePeriod>): Promise<RevenuePeriod> => {
    const response = await apiClient.put<RevenuePeriod>(`/revenue-recognition-periods/${periodId}`, data);
    return response.data;
  },

  getDashboard: async (): Promise<{
    totalRevenue: number;
    totalRecognized: number;
    totalCost: number;
    avgMargin: number;
    activeContracts: number;
    periodSummaries: { period: string; recognized: number; cost: number; profit: number }[];
  }> => {
    const response = await apiClient.get('/revenue-contracts/dashboard');
    return response.data;
  },
};
