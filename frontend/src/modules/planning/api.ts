import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  WbsNode,
  ScheduleBaseline,
  EvmMetrics,
  ResourceAllocation,
  CriticalPathTask,
  EvmIndicators,
  ResourceAssignment,
  ResourceHistogramEntry,
  Baseline,
  BaselineComparison,
  SCurveData,
} from './types';

/** Map backend LABOR/EQUIPMENT/MATERIAL to frontend crew/equipment/material */
function mapResourceType(backend: string): 'crew' | 'equipment' | 'material' {
  switch (backend) {
    case 'LABOR': return 'crew';
    case 'EQUIPMENT': return 'equipment';
    case 'MATERIAL': return 'material';
    default: return 'crew';
  }
}

function reverseMapResourceType(frontend: string): string {
  switch (frontend) {
    case 'crew': return 'LABOR';
    case 'equipment': return 'EQUIPMENT';
    case 'material': return 'MATERIAL';
    default: return 'LABOR';
  }
}

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

  // ---- Critical Path Method ----

  getCriticalPathTasks: async (projectId: string): Promise<CriticalPathTask[]> => {
    const response = await apiClient.get<CriticalPathTask[]>('/wbs-nodes/critical-path/tasks', {
      params: { projectId },
    });
    return response.data;
  },

  // ---- EVM Indicators (extended) ----

  getEvmIndicators: async (projectId: string): Promise<EvmIndicators> => {
    const response = await apiClient.get('/evm-snapshots/indicators', {
      params: { projectId },
    });
    const raw = response.data?.data ?? response.data;
    if (!raw) {
      return { cpi: 1, spi: 1, eac: 0, etc: 0, vac: 0, bac: 0, pv: 0, ev: 0, ac: 0, svPercent: 0, cvPercent: 0, sCurve: [] };
    }
    const bac = Number(raw.budgetAtCompletion ?? raw.bac) || 0;
    const pv = Number(raw.plannedValue ?? raw.pv) || 0;
    const ev = Number(raw.earnedValue ?? raw.ev) || 0;
    const ac = Number(raw.actualCost ?? raw.ac) || 0;
    const cpi = Number(raw.cpi) || (ac > 0 ? ev / ac : 1);
    const spi = Number(raw.spi) || (pv > 0 ? ev / pv : 1);
    const eac = Number(raw.eac) || (cpi > 0 ? bac / cpi : bac);
    const etc = Number(raw.etcValue ?? raw.etc) || Math.max(0, eac - ac);
    const sv = ev - pv;
    const cv = ev - ac;
    const vac = bac - eac;
    const svPercent = pv > 0 ? (sv / pv) * 100 : 0;
    const cvPercent = ev > 0 ? (cv / ev) * 100 : 0;
    return { cpi, spi, eac, etc, vac, bac, pv, ev, ac, svPercent, cvPercent, sCurve: [] };
  },

  // ---- Resource Planning ----
  // Backend /resource-allocations only has WBS-node-level allocation.
  // Plan/histogram endpoints are not yet on backend — fallback from resource-allocations list.

  getResourcePlan: async (projectId: string): Promise<ResourceAssignment[]> => {
    try {
      const response = await apiClient.get('/resource-allocations', {
        params: { page: 0, size: 500 },
      });
      const wrapper = response.data?.data ?? response.data;
      const items: Record<string, unknown>[] = wrapper?.content ?? (Array.isArray(wrapper) ? wrapper : []);
      return items.map((raw) => ({
        id: String(raw.id ?? ''),
        taskId: String(raw.wbsNodeId ?? ''),
        taskName: String(raw.resourceName ?? ''),
        resourceName: String(raw.resourceName ?? ''),
        resourceType: mapResourceType(String(raw.resourceType ?? 'LABOR')),
        startDate: String(raw.startDate ?? ''),
        endDate: String(raw.endDate ?? ''),
        utilization: Number(raw.utilization) || (Number(raw.plannedUnits) > 0 ? Math.round((Number(raw.actualUnits ?? 0) / Number(raw.plannedUnits)) * 100) : 0),
        isOverAllocated: (Number(raw.utilization) || 0) > 100,
      }));
    } catch {
      return [];
    }
  },

  getResourceHistogram: async (_projectId: string): Promise<ResourceHistogramEntry[]> => {
    // Histogram is not available as a dedicated endpoint yet — return empty
    return [];
  },

  assignResource: async (data: {
    taskId: string;
    resourceName: string;
    resourceType: 'crew' | 'equipment' | 'material';
    startDate: string;
    endDate: string;
    utilization: number;
  }): Promise<ResourceAssignment> => {
    const response = await apiClient.post<ResourceAssignment>('/resource-allocations', {
      wbsNodeId: data.taskId,
      resourceName: data.resourceName,
      resourceType: reverseMapResourceType(data.resourceType),
      plannedUnits: data.utilization,
      startDate: data.startDate,
      endDate: data.endDate,
    });
    const raw = response.data as unknown as Record<string, unknown>;
    return {
      id: String(raw.id ?? ''),
      taskId: String(raw.wbsNodeId ?? data.taskId),
      taskName: String(raw.resourceName ?? ''),
      resourceName: data.resourceName,
      resourceType: data.resourceType,
      startDate: data.startDate,
      endDate: data.endDate,
      utilization: data.utilization,
      isOverAllocated: data.utilization > 100,
    };
  },

  // ---- Baselines Management (extended) ----

  getBaselinesList: async (projectId: string): Promise<Baseline[]> => {
    const response = await apiClient.get<Baseline[]>('/schedule-baselines/list', {
      params: { projectId },
    });
    return response.data;
  },

  createBaselineSnapshot: async (data: { projectId: string; name: string }): Promise<Baseline> => {
    const response = await apiClient.post<Baseline>('/schedule-baselines/snapshot', data);
    return response.data;
  },

  compareBaselines: async (baselineId1: string, baselineId2: string): Promise<BaselineComparison> => {
    const response = await apiClient.get<BaselineComparison>('/schedule-baselines/compare', {
      params: { baselineId1, baselineId2 },
    });
    return response.data;
  },

  // ---- S-Curve ----

  getSCurveData: async (projectId: string, viewMode: string): Promise<SCurveData> => {
    const response = await apiClient.get<SCurveData>('/evm-snapshots/s-curve', {
      params: { projectId, viewMode },
    });
    return response.data;
  },
};
