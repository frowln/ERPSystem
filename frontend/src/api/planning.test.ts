// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { planningApi } from './planning';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from './client';

const mockGet = vi.mocked(apiClient.get);

describe('planningApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWbsTree', () => {
    it('calls GET /wbs-nodes without projectId and builds tree', async () => {
      const flat = [{ id: 'n1', name: 'Phase 1', parentId: null }];
      mockGet.mockResolvedValue({ data: { content: flat } } as never);

      const result = await planningApi.getWbsTree();
      expect(mockGet).toHaveBeenCalledWith('/wbs-nodes', {
        params: { projectId: undefined, page: 0, size: 500, sort: 'sortOrder,asc' },
      });
      expect(result[0].name).toBe('Phase 1');
    });

    it('calls GET /wbs-nodes with projectId', async () => {
      const flat = [{ id: 'n1', name: 'Phase 1', parentId: null }];
      mockGet.mockResolvedValue({ data: { content: flat } } as never);

      await planningApi.getWbsTree('p1');
      expect(mockGet).toHaveBeenCalledWith('/wbs-nodes', {
        params: { projectId: 'p1', page: 0, size: 500, sort: 'sortOrder,asc' },
      });
    });
  });

  describe('getWbsNode', () => {
    it('calls GET /wbs-nodes/:id and normalizes isCritical', async () => {
      const node = { id: 'n1', name: 'Phase 1', isCritical: true };
      mockGet.mockResolvedValue({ data: node } as never);

      const result = await planningApi.getWbsNode('n1');
      expect(mockGet).toHaveBeenCalledWith('/wbs-nodes/n1');
      expect(result.isCriticalPath).toBe(true);
    });
  });

  describe('getBaselines', () => {
    it('calls GET /schedule-baselines without projectId', async () => {
      const baselines = [{ id: 'b1', name: 'Baseline 1', version: 1 }];
      mockGet.mockResolvedValue({ data: baselines } as never);

      const result = await planningApi.getBaselines();
      expect(mockGet).toHaveBeenCalledWith('/schedule-baselines', { params: undefined });
      expect(result).toEqual(baselines);
    });

    it('calls GET /schedule-baselines with projectId', async () => {
      mockGet.mockResolvedValue({ data: [] } as never);

      await planningApi.getBaselines('p1');
      expect(mockGet).toHaveBeenCalledWith('/schedule-baselines', { params: { projectId: 'p1' } });
    });
  });

  describe('getEvmMetrics', () => {
    it('calls GET /evm-snapshots/latest and normalizes backend fields', async () => {
      const snapshot = {
        budgetAtCompletion: 100000,
        plannedValue: 50000,
        earnedValue: 45000,
        actualCost: 48000,
        spi: 0.9,
        cpi: 0.94,
        eac: 106000,
        etcValue: 58000,
        tcpi: 1.05,
        percentComplete: 45,
        snapshotDate: '2026-03-01',
      };
      mockGet.mockResolvedValue({ data: snapshot } as never);

      const result = await planningApi.getEvmMetrics('p1');
      expect(mockGet).toHaveBeenCalledWith('/evm-snapshots/latest', { params: { projectId: 'p1' } });
      expect(result.bac).toBe(100000);
      expect(result.pv).toBe(50000);
      expect(result.ev).toBe(45000);
      expect(result.ac).toBe(48000);
      expect(result.sv).toBe(-5000); // ev - pv
      expect(result.cv).toBe(-3000); // ev - ac
      expect(result.spi).toBe(0.9);
      expect(result.cpi).toBe(0.94);
    });

    it('returns defaults for null response', async () => {
      mockGet.mockResolvedValue({ data: null } as never);
      const result = await planningApi.getEvmMetrics('p1');
      expect(result.bac).toBe(0);
      expect(result.spi).toBe(1);
    });
  });

  describe('getResourceAllocations', () => {
    it('calls GET /resource-allocations and normalizes backend fields', async () => {
      const backendData = [{ id: 'ra1', resourceName: 'Crew A', resourceType: 'LABOR', plannedUnits: 100, actualUnits: 80, unitRate: 2500, plannedCost: 250000, actualCost: 200000, startDate: '2026-01-01' }];
      mockGet.mockResolvedValue({ data: backendData } as never);

      const params = { projectId: 'p1', resourceType: 'LABOR' };
      const result = await planningApi.getResourceAllocations(params);
      expect(mockGet).toHaveBeenCalledWith('/resource-allocations', { params });
      expect(result[0].id).toBe('ra1');
      expect(result[0].resourceName).toBe('Crew A');
      expect(result[0].resourceType).toBe('LABOR');
      expect(result[0].plannedHours).toBe(100);
      expect(result[0].actualHours).toBe(80);
      expect(result[0].utilization).toBe(80); // 80/100 * 100
      expect(result[0].plannedCost).toBe(250000);
    });
  });

  describe('getGanttData', () => {
    it('calls GET /wbs-nodes and builds tree for gantt', async () => {
      const flat = [
        { id: 'n1', name: 'Root', parentId: null },
        { id: 'n2', name: 'Child', parentId: 'n1' },
      ];
      mockGet.mockResolvedValue({ data: { content: flat } } as never);

      const result = await planningApi.getGanttData('p1');
      expect(mockGet).toHaveBeenCalledWith('/wbs-nodes', {
        params: { projectId: 'p1', page: 0, size: 500, sort: 'sortOrder,asc' },
      });
      expect(result).toHaveLength(1); // Only root
      expect(result[0].children).toHaveLength(1); // Child linked
      expect(result[0].children![0].name).toBe('Child');
    });
  });

  describe('getCriticalPathTasks', () => {
    it('calls GET /wbs-nodes/critical-path and maps to CriticalPathTask', async () => {
      const nodes = [
        { id: 't1', name: 'Task 1', isCritical: true, duration: 10, plannedStartDate: '2026-01-01', plannedEndDate: '2026-01-11', earlyStart: '2026-01-01', earlyFinish: '2026-01-11', lateStart: '2026-01-01', lateFinish: '2026-01-11', totalFloat: 0, nodeTypeDisplayName: 'Работа' },
      ];
      mockGet.mockResolvedValue({ data: nodes } as never);

      const result = await planningApi.getCriticalPathTasks('p1');
      expect(mockGet).toHaveBeenCalledWith('/wbs-nodes/critical-path', {
        params: { projectId: 'p1' },
      });
      expect(result[0].id).toBe('t1');
      expect(result[0].isCritical).toBe(true);
      expect(result[0].duration).toBe(10);
      expect(result[0].earlyStart).toBe(0); // origin is this node's own earlyStart
    });
  });

  describe('error propagation', () => {
    it('propagates API errors', async () => {
      const error = new Error('Service Unavailable');
      mockGet.mockRejectedValue(error);

      await expect(planningApi.getWbsTree()).rejects.toThrow('Service Unavailable');
    });
  });
});
