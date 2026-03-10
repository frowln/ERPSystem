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
  CriticalPathTask,
} from '@/modules/planning/types';

export interface WbsFilters {
  projectId?: string;
}

export interface ResourceAllocationFilters extends PaginationParams {
  projectId?: string;
  resourceType?: string;
  period?: string;
}

/** Map backend WbsNodeResponse fields to frontend WbsNode type */
function normalizeWbsNode(raw: Record<string, unknown>): WbsNode {
  const r = raw as unknown as WbsNode & { isCritical?: boolean };
  return {
    ...r,
    isCriticalPath: r.isCriticalPath ?? r.isCritical ?? false,
    percentComplete: r.percentComplete ?? 0,
    totalFloat: r.totalFloat ?? 0,
    budgetedCost: r.budgetedCost ?? 0,
    actualCost: r.actualCost ?? 0,
    earnedValue: r.earnedValue ?? 0,
    children: r.children ? r.children.map((c) => normalizeWbsNode(c as unknown as Record<string, unknown>)) : undefined,
  };
}

/** Map backend EvmSnapshotResponse fields to frontend EvmMetrics type */
function normalizeEvmSnapshot(raw: Record<string, unknown> | null | undefined): EvmMetrics {
  if (!raw) {
    return {
      projectId: '', projectName: '---', dataDate: new Date().toISOString().slice(0, 10),
      bac: 0, pv: 0, ev: 0, ac: 0, sv: 0, cv: 0, spi: 1, cpi: 1,
      eac: 0, etc: 0, vac: 0, tcpiEac: 1, percentComplete: 0, sCurveData: [],
    };
  }
  const bac = Number(raw.budgetAtCompletion ?? raw.bac) || 0;
  const pv = Number(raw.plannedValue ?? raw.pv) || 0;
  const ev = Number(raw.earnedValue ?? raw.ev) || 0;
  const ac = Number(raw.actualCost ?? raw.ac) || 0;
  const cpi = Number(raw.cpi) || (ac > 0 ? ev / ac : 1);
  const spi = Number(raw.spi) || (pv > 0 ? ev / pv : 1);
  const eac = Number(raw.eac) || (cpi > 0 ? bac / cpi : bac);
  const etcVal = Number(raw.etcValue ?? raw.etc) || Math.max(0, eac - ac);
  const sv = ev - pv;
  const cv = ev - ac;
  const vac = bac - eac;
  const tcpiEac = Number(raw.tcpi ?? raw.tcpiEac) || 1;
  const percentComplete = Number(raw.percentComplete) || 0;

  return {
    projectId: String(raw.projectId ?? ''),
    projectName: String(raw.projectName ?? '---'),
    dataDate: String(raw.dataDate ?? raw.snapshotDate ?? new Date().toISOString().slice(0, 10)),
    bac, pv, ev, ac, sv, cv, spi, cpi, eac,
    etc: etcVal, vac, tcpiEac, percentComplete,
    sCurveData: Array.isArray(raw.sCurveData) ? raw.sCurveData : [],
  };
}

/** Build WBS tree from flat nodes list using parentId linkage */
function buildTree(nodes: WbsNode[]): WbsNode[] {
  const map = new Map<string, WbsNode>();
  const roots: WbsNode[] = [];

  // First pass: index all nodes
  for (const node of nodes) {
    map.set(node.id, { ...node, children: [] });
  }

  // Second pass: link children to parents
  for (const node of nodes) {
    const mapped = map.get(node.id)!;
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children!.push(mapped);
    } else {
      roots.push(mapped);
    }
  }

  return roots;
}

