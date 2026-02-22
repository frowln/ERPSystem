import { apiClient } from './client';
import type { PaginationParams } from '@/types';
import type {
  WbsNode,
  ScheduleBaseline,
  EvmMetrics,
  ResourceAllocation,
  EvmTrendPoint,
  EacMethods,
  WorkVolumeSummary,
  WorkVolumeEntry,
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

  getEvmTrend: async (projectId: string): Promise<EvmTrendPoint[]> => {
    const response = await apiClient.get<EvmTrendPoint[]>('/evm-snapshots/trend', {
      params: { projectId },
    });
    return response.data;
  },

  getEacMethods: async (projectId: string): Promise<EacMethods> => {
    const response = await apiClient.get<EacMethods>('/evm-snapshots/eac-methods', {
      params: { projectId },
    });
    return response.data;
  },

  // Work Volume Tracking
  getWorkVolumeSummary: async (projectId: string, date?: string): Promise<WorkVolumeSummary[]> => {
    const response = await apiClient.get<WorkVolumeSummary[]>('/work-volumes/summary', {
      params: { projectId, date },
    });
    return response.data;
  },

  getWorkVolumesByDate: async (projectId: string, date?: string): Promise<WorkVolumeEntry[]> => {
    const response = await apiClient.get<WorkVolumeEntry[]>('/work-volumes/entries', {
      params: { projectId, date },
    });
    return response.data;
  },

  updateWorkVolume: async (entryId: string, data: {
    projectId?: string;
    wbsNodeId?: string;
    recordDate?: string;
    quantity: number;
    unitOfMeasure?: string;
    notes?: string;
  }): Promise<WorkVolumeEntry> => {
    const response = await apiClient.put<WorkVolumeEntry>(`/work-volumes/entries/${entryId}`, data);
    return response.data;
  },

  createWorkVolume: async (data: {
    projectId?: string;
    wbsNodeId: string;
    recordDate?: string;
    date?: string;
    quantity: number;
    unitOfMeasure?: string;
    notes?: string;
  }): Promise<WorkVolumeEntry> => {
    const response = await apiClient.post<WorkVolumeEntry>('/work-volumes/entries', data);
    return response.data;
  },
};
