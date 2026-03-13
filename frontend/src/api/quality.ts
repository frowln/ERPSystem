import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { DefectStatistics } from '@/modules/quality/types';

const EMPTY_PAGE: PaginatedResponse<any> = { content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 };
const EMPTY_DEFECT_STATISTICS: DefectStatistics = { byType: [], bySeverity: [], total: 0 };

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

export interface CreateQualityCheckRequest {
  projectId: string;
  checkType?: QualityCheckType;
  type?: QualityCheckType;
  name: string;
  description?: string;
  plannedDate?: string;
  scheduledDate?: string;
  status?: string;
  inspectorId?: string;
  inspectorName?: string;
  taskId?: string;
  specItemId?: string;
  attachmentUrls?: string[];
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

  createCheck: async (data: CreateQualityCheckRequest): Promise<QualityCheck> => {
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
    try {
      const response = await apiClient.get('/quality/material-inspections', { params, _silentErrors: true } as any);
      const data = response.data;
      if (data?.content) return data;
      if (Array.isArray(data)) return { content: data, totalElements: data.length, totalPages: 1, page: 0, size: 20 };
      return EMPTY_PAGE;
    } catch {
      return EMPTY_PAGE;
    }
  },

  createMaterialInspection: async (data: import('@/modules/quality/types').CreateMaterialInspectionRequest): Promise<import('@/modules/quality/types').MaterialInspection> => {
    const response = await apiClient.post('/quality/material-inspections', data);
    return response.data;
  },

  // --- Checklist Templates ---
  getChecklistTemplates: async (params?: PaginationParams): Promise<PaginatedResponse<import('@/modules/quality/types').ChecklistTemplate>> => {
    try {
      const response = await apiClient.get('/quality/checklist-templates', { params, _silentErrors: true } as any);
      const data = response.data;
      if (data?.content) return data;
      if (Array.isArray(data)) return { content: data, totalElements: data.length, totalPages: 1, page: 0, size: 20 };
      return EMPTY_PAGE;
    } catch {
      return EMPTY_PAGE;
    }
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
    try {
      const response = await apiClient.get('/quality/defect-register', { params, _silentErrors: true } as any);
      const data = response.data;
      if (data?.content) return data;
      if (Array.isArray(data)) return { content: data, totalElements: data.length, totalPages: 1, page: 0, size: 20 };
      return EMPTY_PAGE;
    } catch {
      return EMPTY_PAGE;
    }
  },

  // --- Defect Statistics ---
  getDefectStatistics: async (params?: { projectId?: string; dateFrom?: string; dateTo?: string; severity?: string }): Promise<import('@/modules/quality/types').DefectStatistics> => {
    try {
      const response = await apiClient.get('/quality/defect-statistics', { params, _silentErrors: true } as any);
      return response.data ?? EMPTY_DEFECT_STATISTICS;
    } catch {
      return EMPTY_DEFECT_STATISTICS;
    }
  },

  // --- Author Supervision Journal ---
  getSupervisionEntries: async (params?: PaginationParams): Promise<PaginatedResponse<import('@/modules/quality/types').SupervisionEntry>> => {
    try {
      const response = await apiClient.get('/quality/supervision-entries', { params, _silentErrors: true } as any);
      const data = response.data;
      if (data?.content) return data;
      if (Array.isArray(data)) return { content: data, totalElements: data.length, totalPages: 1, page: 0, size: 20 };
      return EMPTY_PAGE;
    } catch {
      return EMPTY_PAGE;
    }
  },

  createSupervisionEntry: async (data: import('@/modules/quality/types').CreateSupervisionEntryRequest): Promise<import('@/modules/quality/types').SupervisionEntry> => {
    const response = await apiClient.post('/quality/supervision-entries', data);
    return response.data;
  },

  // --- Checklist Execution ---
  getChecklists: async (params?: PaginationParams): Promise<PaginatedResponse<import('@/modules/quality/types').QualityChecklistEntry>> => {
    const response = await apiClient.get('/quality/checklists', { params });
    return response.data;
  },

  getChecklist: async (id: string): Promise<import('@/modules/quality/types').QualityChecklistEntry> => {
    const response = await apiClient.get(`/quality/checklists/${id}`);
    return response.data;
  },

  getChecklistItems: async (checklistId: string): Promise<import('@/modules/quality/types').ChecklistExecutionItem[]> => {
    const response = await apiClient.get(`/quality/checklists/${checklistId}/items`);
    return response.data;
  },

  updateChecklistItem: async (checklistId: string, itemId: string, data: Partial<import('@/modules/quality/types').ChecklistExecutionItem>): Promise<import('@/modules/quality/types').ChecklistExecutionItem> => {
    const response = await apiClient.put(`/quality/checklists/${checklistId}/items/${itemId}`, data);
    return response.data;
  },

  completeChecklist: async (id: string): Promise<import('@/modules/quality/types').QualityChecklistEntry> => {
    const response = await apiClient.post(`/quality/checklists/${id}/complete`);
    return response.data;
  },

  deleteChecklist: async (id: string): Promise<void> => {
    await apiClient.delete(`/quality/checklists/${id}`);
  },

  // --- Floor Plans & Defects on Plan ---

  getPlans: async (projectId: string): Promise<import('@/modules/quality/types').FloorPlan[]> => {
    try {
      const response = await apiClient.get(`/quality/plans/${projectId}`, { _silentErrors: true } as any);
      return Array.isArray(response.data) ? response.data : response.data?.content ?? [];
    } catch {
      return [];
    }
  },

  uploadPlan: async (projectId: string, file: File, name?: string): Promise<import('@/modules/quality/types').FloorPlan> => {
    const fd = new FormData();
    fd.append('file', file);
    if (name) fd.append('name', name);
    const response = await apiClient.post(`/quality/plans/${projectId}/upload`, fd);
    return response.data;
  },

  getDefectsByPlan: async (planId: string): Promise<import('@/modules/quality/types').DefectOnPlanEntry[]> => {
    try {
      const response = await apiClient.get(`/quality/plans/${planId}/defects`, { _silentErrors: true } as any);
      return Array.isArray(response.data) ? response.data : response.data?.content ?? [];
    } catch {
      return [];
    }
  },

  createDefectOnPlan: async (planId: string, data: import('@/modules/quality/types').CreateDefectOnPlanRequest): Promise<import('@/modules/quality/types').DefectOnPlanEntry> => {
    const response = await apiClient.post(`/quality/plans/${planId}/defects`, data);
    return response.data;
  },
};
