import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { PtoDocument, LabTest, PtoDocumentStatus } from './types';

export interface PtoDocumentFilters extends PaginationParams {
  projectId?: string;
  status?: PtoDocumentStatus;
}

export interface SubmittalFilters extends PaginationParams {
  projectId?: string;
  status?: string;
}

export interface LabTestFilters extends PaginationParams {
  projectId: string;
}

export interface Submittal {
  id: string;
  number: string;
  title: string;
  status: string;
  projectId: string;
  projectName?: string;
  createdAt: string;
}

export interface PtoDashboard {
  totalDocuments: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  totalLabTests: number;
  passedLabTests: number;
}

export const ptoApi = {
  // ---- PTO Documents ----

  getDocuments: async (params?: PtoDocumentFilters): Promise<PaginatedResponse<PtoDocument>> => {
    const response = await apiClient.get<PaginatedResponse<PtoDocument>>('/pto/documents', { params });
    return response.data;
  },

  getDocumentById: async (id: string): Promise<PtoDocument> => {
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

  changeDocumentStatus: async (id: string, data: { status: PtoDocumentStatus }): Promise<PtoDocument> => {
    const response = await apiClient.patch<PtoDocument>(`/pto/documents/${id}/status`, data);
    return response.data;
  },

  deleteDocument: async (id: string): Promise<void> => {
    await apiClient.delete(`/pto/documents/${id}`);
  },

  // ---- Submittals ----

  getSubmittals: async (params?: SubmittalFilters): Promise<PaginatedResponse<Submittal>> => {
    const response = await apiClient.get<PaginatedResponse<Submittal>>('/pto/submittals', { params });
    return response.data;
  },

  getSubmittalById: async (id: string): Promise<Submittal> => {
    const response = await apiClient.get<Submittal>(`/pto/submittals/${id}`);
    return response.data;
  },

  createSubmittal: async (data: Partial<Submittal>): Promise<Submittal> => {
    const response = await apiClient.post<Submittal>('/pto/submittals', data);
    return response.data;
  },

  changeSubmittalStatus: async (id: string, data: { status: string }): Promise<Submittal> => {
    const response = await apiClient.patch<Submittal>(`/pto/submittals/${id}/status`, data);
    return response.data;
  },

  getSubmittalComments: async (id: string): Promise<unknown[]> => {
    const response = await apiClient.get(`/pto/submittals/${id}/comments`);
    return response.data;
  },

  addSubmittalComment: async (id: string, data: { text: string }): Promise<unknown> => {
    const response = await apiClient.post(`/pto/submittals/${id}/comments`, data);
    return response.data;
  },

  deleteSubmittal: async (id: string): Promise<void> => {
    await apiClient.delete(`/pto/submittals/${id}`);
  },

  // ---- Lab Tests ----

  getLabTests: async (params: LabTestFilters): Promise<PaginatedResponse<LabTest>> => {
    const response = await apiClient.get<PaginatedResponse<LabTest>>('/pto/lab-tests', { params });
    return response.data;
  },

  getLabTestById: async (id: string): Promise<LabTest> => {
    const response = await apiClient.get<LabTest>(`/pto/lab-tests/${id}`);
    return response.data;
  },

  createLabTest: async (data: Partial<LabTest>): Promise<LabTest> => {
    const response = await apiClient.post<LabTest>('/pto/lab-tests', data);
    return response.data;
  },

  deleteLabTest: async (id: string): Promise<void> => {
    await apiClient.delete(`/pto/lab-tests/${id}`);
  },

  // ---- Dashboard ----

  getDashboard: async (projectId: string): Promise<PtoDashboard> => {
    const response = await apiClient.get<PtoDashboard>(`/pto/dashboard/${projectId}`);
    return response.data;
  },

  // ---- Acts of Osvidetelstvovanie ----

  getActs: async (params: { projectId: string } & PaginationParams): Promise<PaginatedResponse<unknown>> => {
    const response = await apiClient.get('/pto/acts', { params });
    return response.data;
  },

  getActById: async (id: string): Promise<unknown> => {
    const response = await apiClient.get(`/pto/acts/${id}`);
    return response.data;
  },

  createAct: async (data: unknown): Promise<unknown> => {
    const response = await apiClient.post('/pto/acts', data);
    return response.data;
  },

  changeActStatus: async (id: string, status: string): Promise<unknown> => {
    const response = await apiClient.patch(`/pto/acts/${id}/status`, null, { params: { status } });
    return response.data;
  },

  // ---- Material Certificates ----

  getCertificates: async (params: { materialId: string } & PaginationParams): Promise<PaginatedResponse<unknown>> => {
    const response = await apiClient.get('/pto/certificates', { params });
    return response.data;
  },

  getCertificateById: async (id: string): Promise<unknown> => {
    const response = await apiClient.get(`/pto/certificates/${id}`);
    return response.data;
  },

  createCertificate: async (data: unknown): Promise<unknown> => {
    const response = await apiClient.post('/pto/certificates', data);
    return response.data;
  },

  invalidateCertificate: async (id: string): Promise<unknown> => {
    const response = await apiClient.patch(`/pto/certificates/${id}/invalidate`);
    return response.data;
  },

  deleteCertificate: async (id: string): Promise<void> => {
    await apiClient.delete(`/pto/certificates/${id}`);
  },
};
