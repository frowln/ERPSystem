import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { LegalCase, CaseStatus, CaseType, LegalDecision, LegalRemark, ContractLegalTemplate } from '@/modules/legal/types';

export interface LegalCaseFilters extends PaginationParams {
  status?: CaseStatus;
  caseType?: CaseType;
  projectId?: string;
  search?: string;
}

export interface LegalTemplateFilters extends PaginationParams {
  category?: string;
  status?: string;
  search?: string;
}

export const legalApi = {
  getCases: async (params?: LegalCaseFilters): Promise<PaginatedResponse<LegalCase>> => {
    const response = await apiClient.get<PaginatedResponse<LegalCase>>('/v1/legal/cases', { params });
    return response.data;
  },

  getCase: async (id: string): Promise<LegalCase> => {
    const response = await apiClient.get<LegalCase>(`/v1/legal/cases/${id}`);
    return response.data;
  },

  createCase: async (data: Partial<LegalCase>): Promise<LegalCase> => {
    const response = await apiClient.post<LegalCase>('/v1/legal/cases', data);
    return response.data;
  },

  updateCase: async (id: string, data: Partial<LegalCase>): Promise<LegalCase> => {
    const response = await apiClient.put<LegalCase>(`/v1/legal/cases/${id}`, data);
    return response.data;
  },

  getCaseDecisions: async (caseId: string): Promise<LegalDecision[]> => {
    const response = await apiClient.get<LegalDecision[]>(`/v1/legal/cases/${caseId}/decisions`);
    return response.data;
  },

  createDecision: async (caseId: string, data: Partial<LegalDecision>): Promise<LegalDecision> => {
    const response = await apiClient.post<LegalDecision>(`/v1/legal/cases/${caseId}/decisions`, data);
    return response.data;
  },

  getCaseRemarks: async (caseId: string): Promise<LegalRemark[]> => {
    const response = await apiClient.get<LegalRemark[]>(`/v1/legal/cases/${caseId}/remarks`);
    return response.data;
  },

  createRemark: async (caseId: string, data: Partial<LegalRemark>): Promise<LegalRemark> => {
    const response = await apiClient.post<LegalRemark>(`/v1/legal/cases/${caseId}/remarks`, data);
    return response.data;
  },

  getTemplates: async (params?: LegalTemplateFilters): Promise<PaginatedResponse<ContractLegalTemplate>> => {
    const response = await apiClient.get<PaginatedResponse<ContractLegalTemplate>>('/v1/legal/templates', { params });
    return response.data;
  },

  getTemplate: async (id: string): Promise<ContractLegalTemplate> => {
    const response = await apiClient.get<ContractLegalTemplate>(`/v1/legal/templates/${id}`);
    return response.data;
  },

  createTemplate: async (data: Partial<ContractLegalTemplate>): Promise<ContractLegalTemplate> => {
    const response = await apiClient.post<ContractLegalTemplate>('/v1/legal/templates', data);
    return response.data;
  },
};
