import { apiClient } from './client';
import type {
  Ks2Document,
  Ks2Line,
  Ks3Document,
  ClosingDocStatus,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export interface ClosingDocFilters extends PaginationParams {
  status?: ClosingDocStatus;
  projectId?: string;
  contractId?: string;
  search?: string;
}

export interface Ks2DetailWithLines extends Ks2Document {
  lines: Ks2Line[];
}

export interface CreateKs2Request {
  number: string;
  name: string;
  documentDate: string;
  projectId: string;
  contractId: string;
  notes?: string;
}

export interface CreateKs2LineRequest {
  name: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  notes?: string;
}

export interface CreateKs3Request {
  number: string;
  name: string;
  documentDate: string;
  periodFrom: string;
  periodTo: string;
  projectId: string;
  contractId: string;
  retentionPercent: number;
  notes?: string;
}

export const closingApi = {
  getKs2Documents: async (params?: ClosingDocFilters): Promise<PaginatedResponse<Ks2Document>> => {
    const response = await apiClient.get<PaginatedResponse<Ks2Document>>('/closing/ks2', { params });
    return response.data;
  },

  getKs2: async (id: string): Promise<Ks2Document> => {
    const response = await apiClient.get<Ks2Document>(`/closing/ks2/${id}`);
    return response.data;
  },

  getKs2WithLines: async (id: string): Promise<Ks2DetailWithLines> => {
    const response = await apiClient.get<Ks2DetailWithLines>(`/closing/ks2/${id}/detail`);
    return response.data;
  },

  createKs2: async (data: CreateKs2Request) => {
    const response = await apiClient.post<{ id: string }>('/closing/ks2', data);
    return response;
  },

  updateKs2: async (id: string, data: Partial<CreateKs2Request>) => {
    const response = await apiClient.put(`/closing/ks2/${id}`, data);
    return response.data;
  },

  submitKs2: async (id: string) => {
    const response = await apiClient.post(`/closing/ks2/${id}/submit`);
    return response.data;
  },

  signKs2: async (id: string) => {
    const response = await apiClient.post(`/closing/ks2/${id}/sign`);
    return response.data;
  },

  closeKs2: async (id: string) => {
    const response = await apiClient.post(`/closing/ks2/${id}/close`);
    return response.data;
  },

  addKs2Line: async (ks2Id: string, data: CreateKs2LineRequest) => {
    const response = await apiClient.post(`/closing/ks2/${ks2Id}/lines`, data);
    return response.data;
  },

  removeKs2Line: async (lineId: string) => {
    const response = await apiClient.delete(`/closing/ks2/lines/${lineId}`);
    return response.data;
  },

  getKs3Documents: async (params?: ClosingDocFilters): Promise<PaginatedResponse<Ks3Document>> => {
    const response = await apiClient.get<PaginatedResponse<Ks3Document>>('/closing/ks3', { params });
    return response.data;
  },

  getKs3: async (id: string): Promise<Ks3Document> => {
    const response = await apiClient.get<Ks3Document>(`/closing/ks3/${id}`);
    return response.data;
  },

  createKs3: async (data: CreateKs3Request) => {
    const response = await apiClient.post<{ id: string }>('/closing/ks3', data);
    return response;
  },

  updateKs3: async (id: string, data: Partial<CreateKs3Request>) => {
    const response = await apiClient.put(`/closing/ks3/${id}`, data);
    return response.data;
  },

  submitKs3: async (id: string) => {
    const response = await apiClient.post(`/closing/ks3/${id}/submit`);
    return response.data;
  },

  signKs3: async (id: string) => {
    const response = await apiClient.post(`/closing/ks3/${id}/sign`);
    return response.data;
  },

  closeKs3: async (id: string) => {
    const response = await apiClient.post(`/closing/ks3/${id}/close`);
    return response.data;
  },

  linkKs2ToKs3: async (ks3Id: string, ks2Id: string) => {
    const response = await apiClient.post(`/closing/ks3/${ks3Id}/ks2/${ks2Id}`);
    return response.data;
  },

  unlinkKs2FromKs3: async (ks3Id: string, ks2Id: string) => {
    const response = await apiClient.delete(`/closing/ks3/${ks3Id}/ks2/${ks2Id}`);
    return response.data;
  },
};
