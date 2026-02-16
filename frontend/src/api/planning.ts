import { apiClient } from './client';
import type { PaginationParams } from '@/types';
import type {
  WbsNode,
  ScheduleBaseline,
  EvmMetrics,
  ResourceAllocation,
} from '@/modules/planning/types';

export interface WbsFilters {
  projectId?: string;
}

export interface ResourceAllocationFilters extends PaginationParams {
  projectId?: string;
  resourceType?: string;
  period?: string;
}

export const planningApi = {
  getWbsTree: async (projectId?: string): Promise<WbsNode[]> => {
    const response = await apiClient.get<WbsNode[]>('/wbs-nodes/tree', {
      params: projectId ? { projectId } : undefined,
    });
    return response.data;
  },

  getWbsNode: async (id: string): Promise<WbsNode> => {
    const response = await apiClient.get<WbsNode>(`/wbs-nodes/${id}`);
    return response.data;
  },

  getBaselines: async (projectId?: string): Promise<ScheduleBaseline[]> => {
    const response = await apiClient.get<ScheduleBaseline[]>('/schedule-baselines', {
      params: projectId ? { projectId } : undefined,
    });
    return response.data;
  },

  getEvmMetrics: async (projectId: string): Promise<EvmMetrics> => {
    const response = await apiClient.get<EvmMetrics>('/evm-snapshots/latest', {
      params: { projectId },
    });
    return response.data;
  },

  getResourceAllocations: async (params?: ResourceAllocationFilters): Promise<ResourceAllocation[]> => {
    const response = await apiClient.get<ResourceAllocation[]>('/resource-allocations', { params });
    return response.data;
  },

  getGanttData: async (projectId?: string): Promise<WbsNode[]> => {
    const response = await apiClient.get<WbsNode[]>('/wbs-nodes/tree', {
      params: projectId ? { projectId } : undefined,
    });
    return response.data;
  },
};
