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

export interface DocumentRecord extends BaseDocument {
  projectId?: string;
  contractId?: string;
  description?: string;
  tags?: string | string[];
  notes?: string;
  updatedAt?: string;
}

export const documentsApi = {
  getDocuments: async (params?: DocumentFilters): Promise<PaginatedResponse<DocumentRecord>> => {
    const response = await apiClient.get<PaginatedResponse<DocumentRecord>>('/documents', { params });
    return response.data;
  },

  getDocument: async (id: string): Promise<DocumentRecord> => {
    const response = await apiClient.get<DocumentRecord>(`/documents/${id}`);
    return response.data;
  },

  createDocument: async (data: UpsertDocumentRequest): Promise<DocumentRecord> => {
    const response = await apiClient.post<DocumentRecord>('/documents', data);
    return response.data;
  },

  updateDocument: async (id: string, data: UpsertDocumentRequest): Promise<DocumentRecord> => {
    const response = await apiClient.put<DocumentRecord>(`/documents/${id}`, data);
    return response.data;
  },
};