export const planningApi = {
  getWbsTree: async (projectId?: string): Promise<WbsNode[]> => {
    const response = await apiClient.get('/wbs-nodes', {
      params: { projectId, page: 0, size: 500, sort: 'sortOrder,asc' },
    });
    const rawNodes: WbsNode[] = (response.data?.content ?? response.data ?? [])
      .map((n: unknown) => normalizeWbsNode(n as Record<string, unknown>));
    return buildTree(rawNodes);
  },

  getWbsNode: async (id: string): Promise<WbsNode> => {
    const response = await apiClient.get<WbsNode>(`/wbs-nodes/${id}`);
    return normalizeWbsNode(response.data as unknown as Record<string, unknown>);
  },

  getBaselines: async (projectId?: string): Promise<ScheduleBaseline[]> => {
    const response = await apiClient.get<ScheduleBaseline[]>('/schedule-baselines', {
      params: projectId ? { projectId } : undefined,
    });
    return response.data;
  },

  getEvmMetrics: async (projectId: string): Promise<EvmMetrics> => {
    const response = await apiClient.get('/evm-snapshots/latest', {
      params: { projectId },
    });
    return normalizeEvmSnapshot(response.data?.data ?? response.data);
  },

  getResourceAllocations: async (params?: ResourceAllocationFilters): Promise<ResourceAllocation[]> => {
    const response = await apiClient.get('/resource-allocations', { params });
    // Backend returns ApiResponse<PageResponse<ResourceAllocationResponse>>
    const wrapper = response.data?.data ?? response.data;
    const items: Record<string, unknown>[] = wrapper?.content ?? (Array.isArray(wrapper) ? wrapper : []);
    // Normalize backend field names to frontend ResourceAllocation type
    return items.map((raw) => ({
      id: String(raw.id ?? ''),
      wbsCode: String(raw.wbsCode ?? raw.wbsNodeId ?? ''),
      wbsName: String(raw.wbsName ?? raw.resourceName ?? ''),
      resourceName: String(raw.resourceName ?? ''),
      resourceType: String(raw.resourceType ?? 'LABOR') as 'LABOR' | 'EQUIPMENT' | 'MATERIAL',
      plannedHours: Number(raw.plannedHours ?? raw.plannedUnits) || 0,
      actualHours: Number(raw.actualHours ?? raw.actualUnits) || 0,
      utilization: Number(raw.utilization) || (Number(raw.plannedUnits) > 0 ? Math.round((Number(raw.actualUnits ?? 0) / Number(raw.plannedUnits)) * 100) : 0),
      period: String(raw.period ?? raw.startDate ?? ''),
      costRate: Number(raw.costRate ?? raw.unitRate) || 0,
      plannedCost: Number(raw.plannedCost) || 0,
      actualCost: Number(raw.actualCost) || 0,
    }));
  },

  getGanttData: async (projectId?: string): Promise<WbsNode[]> => {
    // Fetch all WBS nodes for the project (paginated, up to 500)
    const response = await apiClient.get('/wbs-nodes', {
      params: { projectId, page: 0, size: 500, sort: 'sortOrder,asc' },
    });
    const rawNodes: WbsNode[] = (response.data?.content ?? response.data ?? [])
      .map((n: unknown) => normalizeWbsNode(n as Record<string, unknown>));
    return buildTree(rawNodes);
  },

  getEvmTrend: async (projectId: string): Promise<EvmTrendPoint[]> => {
    const response = await apiClient.get('/evm-analytics/trend', {
      params: { projectId },
    });
    return response.data?.data ?? response.data ?? [];
  },

  getEacMethods: async (projectId: string): Promise<EacMethods> => {
    const response = await apiClient.get('/evm-analytics/eac-methods', {
      params: { projectId },
    });
    const raw = response.data?.data ?? response.data;
    return {
      projectId: raw.projectId ?? projectId,
      bac: Number(raw.bac) || 0,
      eacCpi: Number(raw.eacCpi) || 0,
      eacSpiCpi: Number(raw.eacSpiCpi) || 0,
      eacBottom: Number(raw.eacBottom) || 0,
      ieac: Number(raw.ieac) || 0,
    };
  },

  // Work Volume Tracking
  getWorkVolumeSummary: async (projectId: string, date?: string): Promise<WorkVolumeSummary[]> => {
    const response = await apiClient.get('/work-volumes/summary', {
      params: { projectId, date },
    });
    const wrapper = response.data?.data ?? response.data;
    return Array.isArray(wrapper) ? wrapper : [];
  },

  getWorkVolumesByDate: async (projectId: string, date?: string): Promise<WorkVolumeEntry[]> => {
    const response = await apiClient.get('/work-volumes/by-date', {
      params: { projectId, date },
    });
    const wrapper = response.data?.data ?? response.data;
    const items: Record<string, unknown>[] = Array.isArray(wrapper) ? wrapper : [];
    return items.map((raw) => ({
      id: String(raw.id ?? ''),
      wbsNodeId: String(raw.wbsNodeId ?? ''),
      date: String(raw.recordDate ?? raw.date ?? ''),
      quantity: Number(raw.quantity) || 0,
      notes: raw.notes ? String(raw.notes) : undefined,
      createdBy: raw.creatorId ? String(raw.creatorId) : undefined,
    }));
  },

  updateWorkVolume: async (entryId: string, data: {
    projectId?: string;
    wbsNodeId?: string;
    recordDate?: string;
    quantity: number;
    unitOfMeasure?: string;
    notes?: string;
  }): Promise<WorkVolumeEntry> => {
    const response = await apiClient.put(`/work-volumes/${entryId}`, data);
    const raw = response.data?.data ?? response.data;
    return { id: String(raw.id ?? ''), wbsNodeId: String(raw.wbsNodeId ?? ''), date: String(raw.recordDate ?? ''), quantity: Number(raw.quantity) || 0, notes: raw.notes ? String(raw.notes) : undefined };
  },

  createWorkVolume: async (data: {
    projectId?: string;
    wbsNodeId: string;
    recordDate?: string;
    quantity: number;
    unitOfMeasure?: string;
    notes?: string;
  }): Promise<WorkVolumeEntry> => {
    const response = await apiClient.post('/work-volumes', data);
    const raw = response.data?.data ?? response.data;
    return { id: String(raw.id ?? ''), wbsNodeId: String(raw.wbsNodeId ?? ''), date: String(raw.recordDate ?? ''), quantity: Number(raw.quantity) || 0, notes: raw.notes ? String(raw.notes) : undefined };
  },

  getCriticalPathTasks: async (projectId: string): Promise<CriticalPathTask[]> => {
    const response = await apiClient.get('/wbs-nodes/critical-path', {
      params: { projectId },
    });
    const raw: Record<string, unknown>[] = response.data?.data ?? response.data ?? [];
    if (raw.length === 0) return [];

    // Backend returns WbsNodeResponse with LocalDate fields — convert to numeric day offsets
    const msPerDay = 86_400_000;
    const dateVal = (d: unknown): number => (d ? new Date(d as string).getTime() : 0);
    const allStarts = raw.map((n) => dateVal(n.earlyStart || n.plannedStartDate)).filter(Boolean);
    const origin = allStarts.length > 0 ? Math.min(...allStarts) : 0;
    const toDays = (d: unknown): number => (d ? Math.round((dateVal(d) - origin) / msPerDay) : 0);

    return raw.map((n) => ({
      id: String(n.id),
      name: String(n.name ?? ''),
      duration: Number(n.duration) || Math.max(1, toDays(n.plannedEndDate) - toDays(n.plannedStartDate)),
      earlyStart: toDays(n.earlyStart || n.plannedStartDate),
      earlyFinish: toDays(n.earlyFinish || n.plannedEndDate),
      lateStart: toDays(n.lateStart || n.plannedStartDate),
      lateFinish: toDays(n.lateFinish || n.plannedEndDate),
      totalFloat: Number(n.totalFloat) || 0,
      isCritical: Boolean(n.isCritical),
      predecessors: Array.isArray(n.predecessors) ? n.predecessors.map(String) : [],
      group: n.nodeTypeDisplayName ? String(n.nodeTypeDisplayName) : undefined,
    }));
  },
};
