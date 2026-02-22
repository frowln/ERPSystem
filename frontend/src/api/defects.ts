import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type DefectSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DefectStatus = 'OPEN' | 'IN_PROGRESS' | 'FIXED' | 'VERIFIED' | 'CLOSED' | 'REJECTED';

export interface Defect {
  id: string;
  organizationId: string;
  projectId: string;
  qualityCheckId?: string;
  code: string;
  title: string;
  description?: string;
  location?: string;
  severity: DefectSeverity;
  severityDisplayName: string;
  photoUrls?: string;
  detectedById?: string;
  assignedToId?: string;
  contractorId?: string;
  fixDeadline?: string;
  slaDeadlineHours?: number;
  reinspectionCount: number;
  assignedAt?: string;
  verificationRequestedAt?: string;
  status: DefectStatus;
  statusDisplayName: string;
  fixDescription?: string;
  fixedAt?: string;
  drawingId?: string;
  pinX?: number;
  pinY?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface DefectFilters extends PaginationParams {
  projectId?: string;
  contractorId?: string;
  severity?: DefectSeverity;
  status?: DefectStatus;
  search?: string;
}

export interface CreateDefectRequest {
  projectId: string;
  qualityCheckId?: string;
  title: string;
  description?: string;
  location?: string;
  severity?: DefectSeverity;
  photoUrls?: string;
  detectedById?: string;
  assignedToId?: string;
  contractorId?: string;
  fixDeadline?: string;
  slaDeadlineHours?: number;
  drawingId?: string;
  pinX?: number;
  pinY?: number;
}

export interface UpdateDefectRequest {
  title?: string;
  description?: string;
  location?: string;
  severity?: DefectSeverity;
  photoUrls?: string;
  assignedToId?: string;
  contractorId?: string;
  fixDeadline?: string;
  slaDeadlineHours?: number;
  fixDescription?: string;
  drawingId?: string;
  pinX?: number;
  pinY?: number;
}

export interface DefectDashboardGroupStats {
  id: string;
  name: string;
  open: number;
  inProgress: number;
  fixed: number;
  verified: number;
  total: number;
}

export interface DefectDashboard {
  totalOpen: number;
  totalOverdue: number;
  avgResolutionHours: number | null;
  bySeverity: Record<string, number>;
  byContractor: DefectDashboardGroupStats[];
  byProject: DefectDashboardGroupStats[];
}

export const defectsApi = {
  getDefects: async (params?: DefectFilters): Promise<PaginatedResponse<Defect>> => {
    const response = await apiClient.get<PaginatedResponse<Defect>>('/defects', { params });
    return response.data;
  },

  getDefect: async (id: string): Promise<Defect> => {
    const response = await apiClient.get<Defect>(`/defects/${id}`);
    return response.data;
  },

  getDashboard: async (): Promise<DefectDashboard> => {
    const response = await apiClient.get<DefectDashboard>('/defects/dashboard');
    return response.data;
  },

  createDefect: async (data: CreateDefectRequest): Promise<Defect> => {
    const response = await apiClient.post<Defect>('/defects', data);
    return response.data;
  },

  updateDefect: async (id: string, data: UpdateDefectRequest): Promise<Defect> => {
    const response = await apiClient.put<Defect>(`/defects/${id}`, data);
    return response.data;
  },

  transitionStatus: async (id: string, status: DefectStatus, fixDescription?: string): Promise<Defect> => {
    const response = await apiClient.patch<Defect>(`/defects/${id}/transition`, null, {
      params: { status, fixDescription },
    });
    return response.data;
  },

  deleteDefect: async (id: string): Promise<void> => {
    await apiClient.delete(`/defects/${id}`);
  },
};
