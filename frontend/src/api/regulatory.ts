import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  RegulatoryPermit,
  PermitStatus,
  PermitType,
  License,
  LicenseStatus,
  Inspection,
  InspectionStatus,
  InspectionType,
  ComplianceCheck,
  CreatePermitRequest,
  CreateInspectionRequest,
  Prescription,
  PrescriptionStatus,
} from '@/modules/regulatory/types';

export interface PermitFilters extends PaginationParams {
  permitType?: PermitType;
  status?: PermitStatus;
  projectId?: string;
  search?: string;
}

export interface LicenseFilters extends PaginationParams {
  status?: LicenseStatus;
  search?: string;
}

export interface InspectionFilters extends PaginationParams {
  inspectionType?: InspectionType;
  status?: InspectionStatus;
  projectId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ComplianceFilters extends PaginationParams {
  projectId?: string;
  result?: string;
}

export const regulatoryApi = {
  // Permits
  getPermits: async (params?: PermitFilters): Promise<PaginatedResponse<RegulatoryPermit>> => {
    const response = await apiClient.get<PaginatedResponse<RegulatoryPermit>>('/regulatory/permits', { params });
    return response.data;
  },

  getPermit: async (id: string): Promise<RegulatoryPermit> => {
    const response = await apiClient.get<RegulatoryPermit>(`/regulatory/permits/${id}`);
    return response.data;
  },

  createPermit: async (data: CreatePermitRequest): Promise<RegulatoryPermit> => {
    const response = await apiClient.post<RegulatoryPermit>('/regulatory/permits', data);
    return response.data;
  },

  updatePermit: async (id: string, data: Partial<RegulatoryPermit>): Promise<RegulatoryPermit> => {
    const response = await apiClient.put<RegulatoryPermit>(`/regulatory/permits/${id}`, data);
    return response.data;
  },

  changePermitStatus: async (id: string, status: PermitStatus): Promise<RegulatoryPermit> => {
    const response = await apiClient.patch<RegulatoryPermit>(`/regulatory/permits/${id}/status`, { status });
    return response.data;
  },

  // Licenses
  getLicenses: async (params?: LicenseFilters): Promise<PaginatedResponse<License>> => {
    const response = await apiClient.get<PaginatedResponse<License>>('/regulatory/licenses', { params });
    return response.data;
  },

  getLicense: async (id: string): Promise<License> => {
    const response = await apiClient.get<License>(`/regulatory/licenses/${id}`);
    return response.data;
  },

  createLicense: async (data: Partial<License>): Promise<License> => {
    const response = await apiClient.post<License>('/regulatory/licenses', data);
    return response.data;
  },

  updateLicense: async (id: string, data: Partial<License>): Promise<License> => {
    const response = await apiClient.put<License>(`/regulatory/licenses/${id}`, data);
    return response.data;
  },

  // Inspections
  getInspections: async (params?: InspectionFilters): Promise<PaginatedResponse<Inspection>> => {
    const response = await apiClient.get<PaginatedResponse<Inspection>>('/regulatory/inspections', { params });
    return response.data;
  },

  getInspection: async (id: string): Promise<Inspection> => {
    const response = await apiClient.get<Inspection>(`/regulatory/inspections/${id}`);
    return response.data;
  },

  createInspection: async (data: CreateInspectionRequest): Promise<Inspection> => {
    const response = await apiClient.post<Inspection>('/regulatory/inspections', data);
    return response.data;
  },

  updateInspection: async (id: string, data: Partial<Inspection>): Promise<Inspection> => {
    const response = await apiClient.put<Inspection>(`/regulatory/inspections/${id}`, data);
    return response.data;
  },

  changeInspectionStatus: async (id: string, status: InspectionStatus): Promise<Inspection> => {
    const response = await apiClient.patch<Inspection>(`/regulatory/inspections/${id}/status`, { status });
    return response.data;
  },

  // Compliance Checks
  getComplianceChecks: async (params?: ComplianceFilters): Promise<PaginatedResponse<ComplianceCheck>> => {
    const response = await apiClient.get<PaginatedResponse<ComplianceCheck>>('/regulatory/compliance', { params });
    return response.data;
  },

  getComplianceCheck: async (id: string): Promise<ComplianceCheck> => {
    const response = await apiClient.get<ComplianceCheck>(`/regulatory/compliance/${id}`);
    return response.data;
  },

  createComplianceCheck: async (data: Partial<ComplianceCheck>): Promise<ComplianceCheck> => {
    const response = await apiClient.post<ComplianceCheck>('/regulatory/compliance', data);
    return response.data;
  },

  // Prescriptions
  getPrescriptions: async (params?: { size?: number; search?: string }): Promise<PaginatedResponse<Prescription>> => {
    const response = await apiClient.get<PaginatedResponse<Prescription>>('/regulatory/prescriptions', { params });
    return response.data;
  },

  getPrescription: async (id: string): Promise<Prescription> => {
    const response = await apiClient.get<Prescription>(`/regulatory/prescriptions/${id}`);
    return response.data;
  },

  createPrescription: async (data: Partial<Prescription>): Promise<Prescription> => {
    const response = await apiClient.post<Prescription>('/regulatory/prescriptions', data);
    return response.data;
  },

  updatePrescription: async (id: string, data: Partial<Prescription>): Promise<Prescription> => {
    const response = await apiClient.put<Prescription>(`/regulatory/prescriptions/${id}`, data);
    return response.data;
  },

  changePrescriptionStatus: async (id: string, status: PrescriptionStatus): Promise<Prescription> => {
    const response = await apiClient.patch<Prescription>(`/regulatory/prescriptions/${id}/status`, { status });
    return response.data;
  },

  deletePrescription: async (id: string): Promise<void> => {
    await apiClient.delete(`/regulatory/prescriptions/${id}`);
  },

  fileAppeal: async (id: string): Promise<Prescription> => {
    const response = await apiClient.post<Prescription>(`/regulatory/prescriptions/${id}/appeal`);
    return response.data;
  },
};
