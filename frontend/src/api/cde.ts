import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  DocumentContainer,
  DocumentRevision,
  Transmittal,
  TransmittalItem,
  LifecycleState,
  Classification,
  Discipline,
  TransmittalStatus,
  TransmittalPurpose,
} from '@/modules/cde/types';

export interface DocumentContainerFilters extends PaginationParams {
  classification?: Classification;
  lifecycleState?: LifecycleState;
  discipline?: Discipline;
  projectId?: string;
  search?: string;
}

export interface TransmittalFilters extends PaginationParams {
  status?: TransmittalStatus;
  purpose?: TransmittalPurpose;
  search?: string;
}

export const cdeApi = {
  // Document Containers
  getContainers: async (params?: DocumentContainerFilters): Promise<PaginatedResponse<DocumentContainer>> => {
    const response = await apiClient.get<PaginatedResponse<DocumentContainer>>('/cde/documents', { params });
    return response.data;
  },

  getContainer: async (id: string): Promise<DocumentContainer> => {
    const response = await apiClient.get<DocumentContainer>(`/cde/documents/${id}`);
    return response.data;
  },

  createContainer: async (data: Partial<DocumentContainer>): Promise<DocumentContainer> => {
    const response = await apiClient.post<DocumentContainer>('/cde/documents', data);
    return response.data;
  },

  updateContainer: async (id: string, data: Partial<DocumentContainer>): Promise<DocumentContainer> => {
    const response = await apiClient.put<DocumentContainer>(`/cde/documents/${id}`, data);
    return response.data;
  },

  deleteContainer: async (id: string): Promise<void> => {
    await apiClient.delete(`/cde/documents/${id}`);
  },

  changeContainerState: async (id: string, state: LifecycleState): Promise<DocumentContainer> => {
    const response = await apiClient.patch<DocumentContainer>(`/cde/documents/${id}/state`, { state });
    return response.data;
  },

  // Document Revisions
  getRevisions: async (containerId: string): Promise<DocumentRevision[]> => {
    const response = await apiClient.get<DocumentRevision[]>(`/cde/documents/${containerId}/revisions`);
    return response.data;
  },

  getRevision: async (id: string): Promise<DocumentRevision> => {
    const response = await apiClient.get<DocumentRevision>(`/cde/revision-sets/${id}`);
    return response.data;
  },

  createRevision: async (containerId: string, data: Partial<DocumentRevision>): Promise<DocumentRevision> => {
    const response = await apiClient.post<DocumentRevision>(`/cde/documents/${containerId}/revisions`, data);
    return response.data;
  },

  uploadRevisionFile: async (revisionId: string, file: File): Promise<DocumentRevision> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<DocumentRevision>(`/cde/revision-sets/${revisionId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Transmittals
  getTransmittals: async (params?: TransmittalFilters): Promise<PaginatedResponse<Transmittal>> => {
    const response = await apiClient.get<PaginatedResponse<Transmittal>>('/cde/transmittals', { params });
    return response.data;
  },

  getTransmittal: async (id: string): Promise<Transmittal> => {
    const response = await apiClient.get<Transmittal>(`/cde/transmittals/${id}`);
    return response.data;
  },

  createTransmittal: async (data: Partial<Transmittal>): Promise<Transmittal> => {
    const response = await apiClient.post<Transmittal>('/cde/transmittals', data);
    return response.data;
  },

  updateTransmittal: async (id: string, data: Partial<Transmittal>): Promise<Transmittal> => {
    const response = await apiClient.put<Transmittal>(`/cde/transmittals/${id}`, data);
    return response.data;
  },

  issueTransmittal: async (id: string): Promise<Transmittal> => {
    const response = await apiClient.post<Transmittal>(`/cde/transmittals/${id}/issue`);
    return response.data;
  },

  getTransmittalItems: async (transmittalId: string): Promise<TransmittalItem[]> => {
    const response = await apiClient.get<TransmittalItem[]>(`/cde/transmittals/${transmittalId}/items`);
    return response.data;
  },

  addTransmittalItem: async (transmittalId: string, data: Partial<TransmittalItem>): Promise<TransmittalItem> => {
    const response = await apiClient.post<TransmittalItem>(`/cde/transmittals/${transmittalId}/items`, data);
    return response.data;
  },

  removeTransmittalItem: async (transmittalId: string, itemId: string): Promise<void> => {
    await apiClient.delete(`/cde/transmittals/${transmittalId}/items/${itemId}`);
  },
};
