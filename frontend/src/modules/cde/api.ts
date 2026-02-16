import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type LifecycleState = 'WORK_IN_PROGRESS' | 'SHARED' | 'PUBLISHED' | 'ARCHIVED';
export type Classification = 'ARCHITECTURAL' | 'STRUCTURAL' | 'MECHANICAL' | 'ELECTRICAL' | 'PLUMBING' | 'CIVIL' | 'OTHER';
export type Discipline = 'ARCHITECTURE' | 'STRUCTURE' | 'MEP' | 'LANDSCAPE' | 'INTERIOR' | 'OTHER';

export interface DocumentContainer {
  id: string;
  code: string;
  title: string;
  description?: string;
  projectId: string;
  projectName?: string;
  classification: Classification;
  discipline: Discipline;
  lifecycleState: LifecycleState;
  currentRevisionId?: string;
  currentRevisionNumber?: string;
  revisionCount: number;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRevision {
  id: string;
  containerId: string;
  revisionNumber: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isCurrent: boolean;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface Transmittal {
  id: string;
  number: string;
  subject: string;
  purpose: string;
  status: string;
  fromOrganization: string;
  toOrganization: string;
  itemCount: number;
  issuedAt?: string;
  createdAt: string;
}

export interface TransmittalItem {
  id: string;
  transmittalId: string;
  containerId: string;
  containerTitle: string;
  revisionId: string;
  revisionNumber: string;
}

export interface DocumentAuditEntry {
  id: string;
  containerId: string;
  action: string;
  performedById: string;
  performedByName: string;
  details?: string;
  performedAt: string;
}

export interface DocumentContainerFilters extends PaginationParams {
  projectId?: string;
  classification?: Classification;
  lifecycleState?: LifecycleState;
  discipline?: Discipline;
  search?: string;
}

export interface TransmittalFilters extends PaginationParams {
  status?: string;
  purpose?: string;
  search?: string;
}

export const cdeApi = {
  // Document Containers
  getAll: async (params?: DocumentContainerFilters): Promise<PaginatedResponse<DocumentContainer>> => {
    const response = await apiClient.get<PaginatedResponse<DocumentContainer>>('/cde/documents', { params });
    return response.data;
  },

  getById: async (id: string): Promise<DocumentContainer> => {
    const response = await apiClient.get<DocumentContainer>(`/cde/documents/${id}`);
    return response.data;
  },

  create: async (data: Partial<DocumentContainer>): Promise<DocumentContainer> => {
    const response = await apiClient.post<DocumentContainer>('/cde/documents', data);
    return response.data;
  },

  update: async (id: string, data: Partial<DocumentContainer>): Promise<DocumentContainer> => {
    const response = await apiClient.put<DocumentContainer>(`/cde/documents/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/cde/documents/${id}`);
  },

  changeState: async (id: string, state: LifecycleState): Promise<DocumentContainer> => {
    const response = await apiClient.patch<DocumentContainer>(`/cde/documents/${id}/state`, { state });
    return response.data;
  },

  // Revisions
  getRevisions: async (containerId: string): Promise<DocumentRevision[]> => {
    const response = await apiClient.get<DocumentRevision[]>(`/cde/documents/${containerId}/revisions`);
    return response.data;
  },

  addRevision: async (containerId: string, data: Partial<DocumentRevision>): Promise<DocumentRevision> => {
    const response = await apiClient.post<DocumentRevision>(`/cde/documents/${containerId}/revisions`, data);
    return response.data;
  },

  // Audit Trail
  getAuditTrail: async (containerId: string, params?: PaginationParams): Promise<PaginatedResponse<DocumentAuditEntry>> => {
    const response = await apiClient.get<PaginatedResponse<DocumentAuditEntry>>(`/cde/documents/${containerId}/audit`, { params });
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
