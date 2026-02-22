import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type ResourceType = 'WORKER' | 'EQUIPMENT';

export interface ResourceAllocation {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  resourceName?: string;
  projectId: string;
  projectName?: string;
  startDate: string;
  endDate: string;
  allocationPercent: number;
  role?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceAllocationRequest {
  resourceType: ResourceType;
  resourceId: string;
  projectId: string;
  startDate: string;
  endDate: string;
  allocationPercent: number;
  role?: string;
  notes?: string;
}

export interface AllocationConflict {
  resourceId: string;
  resourceName: string;
  projects: { projectId: string; projectName: string; percent: number }[];
  overlapStart: string;
  overlapEnd: string;
  totalPercent: number;
}

export interface ResourceSuggestion {
  resourceId: string;
  resourceName: string;
  resourceType?: ResourceType;
  position?: string;
  skills: string[];
  certifications: string[];
  currentAllocations: { projectId: string; projectName: string; allocationPercent: number }[];
  availabilityPercent: number;
}

export interface AllocationFilters extends PaginationParams {
  startDate?: string;
  endDate?: string;
  projectId?: string;
  resourceType?: ResourceType;
}

export const resourceAllocationApi = {
  getAll: async (params?: AllocationFilters): Promise<PaginatedResponse<ResourceAllocation>> => {
    const response = await apiClient.get<ResourceAllocation[] | PaginatedResponse<ResourceAllocation>>('/planning/multi-project-allocation', { params });
    const raw = response.data;
    // Backend returns a list for date-range queries; wrap into PaginatedResponse shape
    if (Array.isArray(raw)) {
      return { content: raw, totalElements: raw.length, totalPages: 1, page: 0, size: raw.length };
    }
    return raw as PaginatedResponse<ResourceAllocation>;
  },

  create: async (data: CreateResourceAllocationRequest): Promise<ResourceAllocation> => {
    const response = await apiClient.post<ResourceAllocation>('/planning/multi-project-allocation', data);
    return response.data;
  },

  update: async (id: string, data: CreateResourceAllocationRequest): Promise<ResourceAllocation> => {
    const response = await apiClient.put<ResourceAllocation>(`/planning/multi-project-allocation/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/planning/multi-project-allocation/${id}`);
  },

  getConflicts: async (startDate: string, endDate: string): Promise<AllocationConflict[]> => {
    const response = await apiClient.get<AllocationConflict[]>('/planning/multi-project-allocation/conflicts', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getSuggestions: async (projectId: string, startDate: string, endDate: string, skills?: string): Promise<ResourceSuggestion[]> => {
    const response = await apiClient.get<ResourceSuggestion[]>('/planning/multi-project-allocation/suggestions', {
      params: { projectId, startDate, endDate, skills },
    });
    return response.data;
  },
};
