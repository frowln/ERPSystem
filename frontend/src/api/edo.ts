import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { EdoDocument, EdoSignature, EdoDocumentStatus } from '@/modules/russianDocs/types';

export interface EdoDocumentFilters extends PaginationParams {
  status?: EdoDocumentStatus;
  provider?: string;
  search?: string;
}

export const edoApi = {
  getDocuments: async (params?: EdoDocumentFilters): Promise<PaginatedResponse<EdoDocument>> => {
    const response = await apiClient.get<PaginatedResponse<EdoDocument>>('/integrations/edo/documents', { params });
    return response.data;
  },

  getDocument: async (id: string): Promise<EdoDocument> => {
    const response = await apiClient.get<EdoDocument>(`/integrations/edo/documents/${id}`);
    return response.data;
  },

  sendDocument: async (id: string): Promise<EdoDocument> => {
    const response = await apiClient.post<EdoDocument>(`/integrations/edo/documents/${id}/send`);
    return response.data;
  },

  signDocument: async (id: string): Promise<EdoDocument> => {
    const response = await apiClient.post<EdoDocument>(`/integrations/edo/documents/${id}/sign`);
    return response.data;
  },

  getSignatures: async (id: string): Promise<EdoSignature[]> => {
    const response = await apiClient.get<EdoSignature[]>(`/integrations/edo/documents/${id}/signatures`);
    return response.data;
  },
};
