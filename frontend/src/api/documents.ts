import { apiClient } from './client';
import type {
  Document as BaseDocument,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export interface DocumentFilters extends PaginationParams {
  category?: string;
  status?: string;
  search?: string;
  projectId?: string;
  contractId?: string;
}

export interface UpsertDocumentRequest {
  title: string;
  documentNumber?: string;
  category?: string;
  projectId?: string;
  contractId?: string;
  description?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  storagePath?: string;
  authorId?: string;
  authorName?: string;
  tags?: string;
  expiryDate?: string;
  notes?: string;
}

export const documentsApi = {
  getDocuments: async (params?: DocumentFilters): Promise<PaginatedResponse<BaseDocument>> => {
    const response = await apiClient.get<PaginatedResponse<BaseDocument>>('/documents', { params });
    return response.data;
  },

  getDocument: async (id: string): Promise<BaseDocument> => {
    const response = await apiClient.get<BaseDocument>(`/documents/${id}`);
    return response.data;
  },

  createDocument: async (data: UpsertDocumentRequest): Promise<BaseDocument> => {
    const response = await apiClient.post<BaseDocument>('/documents', data);
    return response.data;
  },

  updateDocument: async (id: string, data: UpsertDocumentRequest): Promise<BaseDocument> => {
    const response = await apiClient.put<BaseDocument>(`/documents/${id}`, data);
    return response.data;
  },

  uploadDocumentFile: async (id: string, file: File): Promise<BaseDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<BaseDocument>(
      `/documents/${id}/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  getDownloadUrl: async (id: string): Promise<string> => {
    const response = await apiClient.get<string>(`/documents/${id}/download-url`);
    return response.data;
  },
};
