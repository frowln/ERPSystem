import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { MaterialCertificate, CertificateLine, CertificateType, CertificateStatus } from '@/modules/quality/types';

export interface CertificateFilters extends PaginationParams {
  certificateType?: CertificateType;
  status?: CertificateStatus;
  projectId?: string;
  supplierId?: string;
  search?: string;
}

export const certificatesApi = {
  getCertificates: async (params?: CertificateFilters): Promise<PaginatedResponse<MaterialCertificate>> => {
    const response = await apiClient.get<PaginatedResponse<MaterialCertificate>>('/quality/certificates', { params });
    return response.data;
  },

  getCertificate: async (id: string): Promise<MaterialCertificate> => {
    const response = await apiClient.get<MaterialCertificate>(`/quality/certificates/${id}`);
    return response.data;
  },

  createCertificate: async (data: Partial<MaterialCertificate>): Promise<MaterialCertificate> => {
    const response = await apiClient.post<MaterialCertificate>('/quality/certificates', data);
    return response.data;
  },

  updateCertificate: async (id: string, data: Partial<MaterialCertificate>): Promise<MaterialCertificate> => {
    const response = await apiClient.put<MaterialCertificate>(`/quality/certificates/${id}`, data);
    return response.data;
  },

  getCertificateLines: async (id: string): Promise<CertificateLine[]> => {
    const response = await apiClient.get<CertificateLine[]>(`/quality/certificates/${id}/lines`);
    return response.data;
  },

  verifyCertificate: async (id: string): Promise<MaterialCertificate> => {
    const response = await apiClient.patch<MaterialCertificate>(`/quality/certificates/${id}/verify`);
    return response.data;
  },
};
