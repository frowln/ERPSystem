import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type PtoDocumentType = 'AKT_OV' | 'PROTOCOL' | 'JOURNAL' | 'PPPR' | 'SCHEME' | 'INSTRUCTION' | 'CERTIFICATE';
export type PtoDocumentStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
export type WorkPermitType = 'GENERAL' | 'HOT_WORK' | 'HEIGHT_WORK' | 'CONFINED_SPACE' | 'ELECTRICAL' | 'EXCAVATION' | 'CRANE';
export type WorkPermitStatus = 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'CLOSED' | 'SUSPENDED';
export type LabTestStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type LabTestResult = 'PASSED' | 'FAILED' | 'CONDITIONAL' | 'PENDING';

export interface PtoDocument {
  id: string;
  number: string;
  title: string;
  type: PtoDocumentType;
  status: PtoDocumentStatus;
  projectId: string;
  projectName: string;
  author: string;
  createdDate: string;
  approvedDate: string | null;
  section: string;
  fileUrl?: string;
}

export interface WorkPermit {
  id: string;
  number: string;
  type: WorkPermitType;
  status: WorkPermitStatus;
  location: string;
  projectId: string;
  projectName: string;
  issuer: string;
  contractor: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface LabTest {
  id: string;
  number: string;
  testType: string;
  material: string;
  status: LabTestStatus;
  result: LabTestResult;
  projectId: string;
  projectName: string;
  laboratory: string;
  sampleDate: string;
  resultDate: string | null;
  batchNumber: string;
  standard: string;
}

export interface PtoDocumentFilters extends PaginationParams {
  type?: PtoDocumentType;
  status?: PtoDocumentStatus;
  projectId?: string;
  search?: string;
}

export interface WorkPermitFilters extends PaginationParams {
  type?: WorkPermitType;
  status?: WorkPermitStatus;
  projectId?: string;
  search?: string;
}

export interface LabTestFilters extends PaginationParams {
  testType?: string;
  status?: LabTestStatus;
  result?: LabTestResult;
  projectId?: string;
  search?: string;
}

export const ptoApi = {
  // PTO Documents
  getDocuments: async (params?: PtoDocumentFilters): Promise<PaginatedResponse<PtoDocument>> => {
    const response = await apiClient.get<PaginatedResponse<PtoDocument>>('/pto/documents', { params });
    return response.data;
  },

  getDocument: async (id: string): Promise<PtoDocument> => {
    const response = await apiClient.get<PtoDocument>(`/pto/documents/${id}`);
    return response.data;
  },

  createDocument: async (data: Partial<PtoDocument>): Promise<PtoDocument> => {
    const response = await apiClient.post<PtoDocument>('/pto/documents', data);
    return response.data;
  },

  updateDocument: async (id: string, data: Partial<PtoDocument>): Promise<PtoDocument> => {
    const response = await apiClient.put<PtoDocument>(`/pto/documents/${id}`, data);
    return response.data;
  },

  deleteDocument: async (id: string): Promise<void> => {
    await apiClient.delete(`/pto/documents/${id}`);
  },

  submitDocument: async (id: string): Promise<PtoDocument> => {
    const response = await apiClient.post<PtoDocument>(`/pto/documents/${id}/submit`);
    return response.data;
  },

  approveDocument: async (id: string): Promise<PtoDocument> => {
    const response = await apiClient.post<PtoDocument>(`/pto/documents/${id}/approve`);
    return response.data;
  },

  rejectDocument: async (id: string, reason: string): Promise<PtoDocument> => {
    const response = await apiClient.post<PtoDocument>(`/pto/documents/${id}/reject`, { reason });
    return response.data;
  },

  uploadDocumentFile: async (id: string, file: File): Promise<PtoDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<PtoDocument>(`/pto/documents/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Work Permits
  getWorkPermits: async (params?: WorkPermitFilters): Promise<PaginatedResponse<WorkPermit>> => {
    const response = await apiClient.get<PaginatedResponse<WorkPermit>>('/pto/work-permits', { params });
    return response.data;
  },

  getWorkPermit: async (id: string): Promise<WorkPermit> => {
    const response = await apiClient.get<WorkPermit>(`/pto/work-permits/${id}`);
    return response.data;
  },

  createWorkPermit: async (data: Partial<WorkPermit>): Promise<WorkPermit> => {
    const response = await apiClient.post<WorkPermit>('/pto/work-permits', data);
    return response.data;
  },

  updateWorkPermit: async (id: string, data: Partial<WorkPermit>): Promise<WorkPermit> => {
    const response = await apiClient.put<WorkPermit>(`/pto/work-permits/${id}`, data);
    return response.data;
  },

  closeWorkPermit: async (id: string): Promise<WorkPermit> => {
    const response = await apiClient.post<WorkPermit>(`/pto/work-permits/${id}/close`);
    return response.data;
  },

  suspendWorkPermit: async (id: string, reason: string): Promise<WorkPermit> => {
    const response = await apiClient.post<WorkPermit>(`/pto/work-permits/${id}/suspend`, { reason });
    return response.data;
  },

  // Lab Tests
  getLabTests: async (params?: LabTestFilters): Promise<PaginatedResponse<LabTest>> => {
    const response = await apiClient.get<PaginatedResponse<LabTest>>('/pto/lab-tests', { params });
    return response.data;
  },

  getLabTest: async (id: string): Promise<LabTest> => {
    const response = await apiClient.get<LabTest>(`/pto/lab-tests/${id}`);
    return response.data;
  },

  createLabTest: async (data: Partial<LabTest>): Promise<LabTest> => {
    const response = await apiClient.post<LabTest>('/pto/lab-tests', data);
    return response.data;
  },

  updateLabTest: async (id: string, data: Partial<LabTest>): Promise<LabTest> => {
    const response = await apiClient.put<LabTest>(`/pto/lab-tests/${id}`, data);
    return response.data;
  },

  submitLabTestResult: async (id: string, result: LabTestResult, comment?: string): Promise<LabTest> => {
    const response = await apiClient.post<LabTest>(`/pto/lab-tests/${id}/result`, { result, comment });
    return response.data;
  },
};
