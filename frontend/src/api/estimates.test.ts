// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { estimatesApi } from './estimates';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from './client';

const mockGet = vi.mocked(apiClient.get);

describe('estimatesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEstimates', () => {
    it('calls GET /estimates without params', async () => {
      const backendEstimate = {
        id: 'e1',
        name: 'Estimate A',
        projectId: 'p1',
        specificationId: 's1',
        status: 'DRAFT',
        totalAmount: 500000,
        createdAt: '2026-01-01T00:00:00Z',
      };
      mockGet.mockResolvedValue({ data: { content: [backendEstimate], totalElements: 1 } } as never);

      const result = await estimatesApi.getEstimates();
      expect(mockGet).toHaveBeenCalledWith('/estimates', { params: undefined });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].totalAmount).toBe(500000);
    });

    it('passes filter params', async () => {
      const params = { status: 'APPROVED' as const, projectId: 'p1', page: 0, size: 20 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await estimatesApi.getEstimates(params);
      expect(mockGet).toHaveBeenCalledWith('/estimates', { params });
    });
  });

  describe('getEstimate', () => {
    it('calls GET /estimates/:id', async () => {
      const backendEstimate = {
        id: 'e1', name: 'Estimate A', projectId: 'p1', specificationId: 's1',
        status: 'APPROVED', totalAmount: 1000000, createdAt: '2026-01-01T00:00:00Z',
      };
      mockGet.mockResolvedValue({ data: backendEstimate } as never);

      const result = await estimatesApi.getEstimate('e1');
      expect(mockGet).toHaveBeenCalledWith('/estimates/e1');
      expect(result.name).toBe('Estimate A');
    });
  });

  describe('getEstimateItems', () => {
    it('calls GET /estimates/:id/items', async () => {
      const items = [{
        id: 'i1', estimateId: 'e1', name: 'Concrete', quantity: 100,
        unitOfMeasure: 'm3', unitPrice: 5000, amount: 500000,
        orderedAmount: 200000, invoicedAmount: 100000, deliveredAmount: 80000,
      }];
      mockGet.mockResolvedValue({ data: items } as never);

      const result = await estimatesApi.getEstimateItems('e1');
      expect(mockGet).toHaveBeenCalledWith('/estimates/e1/items');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Concrete');
      expect(result[0].orderedAmount).toBe(200000);
    });
  });

  describe('getEstimateFinancialSummary', () => {
    it('calls GET /estimates/:id/financial-summary', async () => {
      const summary = { totalPlanned: 1000000, totalOrdered: 500000, totalInvoiced: 300000, totalSpent: 200000, balance: 800000, executionPercent: 20 };
      mockGet.mockResolvedValue({ data: summary } as never);

      const result = await estimatesApi.getEstimateFinancialSummary('e1');
      expect(mockGet).toHaveBeenCalledWith('/estimates/e1/financial-summary');
      expect(result.executionPercent).toBe(20);
    });
  });

  describe('error propagation', () => {
    it('propagates API errors', async () => {
      const error = new Error('Not Found');
      mockGet.mockRejectedValue(error);

      await expect(estimatesApi.getEstimate('invalid')).rejects.toThrow('Not Found');
    });
  });
});
