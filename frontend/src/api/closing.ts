import { apiClient } from './client';
import type {
  Ks2Document,
  Ks3Document,
  ClosingDocStatus,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export interface ClosingDocFilters extends PaginationParams {
  status?: ClosingDocStatus;
  projectId?: string;
  contractId?: string;
  search?: string;
}

export const closingApi = {
  getKs2Documents: async (params?: ClosingDocFilters): Promise<PaginatedResponse<Ks2Document>> => {
    const response = await apiClient.get<PaginatedResponse<Ks2Document>>('/closing/ks2', { params });
    return response.data;
  },

  getKs2: async (id: string): Promise<Ks2Document> => {
    const response = await apiClient.get<Ks2Document>(`/closing/ks2/${id}`);
    return response.data;
  },

  getKs3Documents: async (params?: ClosingDocFilters): Promise<PaginatedResponse<Ks3Document>> => {
    const response = await apiClient.get<PaginatedResponse<Ks3Document>>('/closing/ks3', { params });
    return response.data;
  },

  getKs3: async (id: string): Promise<Ks3Document> => {
    const response = await apiClient.get<Ks3Document>(`/closing/ks3/${id}`);
    return response.data;
  },
};
