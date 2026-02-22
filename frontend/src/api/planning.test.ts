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
    it('calls GET /wbs-nodes/tree without projectId', async () => {
      const tree = [{ id: 'n1', name: 'Phase 1', children: [] }];
      mockGet.mockResolvedValue({ data: tree } as never);

      const result = await planningApi.getWbsTree();
      expect(mockGet).toHaveBeenCalledWith('/wbs-nodes/tree', { params: undefined });
      expect(result).toEqual(tree);
    });

    it('calls GET /wbs-nodes/tree with projectId', async () => {
      const tree = [{ id: 'n1', name: 'Phase 1' }];
      mockGet.mockResolvedValue({ data: tree } as never);

      await planningApi.getWbsTree('p1');
      expect(mockGet).toHaveBeenCalledWith('/wbs-nodes/tree', { params: { projectId: 'p1' } });
    });
  });

  describe('getWbsNode', () => {
    it('calls GET /wbs-nodes/:id', async () => {
      const node = { id: 'n1', name: 'Phase 1', wbsCode: '1.0' };
      mockGet.mockResolvedValue({ data: node } as never);

      const result = await planningApi.getWbsNode('n1');
      expect(mockGet).toHaveBeenCalledWith('/wbs-nodes/n1');
      expect(result).toEqual(node);
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
    it('calls GET /evm-snapshots/latest with projectId', async () => {
      const metrics = { pv: 1000, ev: 800, ac: 900, spi: 0.88, cpi: 0.89 };
      mockGet.mockResolvedValue({ data: metrics } as never);

      const result = await planningApi.getEvmMetrics('p1');
      expect(mockGet).toHaveBeenCalledWith('/evm-snapshots/latest', { params: { projectId: 'p1' } });
      expect(result.spi).toBe(0.88);
    });
  });

  describe('getResourceAllocations', () => {
    it('calls GET /resource-allocations with params', async () => {
      const allocations = [{ id: 'ra1', resourceName: 'Crew A' }];
      mockGet.mockResolvedValue({ data: allocations } as never);

      const params = { projectId: 'p1', resourceType: 'LABOR' };
      const result = await planningApi.getResourceAllocations(params);
      expect(mockGet).toHaveBeenCalledWith('/resource-allocations', { params });
      expect(result).toEqual(allocations);
    });
  });

  describe('getGanttData', () => {
    it('calls GET /wbs-nodes/tree for gantt data', async () => {
      const nodes = [{ id: 'n1', name: 'Task 1' }];
      mockGet.mockResolvedValue({ data: nodes } as never);

      await planningApi.getGanttData('p1');
      expect(mockGet).toHaveBeenCalledWith('/wbs-nodes/tree', { params: { projectId: 'p1' } });
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
