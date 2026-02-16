import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { SbisDocument, SbisConfig, SbisDocumentStatus } from '@/modules/russianDocs/types';

export interface SbisDocumentFilters extends PaginationParams {
  status?: SbisDocumentStatus;
  documentType?: string;
  search?: string;
}

export const sbisApi = {
  getDocuments: async (params?: SbisDocumentFilters): Promise<PaginatedResponse<SbisDocument>> => {
    const response = await apiClient.get<PaginatedResponse<SbisDocument>>('/integrations/sbis/documents', { params });
    return response.data;
  },

  getDocument: async (id: string): Promise<SbisDocument> => {
    const response = await apiClient.get<SbisDocument>(`/integrations/sbis/documents/${id}`);
    return response.data;
  },

  sendDocument: async (id: string): Promise<SbisDocument> => {
    const response = await apiClient.post<SbisDocument>(`/integrations/sbis/documents/${id}/send`);
    return response.data;
  },

  getConfig: async (): Promise<SbisConfig> => {
    const response = await apiClient.get<SbisConfig>('/integrations/sbis/config');
    return response.data;
  },

  updateConfig: async (data: Partial<SbisConfig>): Promise<SbisConfig> => {
    const response = await apiClient.put<SbisConfig>('/integrations/sbis/config', data);
    return response.data;
  },

  syncDocuments: async (): Promise<void> => {
    await apiClient.post('/integrations/sbis/sync');
  },
};
