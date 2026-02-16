import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { FieldReport, PhotoCapture, OfflineSyncStatus, MobileTask, CreateFieldReportRequest } from '@/modules/mobile/types';

export interface FieldReportFilters extends PaginationParams {
  status?: string;
  projectId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const mobileApi = {
  getFieldReports: async (params?: FieldReportFilters): Promise<PaginatedResponse<FieldReport>> => {
    const response = await apiClient.get<PaginatedResponse<FieldReport>>('/mobile/field-reports', { params });
    return response.data;
  },

  getFieldReport: async (id: string): Promise<FieldReport> => {
    const response = await apiClient.get<FieldReport>(`/mobile/field-reports/${id}`);
    return response.data;
  },

  createFieldReport: async (data: CreateFieldReportRequest): Promise<FieldReport> => {
    const response = await apiClient.post<FieldReport>('/mobile/field-reports', data);
    return response.data;
  },

  updateFieldReport: async (id: string, data: Partial<FieldReport>): Promise<FieldReport> => {
    const response = await apiClient.put<FieldReport>(`/mobile/field-reports/${id}`, data);
    return response.data;
  },

  submitFieldReport: async (id: string): Promise<FieldReport> => {
    const response = await apiClient.patch<FieldReport>(`/mobile/field-reports/${id}/submit`);
    return response.data;
  },

  uploadPhoto: async (reportId: string, file: File, caption?: string): Promise<PhotoCapture> => {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) formData.append('caption', caption);
    const response = await apiClient.post<PhotoCapture>(
      `/mobile/field-reports/${reportId}/photos`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  getPhotos: async (reportId: string): Promise<PhotoCapture[]> => {
    const response = await apiClient.get<PhotoCapture[]>(`/mobile/field-reports/${reportId}/photos`);
    return response.data;
  },

  getSyncStatus: async (): Promise<OfflineSyncStatus> => {
    const response = await apiClient.get<OfflineSyncStatus>('/mobile/sync/status');
    return response.data;
  },

  triggerSync: async (): Promise<void> => {
    await apiClient.post('/mobile/sync/trigger');
  },

  getMobileTasks: async (params?: PaginationParams): Promise<PaginatedResponse<MobileTask>> => {
    const response = await apiClient.get<PaginatedResponse<MobileTask>>('/mobile/tasks', { params });
    return response.data;
  },

  completeTask: async (id: string): Promise<MobileTask> => {
    const response = await apiClient.patch<MobileTask>(`/mobile/tasks/${id}/complete`);
    return response.data;
  },
};
