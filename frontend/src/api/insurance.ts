import { apiClient } from './client';
import type { PaginatedResponse } from '@/types';

export type InsuranceCertificateType =
  | 'GENERAL_LIABILITY'
  | 'WORKERS_COMP'
  | 'AUTO'
  | 'UMBRELLA'
  | 'PROFESSIONAL'
  | 'BUILDERS_RISK';

export type InsuranceCertificateStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'PENDING';

export interface InsuranceCertificate {
  id: string;
  vendorId?: string;
  vendorName: string;
  certificateType: InsuranceCertificateType;
  policyNumber?: string;
  insurerName?: string;
  coverageAmount?: number;
  deductible?: number;
  effectiveDate?: string;
  expiryDate?: string;
  certificateHolder?: string;
  status: InsuranceCertificateStatus;
  storagePath?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInsuranceCertificatePayload {
  vendorId?: string;
  vendorName: string;
  certificateType: string;
  policyNumber?: string;
  insurerName?: string;
  coverageAmount?: number;
  deductible?: number;
  effectiveDate?: string;
  expiryDate?: string;
  certificateHolder?: string;
  status?: string;
  storagePath?: string;
  notes?: string;
}

export interface UpdateInsuranceCertificatePayload {
  vendorId?: string;
  vendorName?: string;
  certificateType?: string;
  policyNumber?: string;
  insurerName?: string;
  coverageAmount?: number;
  deductible?: number;
  effectiveDate?: string;
  expiryDate?: string;
  certificateHolder?: string;
  status?: string;
  storagePath?: string;
  notes?: string;
}

export const insuranceApi = {
  getCertificates: async (params?: { page?: number; size?: number }): Promise<PaginatedResponse<InsuranceCertificate>> => {
    const response = await apiClient.get<PaginatedResponse<InsuranceCertificate>>('/insurance-certificates', { params });
    return response.data;
  },

  getExpiring: async (days = 90): Promise<InsuranceCertificate[]> => {
    const response = await apiClient.get<InsuranceCertificate[]>('/insurance-certificates/expiring', {
      params: { days },
    });
    return response.data;
  },

  getCertificate: async (id: string): Promise<InsuranceCertificate> => {
    const response = await apiClient.get<InsuranceCertificate>(`/insurance-certificates/${id}`);
    return response.data;
  },

  createCertificate: async (data: CreateInsuranceCertificatePayload): Promise<InsuranceCertificate> => {
    const response = await apiClient.post<InsuranceCertificate>('/insurance-certificates', data);
    return response.data;
  },

  updateCertificate: async (id: string, data: UpdateInsuranceCertificatePayload): Promise<InsuranceCertificate> => {
    const response = await apiClient.put<InsuranceCertificate>(`/insurance-certificates/${id}`, data);
    return response.data;
  },

  deleteCertificate: async (id: string): Promise<void> => {
    await apiClient.delete(`/insurance-certificates/${id}`);
  },
};
