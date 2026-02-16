import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type BimModelStatus = 'ACTIVE' | 'PROCESSING' | 'REVIEW' | 'ARCHIVED' | 'ERROR';
export type BimModelFormat = 'IFC' | 'RVT' | 'NWD' | 'NWC' | 'DWG' | 'DGN';
export type DesignPackageStatus = 'DRAFT' | 'ISSUED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';
export type ClashSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';
export type ClashStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'APPROVED' | 'IGNORED';

export interface BimModel {
  id: string;
  name: string;
  format: BimModelFormat;
  uploadDate: string;
  fileSize: string;
  status: BimModelStatus;
  projectId: string;
  projectName: string;
  uploadedBy: string;
  version: string;
  description?: string;
}

export interface DesignPackage {
  id: string;
  code: string;
  name: string;
  section: string;
  status: DesignPackageStatus;
  projectId: string;
  projectName: string;
  reviewer: string;
  issueDate: string;
  reviewDate: string | null;
  sheetsCount: number;
  revision: string;
}

export interface Clash {
  id: string;
  code: string;
  description: string;
  severity: ClashSeverity;
  status: ClashStatus;
  location: string;
  discipline1: string;
  discipline2: string;
  assignedTo: string;
  detectedDate: string;
  resolvedDate: string | null;
  projectId: string;
  projectName: string;
}

export interface BimModelFilters extends PaginationParams {
  status?: BimModelStatus;
  format?: BimModelFormat;
  projectId?: string;
  search?: string;
}

export interface DesignPackageFilters extends PaginationParams {
  status?: DesignPackageStatus;
  section?: string;
  projectId?: string;
  search?: string;
}

export interface ClashFilters extends PaginationParams {
  status?: ClashStatus;
  severity?: ClashSeverity;
  projectId?: string;
  search?: string;
}

export const bimApi = {
  // BIM Models
  getModels: async (params?: BimModelFilters): Promise<PaginatedResponse<BimModel>> => {
    const response = await apiClient.get<PaginatedResponse<BimModel>>('/bim/models', { params });
    return response.data;
  },

  getModel: async (id: string): Promise<BimModel> => {
    const response = await apiClient.get<BimModel>(`/bim/models/${id}`);
    return response.data;
  },

  uploadModel: async (file: File, data: Partial<BimModel>): Promise<BimModel> => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, String(value));
    });
    const response = await apiClient.post<BimModel>('/bim/models', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateModel: async (id: string, data: Partial<BimModel>): Promise<BimModel> => {
    const response = await apiClient.put<BimModel>(`/bim/models/${id}`, data);
    return response.data;
  },

  deleteModel: async (id: string): Promise<void> => {
    await apiClient.delete(`/bim/models/${id}`);
  },

  // Design Packages
  getDesignPackages: async (params?: DesignPackageFilters): Promise<PaginatedResponse<DesignPackage>> => {
    const response = await apiClient.get<PaginatedResponse<DesignPackage>>('/bim/design-packages', { params });
    return response.data;
  },

  getDesignPackage: async (id: string): Promise<DesignPackage> => {
    const response = await apiClient.get<DesignPackage>(`/bim/design-packages/${id}`);
    return response.data;
  },

  createDesignPackage: async (data: Partial<DesignPackage>): Promise<DesignPackage> => {
    const response = await apiClient.post<DesignPackage>('/bim/design-packages', data);
    return response.data;
  },

  updateDesignPackage: async (id: string, data: Partial<DesignPackage>): Promise<DesignPackage> => {
    const response = await apiClient.put<DesignPackage>(`/bim/design-packages/${id}`, data);
    return response.data;
  },

  approveDesignPackage: async (id: string): Promise<DesignPackage> => {
    const response = await apiClient.post<DesignPackage>(`/bim/design-packages/${id}/approve`);
    return response.data;
  },

  rejectDesignPackage: async (id: string, reason: string): Promise<DesignPackage> => {
    const response = await apiClient.post<DesignPackage>(`/bim/design-packages/${id}/reject`, { reason });
    return response.data;
  },

  // Clash Detection
  getClashes: async (params?: ClashFilters): Promise<PaginatedResponse<Clash>> => {
    const response = await apiClient.get<PaginatedResponse<Clash>>('/bim/clashes', { params });
    return response.data;
  },

  getClash: async (id: string): Promise<Clash> => {
    const response = await apiClient.get<Clash>(`/bim/clashes/${id}`);
    return response.data;
  },

  runClashDetection: async (projectId: string, modelIds: string[]): Promise<{ jobId: string }> => {
    const response = await apiClient.post<{ jobId: string }>('/bim/clashes/detect', { projectId, modelIds });
    return response.data;
  },

  updateClash: async (id: string, data: Partial<Clash>): Promise<Clash> => {
    const response = await apiClient.put<Clash>(`/bim/clashes/${id}`, data);
    return response.data;
  },

  resolveClash: async (id: string, comment?: string): Promise<Clash> => {
    const response = await apiClient.post<Clash>(`/bim/clashes/${id}/resolve`, { comment });
    return response.data;
  },

  ignoreClash: async (id: string, reason: string): Promise<Clash> => {
    const response = await apiClient.post<Clash>(`/bim/clashes/${id}/ignore`, { reason });
    return response.data;
  },
};
