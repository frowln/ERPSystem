import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { Rfi, RfiResponse, CreateRfiRequest, RfiStatus } from '@/modules/rfi/types';

export interface RfiFilters extends PaginationParams {
  status?: RfiStatus;
  projectId?: string;
  search?: string;
}

export const rfiApi = {
  getRfis: async (params?: RfiFilters): Promise<PaginatedResponse<Rfi>> => {
    const response = await apiClient.get<PaginatedResponse<Rfi>>('/pm/rfis', { params });
    return response.data;
  },

  getRfi: async (id: string): Promise<Rfi> => {
    const response = await apiClient.get<Rfi>(`/pm/rfis/${id}`);
    return response.data;
  },

  createRfi: async (data: CreateRfiRequest): Promise<Rfi> => {
    const response = await apiClient.post<Rfi>('/pm/rfis', data);
    return response.data;
  },

  updateRfi: async (id: string, data: Partial<Rfi>): Promise<Rfi> => {
    const response = await apiClient.put<Rfi>(`/pm/rfis/${id}`, data);
    return response.data;
  },

  changeRfiStatus: async (id: string, status: RfiStatus): Promise<Rfi> => {
    const response = await apiClient.patch<Rfi>(`/pm/rfis/${id}/status`, { status });
    return response.data;
  },

  getRfiResponses: async (id: string): Promise<RfiResponse[]> => {
    const response = await apiClient.get<RfiResponse[]>(`/pm/rfis/${id}/responses`);
    return response.data;
  },

  addRfiResponse: async (id: string, content: string, isOfficial: boolean): Promise<RfiResponse> => {
    const response = await apiClient.post<RfiResponse>(`/pm/rfis/${id}/responses`, { content, isOfficial });
    return response.data;
  },

  deleteRfi: async (id: string): Promise<void> => {
    await apiClient.delete(`/pm/rfis/${id}`);
  },
};
