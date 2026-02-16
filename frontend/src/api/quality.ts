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
};
