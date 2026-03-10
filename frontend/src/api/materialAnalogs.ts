import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { MaterialAnalog, AnalogRequest, AnalogRequestStatus, SubstitutionType } from '@/modules/specifications/types';

export interface MaterialAnalogFilters extends PaginationParams {
  substitutionType?: SubstitutionType;
  isApproved?: boolean;
  search?: string;
}

export interface AnalogRequestFilters extends PaginationParams {
  status?: AnalogRequestStatus;
  projectId?: string;
  search?: string;
}

export const materialAnalogsApi = {
  getAnalogs: async (params?: MaterialAnalogFilters): Promise<PaginatedResponse<MaterialAnalog>> => {
    const response = await apiClient.get<PaginatedResponse<MaterialAnalog>>('/specifications/analogs', { params });
    return response.data;
  },

  getAnalog: async (id: string): Promise<MaterialAnalog> => {
    const response = await apiClient.get<MaterialAnalog>(`/specifications/analogs/${id}`);
    return response.data;
  },

  createAnalog: async (data: Partial<MaterialAnalog>): Promise<MaterialAnalog> => {
    const response = await apiClient.post<MaterialAnalog>('/specifications/analogs', data);
    return response.data;
  },

  approveAnalog: async (id: string): Promise<MaterialAnalog> => {
    const response = await apiClient.patch<MaterialAnalog>(`/specifications/analogs/${id}/approve`);
    return response.data;
  },

  getRequests: async (params?: AnalogRequestFilters): Promise<PaginatedResponse<AnalogRequest>> => {
    const response = await apiClient.get<PaginatedResponse<AnalogRequest>>('/specifications/analog-requests', { params });
    return response.data;
  },

  getRequest: async (id: string): Promise<AnalogRequest> => {
    const response = await apiClient.get<AnalogRequest>(`/specifications/analog-requests/${id}`);
    return response.data;
  },

  createRequest: async (data: Partial<AnalogRequest>): Promise<AnalogRequest> => {
    const response = await apiClient.post<AnalogRequest>('/specifications/analog-requests', data);
    return response.data;
  },

  approveRequest: async (id: string, selectedAnalogId: string): Promise<AnalogRequest> => {
    const response = await apiClient.patch<AnalogRequest>(`/specifications/analog-requests/${id}/approve`, { selectedAnalogId });
    return response.data;
  },

  rejectRequest: async (id: string, reason: string): Promise<AnalogRequest> => {
    const response = await apiClient.patch<AnalogRequest>(`/specifications/analog-requests/${id}/reject`, { reason });
    return response.data;
  },

  createVeProposal: async (data: Record<string, unknown>): Promise<{ id: string }> => {
    const response = await apiClient.post<{ id: string }>('/specifications/ve-proposals', data);
    return response.data;
  },
};
