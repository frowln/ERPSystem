import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  RussianDocument,
  RussianDocumentType,
  RussianDocumentStatus,
  Ks2Line,
  Ks3Period,
  M29Line,
  CreateRussianDocumentRequest,
  CreateKs2Request,
  CreateKs3Request,
} from '@/modules/russianDocs/types';

export interface RussianDocFilters extends PaginationParams {
  documentType?: RussianDocumentType;
  status?: RussianDocumentStatus;
  projectId?: string;
  contractId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const russianDocsApi = {
  getDocuments: async (params?: RussianDocFilters): Promise<PaginatedResponse<RussianDocument>> => {
    const response = await apiClient.get<PaginatedResponse<RussianDocument>>('/russian-docs', { params });
    return response.data;
  },

  getDocument: async (id: string): Promise<RussianDocument> => {
    const response = await apiClient.get<RussianDocument>(`/russian-docs/${id}`);
    return response.data;
  },

  createDocument: async (data: CreateRussianDocumentRequest): Promise<RussianDocument> => {
    const response = await apiClient.post<RussianDocument>('/russian-docs', data);
    return response.data;
  },

  updateDocument: async (id: string, data: Partial<RussianDocument>): Promise<RussianDocument> => {
    const response = await apiClient.put<RussianDocument>(`/russian-docs/${id}`, data);
    return response.data;
  },

  deleteDocument: async (id: string): Promise<void> => {
    await apiClient.delete(`/russian-docs/${id}`);
  },

  changeStatus: async (id: string, status: RussianDocumentStatus): Promise<RussianDocument> => {
    const response = await apiClient.patch<RussianDocument>(`/russian-docs/${id}/status`, { status });
    return response.data;
  },

  // KS-2 specific
  createKs2: async (data: CreateKs2Request): Promise<RussianDocument> => {
    const response = await apiClient.post<RussianDocument>('/ks2', data);
    return response.data;
  },

  getKs2Lines: async (id: string): Promise<Ks2Line[]> => {
    const response = await apiClient.get<Ks2Line[]>(`/ks2/${id}/lines`);
    return response.data;
  },

  // KS-3 specific
  createKs3: async (data: CreateKs3Request): Promise<RussianDocument> => {
    const response = await apiClient.post<RussianDocument>('/ks3', data);
    return response.data;
  },

  getKs3Periods: async (id: string): Promise<Ks3Period[]> => {
    const response = await apiClient.get<Ks3Period[]>(`/ks3/${id}`);
    return response.data;
  },

  // M-29 specific
  getM29Lines: async (id: string): Promise<M29Line[]> => {
    const response = await apiClient.get<M29Line[]>(`/m29/${id}/lines`);
    return response.data;
  },

  // Export to PDF/Excel
  exportDocument: async (id: string, format: 'pdf' | 'xlsx'): Promise<Blob> => {
    const response = await apiClient.get(`/russian-docs/${id}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
};
