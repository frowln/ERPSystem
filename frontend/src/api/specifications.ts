import { apiClient } from './client';
import type {
  Specification,
  SpecItem,
  PaginatedResponse,
  PaginationParams,
  SpecificationStatus,
} from '@/types';

export interface SpecificationFilters extends PaginationParams {
  status?: SpecificationStatus;
  projectId?: string;
  search?: string;
}

export const specificationsApi = {
  getSpecifications: async (params?: SpecificationFilters): Promise<PaginatedResponse<Specification>> => {
    const response = await apiClient.get<PaginatedResponse<Specification>>('/specifications', { params });
    return response.data;
  },

  getSpecification: async (id: string): Promise<Specification> => {
    const response = await apiClient.get<Specification>(`/specifications/${id}`);
    return response.data;
  },

  getSpecItems: async (specId: string): Promise<SpecItem[]> => {
    const response = await apiClient.get<SpecItem[]>(`/specifications/${specId}/items`);
    return response.data;
  },

  createSpecification: async (data: Partial<Specification>): Promise<Specification> => {
    const response = await apiClient.post<Specification>('/specifications', data);
    return response.data;
  },

  updateSpecification: async (id: string, data: Partial<Specification>): Promise<Specification> => {
    const response = await apiClient.put<Specification>(`/specifications/${id}`, data);
    return response.data;
  },
};
