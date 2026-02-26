import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type QualityCheckType = 'INCOMING' | 'IN_PROCESS' | 'FINAL' | 'AUDIT';
export type QualityCheckStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type QualityCheckResult = 'PASSED' | 'FAILED' | 'CONDITIONAL' | 'PENDING';

export interface QualityCheck {
  id: string;
  number: string;
  name: string;
  type: QualityCheckType;
  status: QualityCheckStatus;
  result: QualityCheckResult;
  projectId: string;
  projectName: string;
  inspectorName: string;
  scheduledDate: string;
  completedDate?: string;
  description: string;
  nonConformanceCount: number;
  createdAt: string;
}

export interface NonConformance {
  id: string;
  qualityCheckId: string;
  number: string;
  description: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedTo: string;
  dueDate: string;
  resolvedDate?: string;
  correctiveAction?: string;
  createdAt: string;
}

export interface QualityFilters extends PaginationParams {
  type?: QualityCheckType;
  status?: QualityCheckStatus;
  result?: QualityCheckResult;
  projectId?: string;
  search?: string;
}

export const qualityApi = {
  getChecks: async (params?: QualityFilters): Promise<PaginatedResponse<QualityCheck>> => {
    const response = await apiClient.get<PaginatedResponse<QualityCheck>>('/quality/checks', { params });
    return response.data;
  },

  getCheck: async (id: string): Promise<QualityCheck> => {
    const response = await apiClient.get<QualityCheck>(`/quality/checks/${id}`);
    return response.data;
  },

  createCheck: async (data: Partial<QualityCheck>): Promise<QualityCheck> => {
    const response = await apiClient.post<QualityCheck>('/quality/checks', data);
    return response.data;
  },

  updateCheck: async (id: string, data: Partial<QualityCheck>): Promise<QualityCheck> => {
    const response = await apiClient.put<QualityCheck>(`/quality/checks/${id}`, data);
    return response.data;
  },

  getNonConformances: async (params?: PaginationParams): Promise<PaginatedResponse<NonConformance>> => {
    const response = await apiClient.get<PaginatedResponse<NonConformance>>('/quality/non-conformances', { params });
    return response.data;
  },

  createNonConformance: async (data: Partial<NonConformance>): Promise<NonConformance> => {
    const response = await apiClient.post<NonConformance>('/quality/non-conformances', data);
    return response.data;
  },

  deleteCheck: async (id: string): Promise<void> => {
    await apiClient.delete(`/quality/checks/${id}`);
  },

  // --- Material Inspections ---
  getMaterialInspections: async (params?: PaginationParams): Promise<PaginatedResponse<import('@/modules/quality/types').MaterialInspection>> => {
    const response = await apiClient.get('/quality/material-inspections', { params });
    return response.data;
  },

  createMaterialInspection: async (data: import('@/modules/quality/types').CreateMaterialInspectionRequest): Promise<import('@/modules/quality/types').MaterialInspection> => {
    const response = await apiClient.post('/quality/material-inspections', data);
    return response.data;
  },

  // --- Checklist Templates ---
  getChecklistTemplates: async (params?: PaginationParams): Promise<PaginatedResponse<import('@/modules/quality/types').ChecklistTemplate>> => {
    const response = await apiClient.get('/quality/checklist-templates', { params });
    return response.data;
  },

  createChecklistTemplate: async (data: import('@/modules/quality/types').CreateChecklistTemplateRequest): Promise<import('@/modules/quality/types').ChecklistTemplate> => {
    const response = await apiClient.post('/quality/checklist-templates', data);
    return response.data;
  },

  updateChecklistTemplate: async (id: string, data: import('@/modules/quality/types').UpdateChecklistTemplateRequest): Promise<import('@/modules/quality/types').ChecklistTemplate> => {
    const response = await apiClient.put(`/quality/checklist-templates/${id}`, data);
    return response.data;
  },

  // --- Defect Register ---
  getDefectRegister: async (params?: PaginationParams): Promise<PaginatedResponse<import('@/modules/quality/types').DefectRegisterEntry>> => {
    const response = await apiClient.get('/quality/defect-register', { params });
    return response.data;
  },

  // --- Defect Statistics ---
  getDefectStatistics: async (params?: { projectId?: string; dateFrom?: string; dateTo?: string; severity?: string }): Promise<import('@/modules/quality/types').DefectStatistics> => {
    const response = await apiClient.get('/quality/defect-statistics', { params });
    return response.data;
  },

  // --- Author Supervision Journal ---
  getSupervisionEntries: async (params?: PaginationParams): Promise<PaginatedResponse<import('@/modules/quality/types').SupervisionEntry>> => {
    const response = await apiClient.get('/quality/supervision-entries', { params });
    return response.data;
  },

  createSupervisionEntry: async (data: import('@/modules/quality/types').CreateSupervisionEntryRequest): Promise<import('@/modules/quality/types').SupervisionEntry> => {
    const response = await apiClient.post('/quality/supervision-entries', data);
    return response.data;
  },
};
