import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { WbsNode, ScheduleBaseline, EvmMetrics, ResourceAllocation } from './types';

export interface WbsNodeFilters extends PaginationParams {
  projectId: string;
}

export interface ScheduleBaselineFilters extends PaginationParams {
  projectId: string;
}

export interface EvmSnapshotFilters extends PaginationParams {
  projectId: string;
}

export interface ResourceAllocationFilters extends PaginationParams {
  wbsNodeId: string;
}

export const planningApi = {
  // ---- WBS Nodes ----

  getWbsNodes: async (params: WbsNodeFilters): Promise<PaginatedResponse<WbsNode>> => {
    const response = await apiClient.get<PaginatedResponse<WbsNode>>('/wbs-nodes', { params });
    return response.data;
  },

  getWbsNodeById: async (id: string): Promise<WbsNode> => {
    const response = await apiClient.get<WbsNode>(`/wbs-nodes/${id}`);
    return response.data;
  },

  getWbsTree: async (projectId: string): Promise<WbsNode[]> => {
    const response = await apiClient.get<WbsNode[]>('/wbs-nodes/tree', { params: { projectId } });
    return response.data;
  },

  getWbsChildren: async (parentId: string): Promise<WbsNode[]> => {
    const response = await apiClient.get<WbsNode[]>(`/wbs-nodes/${parentId}/children`);
    return response.data;
  },

  getCriticalPath: async (projectId: string): Promise<WbsNode[]> => {
    const response = await apiClient.get<WbsNode[]>('/wbs-nodes/critical-path', { params: { projectId } });
    return response.data;
  },

  createWbsNode: async (data: Partial<WbsNode>): Promise<WbsNode> => {
    const response = await apiClient.post<WbsNode>('/wbs-nodes', data);
    return response.data;
  },

  updateWbsNode: async (id: string, data: Partial<WbsNode>): Promise<WbsNode> => {
    const response = await apiClient.put<WbsNode>(`/wbs-nodes/${id}`, data);
    return response.data;
  },

  deleteWbsNode: async (id: string): Promise<void> => {
    await apiClient.delete(`/wbs-nodes/${id}`);
  },

  runForwardPass: async (projectId: string): Promise<void> => {
    await apiClient.post('/wbs-nodes/cpm/forward-pass', null, { params: { projectId } });
  },

  runBackwardPass: async (projectId: string): Promise<void> => {
    await apiClient.post('/wbs-nodes/cpm/backward-pass', null, { params: { projectId } });
  },

  // ---- WBS Dependencies ----

  getDependenciesByNode: async (nodeId: string): Promise<unknown[]> => {
    const response = await apiClient.get('/wbs-dependencies', { params: { nodeId } });
    return response.data;
  },

  getDependenciesByProject: async (projectId: string): Promise<unknown[]> => {
    const response = await apiClient.get('/wbs-dependencies/project', { params: { projectId } });
    return response.data;
  },

  getPredecessors: async (nodeId: string): Promise<unknown[]> => {
    const response = await apiClient.get(`/wbs-dependencies/${nodeId}/predecessors`);
    return response.data;
  },

  getSuccessors: async (nodeId: string): Promise<unknown[]> => {
    const response = await apiClient.get(`/wbs-dependencies/${nodeId}/successors`);
    return response.data;
  },

  createDependency: async (data: { predecessorId: string; successorId: string; dependencyType?: string; lagDays?: number }): Promise<unknown> => {
    const response = await apiClient.post('/wbs-dependencies', data);
    return response.data;
  },

  deleteDependency: async (id: string): Promise<void> => {
    await apiClient.delete(`/wbs-dependencies/${id}`);
  },

  // ---- Schedule Baselines ----

  getBaselines: async (params: ScheduleBaselineFilters): Promise<PaginatedResponse<ScheduleBaseline>> => {
    const response = await apiClient.get<PaginatedResponse<ScheduleBaseline>>('/schedule-baselines', { params });
    return response.data;
  },

  getBaselineById: async (id: string): Promise<ScheduleBaseline> => {
    const response = await apiClient.get<ScheduleBaseline>(`/schedule-baselines/${id}`);
    return response.data;
  },

  createBaseline: async (data: Partial<ScheduleBaseline>): Promise<ScheduleBaseline> => {
    const response = await apiClient.post<ScheduleBaseline>('/schedule-baselines', data);
    return response.data;
  },

  deleteBaseline: async (id: string): Promise<void> => {
    await apiClient.delete(`/schedule-baselines/${id}`);
  },

  // ---- EVM Snapshots ----

  getEvmSnapshots: async (params: EvmSnapshotFilters): Promise<PaginatedResponse<EvmMetrics>> => {
    const response = await apiClient.get<PaginatedResponse<EvmMetrics>>('/evm-snapshots', { params });
    return response.data;
  },

  getEvmSnapshotById: async (id: string): Promise<EvmMetrics> => {
    const response = await apiClient.get<EvmMetrics>(`/evm-snapshots/${id}`);
    return response.data;
  },

  getLatestEvmSnapshot: async (projectId: string): Promise<EvmMetrics> => {
    const response = await apiClient.get<EvmMetrics>('/evm-snapshots/latest', { params: { projectId } });
    return response.data;
  },

  getEvmByDateRange: async (projectId: string, from: string, to: string): Promise<EvmMetrics[]> => {
    const response = await apiClient.get<EvmMetrics[]>('/evm-snapshots/range', { params: { projectId, from, to } });
    return response.data;
  },

  createEvmSnapshot: async (data: Partial<EvmMetrics>): Promise<EvmMetrics> => {
    const response = await apiClient.post<EvmMetrics>('/evm-snapshots', data);
    return response.data;
  },

  deleteEvmSnapshot: async (id: string): Promise<void> => {
    await apiClient.delete(`/evm-snapshots/${id}`);
  },

  // ---- Resource Allocations ----

  getResourceAllocations: async (params: ResourceAllocationFilters): Promise<PaginatedResponse<ResourceAllocation>> => {
    const response = await apiClient.get<PaginatedResponse<ResourceAllocation>>('/resource-allocations', { params });
    return response.data;
  },

  getAllResourceAllocations: async (wbsNodeId: string): Promise<ResourceAllocation[]> => {
    const response = await apiClient.get<ResourceAllocation[]>('/resource-allocations/all', { params: { wbsNodeId } });
    return response.data;
  },

  getResourceAllocationById: async (id: string): Promise<ResourceAllocation> => {
    const response = await apiClient.get<ResourceAllocation>(`/resource-allocations/${id}`);
    return response.data;
  },

  createResourceAllocation: async (data: Partial<ResourceAllocation>): Promise<ResourceAllocation> => {
    const response = await apiClient.post<ResourceAllocation>('/resource-allocations', data);
    return response.data;
  },

  deleteResourceAllocation: async (id: string): Promise<void> => {
    await apiClient.delete(`/resource-allocations/${id}`);
  },
};
