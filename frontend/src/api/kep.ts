import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  KepCertificate,
  KepCertificateStatus,
  KepSigningRequest,
  KepSigningStatus,
  KepSignature,
  KepConfig,
  CreateKepSigningRequest,
} from '@/modules/kep/types';

export interface KepCertificateFilters extends PaginationParams {
  status?: KepCertificateStatus;
  search?: string;
}

export interface KepSigningFilters extends PaginationParams {
  status?: KepSigningStatus;
  projectId?: string;
  search?: string;
}

export const kepApi = {
  getCertificates: async (params?: KepCertificateFilters): Promise<PaginatedResponse<KepCertificate>> => {
    const response = await apiClient.get<PaginatedResponse<KepCertificate>>('/v1/kep/certificates', { params });
    return response.data;
  },

  getCertificate: async (id: string): Promise<KepCertificate> => {
    const response = await apiClient.get<KepCertificate>(`/v1/kep/certificates/${id}`);
    return response.data;
  },

  getSigningRequests: async (params?: KepSigningFilters): Promise<PaginatedResponse<KepSigningRequest>> => {
    const response = await apiClient.get<PaginatedResponse<KepSigningRequest>>('/v1/kep/signing-requests', { params });
    return response.data;
  },

  getSigningRequest: async (id: string): Promise<KepSigningRequest> => {
    const response = await apiClient.get<KepSigningRequest>(`/v1/kep/signing-requests/${id}`);
    return response.data;
  },

  createSigningRequest: async (data: CreateKepSigningRequest): Promise<KepSigningRequest> => {
    const response = await apiClient.post<KepSigningRequest>('/v1/kep/signing-requests', data);
    return response.data;
  },

  signRequest: async (id: string, certificateId: string): Promise<KepSigningRequest> => {
    const response = await apiClient.post<KepSigningRequest>(`/v1/kep/signing-requests/${id}/sign`, { certificateId });
    return response.data;
  },

  rejectRequest: async (id: string, reason: string): Promise<KepSigningRequest> => {
    const response = await apiClient.post<KepSigningRequest>(`/v1/kep/signing-requests/${id}/reject`, { reason });
    return response.data;
  },

  getSignatures: async (requestId: string): Promise<KepSignature[]> => {
    const response = await apiClient.get<KepSignature[]>(`/v1/kep/signing-requests/${requestId}/signatures`);
    return response.data;
  },

  getConfig: async (): Promise<KepConfig> => {
    const response = await apiClient.get<KepConfig>('/v1/kep/config');
    return response.data;
  },

  updateConfig: async (data: Partial<KepConfig>): Promise<KepConfig> => {
    const response = await apiClient.put<KepConfig>('/v1/kep/config', data);
    return response.data;
  },
};
