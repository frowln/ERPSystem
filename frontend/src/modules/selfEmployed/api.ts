import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  SelfEmployedContractor,
  SelfEmployedPayment,
  SelfEmployedRegistry,
} from './types';

export interface ContractorFilters extends PaginationParams {
  status?: string;
  taxStatus?: string;
  search?: string;
}

export const selfEmployedApi = {
  // Contractors
  getContractors: async (params?: ContractorFilters): Promise<PaginatedResponse<SelfEmployedContractor>> => {
    const response = await apiClient.get<PaginatedResponse<SelfEmployedContractor>>('/self-employed/contractors', { params });
    return response.data;
  },

  getContractor: async (id: string): Promise<SelfEmployedContractor> => {
    const response = await apiClient.get<SelfEmployedContractor>(`/self-employed/contractors/${id}`);
    return response.data;
  },

  createContractor: async (data: Partial<SelfEmployedContractor>): Promise<SelfEmployedContractor> => {
    const response = await apiClient.post<SelfEmployedContractor>('/self-employed/contractors', data);
    return response.data;
  },

  updateContractor: async (id: string, data: Partial<SelfEmployedContractor>): Promise<SelfEmployedContractor> => {
    const response = await apiClient.put<SelfEmployedContractor>(`/self-employed/contractors/${id}`, data);
    return response.data;
  },

  deleteContractor: async (id: string): Promise<void> => {
    await apiClient.delete(`/self-employed/contractors/${id}`);
  },

  // Payments
  getPayments: async (params?: PaginationParams): Promise<PaginatedResponse<SelfEmployedPayment>> => {
    const response = await apiClient.get<PaginatedResponse<SelfEmployedPayment>>('/self-employed/payments', { params });
    return response.data;
  },

  createPayment: async (data: Partial<SelfEmployedPayment>): Promise<SelfEmployedPayment> => {
    const response = await apiClient.post<SelfEmployedPayment>('/self-employed/payments', data);
    return response.data;
  },

  // Registries
  getRegistries: async (params?: PaginationParams): Promise<PaginatedResponse<SelfEmployedRegistry>> => {
    const response = await apiClient.get<PaginatedResponse<SelfEmployedRegistry>>('/self-employed/registries', { params });
    return response.data;
  },

  getRegistry: async (id: string): Promise<SelfEmployedRegistry> => {
    const response = await apiClient.get<SelfEmployedRegistry>(`/self-employed/registries/${id}`);
    return response.data;
  },

  validateInn: async (inn: string): Promise<{ valid: boolean; name?: string }> => {
    const response = await apiClient.get<{ valid: boolean; name?: string }>(`/self-employed/validate-inn/${inn}`);
    return response.data;
  },
};
