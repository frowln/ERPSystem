import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  SelfEmployedContractor,
  SelfEmployedPayment,
  SelfEmployedRegistry,
  CompletionAct,
  NpdStatus,
} from './types';

export interface ContractorFilters extends PaginationParams {
  status?: string;
  taxStatus?: string;
  npdStatus?: string;
  contractType?: string;
  search?: string;
}

export interface NpdVerifyResult {
  inn: string;
  npdStatus: NpdStatus;
  verifiedAt: string;
  fullName?: string;
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

  // NPD verification
  verifyNpd: async (inn: string): Promise<NpdVerifyResult> => {
    const response = await apiClient.post<NpdVerifyResult>('/self-employed/verify-npd', { inn });
    return response.data;
  },

  bulkVerifyNpd: async (ids: string[]): Promise<NpdVerifyResult[]> => {
    const response = await apiClient.post<NpdVerifyResult[]>('/self-employed/verify-npd/bulk', { ids });
    return response.data;
  },

  // Completion Acts
  getActs: async (params?: PaginationParams & { workerId?: string }): Promise<PaginatedResponse<CompletionAct>> => {
    const response = await apiClient.get<PaginatedResponse<CompletionAct>>('/self-employed/acts', { params });
    return response.data;
  },

  createAct: async (data: Partial<CompletionAct>): Promise<CompletionAct> => {
    const response = await apiClient.post<CompletionAct>('/self-employed/acts', data);
    return response.data;
  },

  signAct: async (actId: string): Promise<CompletionAct> => {
    const response = await apiClient.patch<CompletionAct>(`/self-employed/acts/${actId}/sign`);
    return response.data;
  },

  payAct: async (actId: string): Promise<CompletionAct> => {
    const response = await apiClient.patch<CompletionAct>(`/self-employed/acts/${actId}/pay`);
    return response.data;
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
