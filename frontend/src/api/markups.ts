import { apiClient } from './client';

export interface DrawingMarkup {
  id: string;
  documentId: string;
  pageNumber: number;
  markupType: 'TEXT' | 'ARROW' | 'RECTANGLE' | 'CIRCLE' | 'CLOUD' | 'FREEHAND' | 'STAMP';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  color: string;
  strokeWidth: number;
  textContent?: string;
  authorName?: string;
  status: 'ACTIVE' | 'RESOLVED' | 'DELETED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarkupPayload {
  markupType: string;
  pageNumber: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  color?: string;
  strokeWidth?: number;
  textContent?: string;
}

export interface UpdateMarkupPayload {
  markupType?: string;
  pageNumber?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  color?: string;
  strokeWidth?: number;
  textContent?: string;
  status?: string;
}

export const markupsApi = {
  getMarkups: async (documentId: string, page?: number): Promise<DrawingMarkup[]> => {
    const params: Record<string, unknown> = {};
    if (page != null) params.page = page;
    const { data } = await apiClient.get(`/documents/${documentId}/markups`, { params });
    return data.data ?? data;
  },

  getMarkup: async (documentId: string, id: string): Promise<DrawingMarkup> => {
    const { data } = await apiClient.get(`/documents/${documentId}/markups/${id}`);
    return data.data ?? data;
  },

  createMarkup: async (documentId: string, payload: CreateMarkupPayload): Promise<DrawingMarkup> => {
    const { data } = await apiClient.post(`/documents/${documentId}/markups`, payload);
    return data.data ?? data;
  },

  updateMarkup: async (documentId: string, id: string, payload: UpdateMarkupPayload): Promise<DrawingMarkup> => {
    const { data } = await apiClient.put(`/documents/${documentId}/markups/${id}`, payload);
    return data.data ?? data;
  },

  deleteMarkup: async (documentId: string, id: string): Promise<void> => {
    await apiClient.delete(`/documents/${documentId}/markups/${id}`);
  },
};
