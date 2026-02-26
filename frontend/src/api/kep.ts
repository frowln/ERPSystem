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
  OcspValidationResult,
  MchDDocument,
  CreateMchDRequest,
} from '@/modules/kep/types';

export interface KepCertificateFilters extends PaginationParams {
  status?: KepCertificateStatus;
  search?: string;
  ownerId?: string;
}

export interface KepSigningFilters extends PaginationParams {
  status?: KepSigningStatus;
  projectId?: string;
  search?: string;
  signerId?: string;
}

export const kepApi = {
  // ---- Certificates ----

  getCertificates: async (params?: KepCertificateFilters): Promise<PaginatedResponse<KepCertificate>> => {
    const response = await apiClient.get<PaginatedResponse<KepCertificate>>('/v1/kep/certificates', { params });
    return response.data;
  },

  getCertificate: async (id: string): Promise<KepCertificate> => {
    const response = await apiClient.get<KepCertificate>(`/v1/kep/certificates/${id}`);
    return response.data;
  },

  getActiveCertificates: async (ownerId: string): Promise<KepCertificate[]> => {
    const response = await apiClient.get<KepCertificate[]>('/v1/kep/certificates/active', { params: { ownerId } });
    return response.data;
  },

  uploadCertificate: async (file: File, password: string): Promise<KepCertificate> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);
    const response = await apiClient.post<KepCertificate>('/v1/kep/certificates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteCertificate: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/kep/certificates/${id}`);
  },

  revokeCertificate: async (id: string): Promise<KepCertificate> => {
    const response = await apiClient.post<KepCertificate>(`/v1/kep/certificates/${id}/revoke`);
    return response.data;
  },

  validateCertificateOcsp: async (id: string): Promise<OcspValidationResult> => {
    const response = await apiClient.post<OcspValidationResult>(`/v1/kep/certificates/${id}/ocsp`);
    return response.data;
  },

  // ---- Signing Requests ----

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

  completeSigningRequest: async (id: string, signatureId: string): Promise<KepSigningRequest> => {
    const response = await apiClient.post<KepSigningRequest>(`/v1/kep/signing-requests/${id}/complete`, null, {
      params: { signatureId },
    });
    return response.data;
  },

  deleteSigningRequest: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/kep/signing-requests/${id}`);
  },

  // ---- Signing & Verification ----

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

  getSignatures: async (requestId: string): Promise<KepSignature[]> => {
    const response = await apiClient.get<KepSignature[]>(`/v1/kep/signing-requests/${requestId}/signatures`);
    return response.data;
  },

  batchSign: async (requestIds: string[], certificateId: string): Promise<KepSignature[]> => {
    const results = await Promise.allSettled(
      requestIds.map((id) =>
        apiClient.post<KepSignature>('/v1/kep/sign', {
          certificateId,
          documentModel: 'signing-request',
          documentId: id,
        }),
      ),
    );
    return results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<{ data: KepSignature }>).value.data);
  },

  // ---- Config ----

  getConfig: async (): Promise<KepConfig> => {
    const response = await apiClient.get<KepConfig>('/v1/kep/config');
    return response.data;
  },

  updateConfig: async (data: Partial<KepConfig>): Promise<KepConfig> => {
    const response = await apiClient.put<KepConfig>('/v1/kep/config', data);
    return response.data;
  },

  // ---- Machine-Readable Power of Attorney (MChD) ----

  getMchDList: async (params?: PaginationParams): Promise<PaginatedResponse<MchDDocument>> => {
    const response = await apiClient.get<PaginatedResponse<MchDDocument>>('/v1/kep/mchd', { params });
    return response.data;
  },

  createMchD: async (data: CreateMchDRequest): Promise<MchDDocument> => {
    const response = await apiClient.post<MchDDocument>('/v1/kep/mchd', data);
    return response.data;
  },

  revokeMchD: async (id: string): Promise<MchDDocument> => {
    const response = await apiClient.post<MchDDocument>(`/v1/kep/mchd/${id}/revoke`);
    return response.data;
  },

  deleteMchD: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/kep/mchd/${id}`);
  },
};
