import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { Submittal, SubmittalReview, CreateSubmittalRequest, SubmittalStatus } from '@/modules/submittals/types';

export interface SubmittalFilters extends PaginationParams {
  status?: SubmittalStatus;
  projectId?: string;
  search?: string;
}

export const submittalsApi = {
  getSubmittals: async (params?: SubmittalFilters): Promise<PaginatedResponse<Submittal>> => {
    const response = await apiClient.get<PaginatedResponse<Submittal>>('/pto/submittals', { params });
    return response.data;
  },

  getSubmittal: async (id: string): Promise<Submittal> => {
    const response = await apiClient.get<Submittal>(`/pto/submittals/${id}`);
    return response.data;
  },

  createSubmittal: async (data: CreateSubmittalRequest): Promise<Submittal> => {
    const response = await apiClient.post<Submittal>('/pto/submittals', data);
    return response.data;
  },

  updateSubmittal: async (id: string, data: Partial<Submittal>): Promise<Submittal> => {
    const response = await apiClient.put<Submittal>(`/pto/submittals/${id}`, data);
    return response.data;
  },

  getSubmittalReviews: async (id: string): Promise<SubmittalReview[]> => {
    const response = await apiClient.get<SubmittalReview[]>(`/pto/submittals/${id}/reviews`);
    return response.data;
  },
};
