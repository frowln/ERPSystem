import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  SafetyBriefing,
  CreateBriefingRequest,
  UpdateBriefingRequest,
  WorkerCertificate,
  CreateCertificateRequest,
} from '@/modules/safety/types';

export interface BriefingFilters extends PaginationParams {
  projectId?: string;
  briefingType?: string;
  status?: string;
  search?: string;
}

export const safetyBriefingApi = {
  // Briefings
  getBriefings: async (params?: BriefingFilters): Promise<PaginatedResponse<SafetyBriefing>> => {
    const response = await apiClient.get<PaginatedResponse<SafetyBriefing>>('/safety/briefings', { params });
    return response.data;
  },

  getBriefing: async (id: string): Promise<SafetyBriefing> => {
    const response = await apiClient.get<SafetyBriefing>(`/safety/briefings/${id}`);
    return response.data;
  },

  createBriefing: async (data: CreateBriefingRequest): Promise<SafetyBriefing> => {
    const response = await apiClient.post<SafetyBriefing>('/safety/briefings', data);
    return response.data;
  },

  updateBriefing: async (id: string, data: UpdateBriefingRequest): Promise<SafetyBriefing> => {
    const response = await apiClient.put<SafetyBriefing>(`/safety/briefings/${id}`, data);
    return response.data;
  },

  signBriefing: async (id: string, employeeId: string): Promise<SafetyBriefing> => {
    const response = await apiClient.patch<SafetyBriefing>(`/safety/briefings/${id}/sign`, { employeeId });
    return response.data;
  },

  completeBriefing: async (id: string): Promise<SafetyBriefing> => {
    const response = await apiClient.patch<SafetyBriefing>(`/safety/briefings/${id}/complete`);
    return response.data;
  },

  deleteBriefing: async (id: string): Promise<void> => {
    await apiClient.delete(`/safety/briefings/${id}`);
  },

  // Certificates
  getCertificates: async (params?: PaginationParams): Promise<PaginatedResponse<WorkerCertificate>> => {
    const response = await apiClient.get<PaginatedResponse<WorkerCertificate>>('/safety/certificates', { params });
    return response.data;
  },

  getWorkerCerts: async (employeeId: string): Promise<WorkerCertificate[]> => {
    const response = await apiClient.get<WorkerCertificate[]>(`/safety/certificates/worker/${employeeId}`);
    return response.data;
  },

  getExpiringCerts: async (daysAhead: number = 90): Promise<WorkerCertificate[]> => {
    const response = await apiClient.get<WorkerCertificate[]>('/safety/certificates/expiring', {
      params: { daysAhead },
    });
    return response.data;
  },

  createCertificate: async (data: CreateCertificateRequest): Promise<WorkerCertificate> => {
    const response = await apiClient.post<WorkerCertificate>('/safety/certificates', data);
    return response.data;
  },

  updateCertificate: async (id: string, data: CreateCertificateRequest): Promise<WorkerCertificate> => {
    const response = await apiClient.put<WorkerCertificate>(`/safety/certificates/${id}`, data);
    return response.data;
  },
};
