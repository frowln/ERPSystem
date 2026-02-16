import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  KepCertificate,
  KepSigningRequest,
  KepSignature,
  KepSigningStatus,
  CreateKepSigningRequest,
} from './types';

export interface KepCertificateFilters extends PaginationParams {
  search?: string;
  ownerId?: string;
}

export interface KepSigningRequestFilters extends PaginationParams {
  signerId?: string;
  status?: KepSigningStatus;
}

export const kepApi = {
  // ---- Certificates ----

  getCertificates: async (params?: KepCertificateFilters): Promise<PaginatedResponse<KepCertificate>> => {
    const response = await apiClient.get<PaginatedResponse<KepCertificate>>('/v1/kep/certificates', { params });
    return response.data;
  },

  getCertificateById: async (id: string): Promise<KepCertificate> => {
    const response = await apiClient.get<KepCertificate>(`/v1/kep/certificates/${id}`);
    return response.data;
  },

  getActiveCertificates: async (ownerId: string): Promise<KepCertificate[]> => {
    const response = await apiClient.get<KepCertificate[]>('/v1/kep/certificates/active', { params: { ownerId } });
    return response.data;
  },

  createCertificate: async (data: Partial<KepCertificate>): Promise<KepCertificate> => {
    const response = await apiClient.post<KepCertificate>('/v1/kep/certificates', data);
    return response.data;
  },

  updateCertificate: async (id: string, data: Partial<KepCertificate>): Promise<KepCertificate> => {
    const response = await apiClient.put<KepCertificate>(`/v1/kep/certificates/${id}`, data);
    return response.data;
  },

  revokeCertificate: async (id: string): Promise<KepCertificate> => {
    const response = await apiClient.post<KepCertificate>(`/v1/kep/certificates/${id}/revoke`);
    return response.data;
  },

  deleteCertificate: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/kep/certificates/${id}`);
  },

  // ---- Signing ----

  signDocument: async (data: { certificateId: string; documentModel: string; documentId: string }): Promise<KepSignature> => {
    const response = await apiClient.post<KepSignature>('/v1/kep/sign', data);
    return response.data;
  },

  verifySignature: async (signatureId: string): Promise<{ valid: boolean; details: string }> => {
    const response = await apiClient.get<{ valid: boolean; details: string }>(`/v1/kep/signatures/verify/${signatureId}`);
    return response.data;
  },

  getDocumentSignatures: async (documentModel: string, documentId: string): Promise<KepSignature[]> => {
    const response = await apiClient.get<KepSignature[]>('/v1/kep/signatures/document', {
      params: { documentModel, documentId },
    });
    return response.data;
  },

  // ---- Signing Requests ----

  getSigningRequests: async (params?: KepSigningRequestFilters): Promise<PaginatedResponse<KepSigningRequest>> => {
    const response = await apiClient.get<PaginatedResponse<KepSigningRequest>>('/v1/kep/signing-requests', { params });
    return response.data;
  },

  createSigningRequest: async (data: CreateKepSigningRequest): Promise<KepSigningRequest> => {
    const response = await apiClient.post<KepSigningRequest>('/v1/kep/signing-requests', data);
    return response.data;
  },

  completeSigningRequest: async (id: string, signatureId: string): Promise<KepSigningRequest> => {
    const response = await apiClient.post<KepSigningRequest>(`/v1/kep/signing-requests/${id}/complete`, null, {
      params: { signatureId },
    });
    return response.data;
  },

  rejectSigningRequest: async (id: string, reason?: string): Promise<KepSigningRequest> => {
    const response = await apiClient.post<KepSigningRequest>(`/v1/kep/signing-requests/${id}/reject`, null, {
      params: reason ? { reason } : undefined,
    });
    return response.data;
  },

  deleteSigningRequest: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/kep/signing-requests/${id}`);
  },
};
