import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  ImportJob,
  ImportEntityType,
  ImportStatus,
  ExportJob,
  ExportFormat,
  FieldMapping,
} from '@/modules/dataExchange/types';

export interface ImportFilters extends PaginationParams {
  entityType?: ImportEntityType;
  status?: ImportStatus;
  search?: string;
}

export interface ExportFilters extends PaginationParams {
  entityType?: ImportEntityType;
  format?: ExportFormat;
  search?: string;
}

export const dataExchangeApi = {
  getImportJobs: async (params?: ImportFilters): Promise<PaginatedResponse<ImportJob>> => {
    const response = await apiClient.get<PaginatedResponse<ImportJob>>('/data-exchange/imports', { params });
    return response.data;
  },

  getImportJob: async (id: string): Promise<ImportJob> => {
    const response = await apiClient.get<ImportJob>(`/data-exchange/imports/${id}`);
    return response.data;
  },

  createImportJob: async (file: File, entityType: ImportEntityType): Promise<ImportJob> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    const response = await apiClient.post<ImportJob>('/data-exchange/imports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  retryImportJob: async (id: string): Promise<ImportJob> => {
    const response = await apiClient.post<ImportJob>(`/data-exchange/imports/${id}/retry`);
    return response.data;
  },

  getExportJobs: async (params?: ExportFilters): Promise<PaginatedResponse<ExportJob>> => {
    const response = await apiClient.get<PaginatedResponse<ExportJob>>('/data-exchange/exports', { params });
    return response.data;
  },

  getExportJob: async (id: string): Promise<ExportJob> => {
    const response = await apiClient.get<ExportJob>(`/data-exchange/exports/${id}`);
    return response.data;
  },

  createExportJob: async (entityType: ImportEntityType, format: ExportFormat): Promise<ExportJob> => {
    const response = await apiClient.post<ExportJob>('/data-exchange/exports', { entityType, format });
    return response.data;
  },

  downloadExport: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/data-exchange/exports/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getFieldMappings: async (entityType: ImportEntityType): Promise<FieldMapping[]> => {
    const response = await apiClient.get<FieldMapping[]>(`/data-exchange/mappings/${entityType}`);
    return response.data;
  },

  updateFieldMappings: async (entityType: ImportEntityType, mappings: FieldMapping[]): Promise<FieldMapping[]> => {
    const response = await apiClient.put<FieldMapping[]>(`/data-exchange/mappings/${entityType}`, mappings);
    return response.data;
  },
};
