// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { changeManagementApi } from './changeManagement';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from './client';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);
const mockPut = vi.mocked(apiClient.put);
const mockDelete = vi.mocked(apiClient.delete);

describe('changeManagementApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('change events', () => {
    it('getChangeEvents calls GET /change-events', async () => {
      const backendEvent = {
        id: 'ce1',
        number: 'CE-001',
        title: 'Scope Change',
        projectId: 'p1',
        status: 'IDENTIFIED',
        source: 'CLIENT',
        estimatedCostImpact: 50000,
        estimatedScheduleImpact: 5,
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-02-01T00:00:00Z',
      };
      mockGet.mockResolvedValue({ data: { content: [backendEvent], totalElements: 1 } } as never);

      const result = await changeManagementApi.getChangeEvents();
      expect(mockGet).toHaveBeenCalledWith('/change-events', { params: undefined });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].id).toBe('ce1');
    });

    it('getChangeEvents passes filter params', async () => {
      const params = { status: 'APPROVED' as never, projectId: 'p1', page: 0, size: 20 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await changeManagementApi.getChangeEvents(params);
      expect(mockGet).toHaveBeenCalledWith('/change-events', { params });
    });

    it('getChangeEvent calls GET /change-events/:id', async () => {
      const backendEvent = {
        id: 'ce1', number: 'CE-001', title: 'Test', projectId: 'p1',
        createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z',
      };
      mockGet.mockResolvedValue({ data: backendEvent } as never);

      const result = await changeManagementApi.getChangeEvent('ce1');
      expect(mockGet).toHaveBeenCalledWith('/change-events/ce1');
      expect(result.id).toBe('ce1');
    });

    it('createChangeEvent calls POST /change-events', async () => {
      const data = {
        projectId: 'p1',
        title: 'New Change',
        description: 'Description',
        source: 'DESIGN' as never,
      };
      const backendResp = {
        id: 'ce2', number: 'CE-002', title: 'New Change', projectId: 'p1',
        source: 'DESIGN', estimatedCostImpact: 10000, estimatedScheduleImpact: 3,
        createdAt: '2026-02-21T00:00:00Z', updatedAt: '2026-02-21T00:00:00Z',
      };
      mockPost.mockResolvedValue({ data: backendResp } as never);

      const result = await changeManagementApi.createChangeEvent(data);
      expect(mockPost).toHaveBeenCalledWith('/change-events', data);
      expect(result.id).toBe('ce2');
    });
  });

  describe('change orders', () => {
    it('getChangeOrders calls GET /change-orders', async () => {
      const backendOrder = {
        id: 'co1',
        number: 'CO-001',
        title: 'Additional Works',
        projectId: 'p1',
        changeOrderType: 'ADDITION',
        status: 'DRAFT',
        totalAmount: 100000,
        originalContractAmount: 5000000,
        revisedContractAmount: 5100000,
        scheduleImpactDays: 10,
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-02-01T00:00:00Z',
      };
      mockGet.mockResolvedValue({ data: { content: [backendOrder], totalElements: 1 } } as never);

      const result = await changeManagementApi.getChangeOrders();
      expect(mockGet).toHaveBeenCalledWith('/change-orders', { params: undefined });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].id).toBe('co1');
    });

    it('getChangeOrder calls GET /change-orders/:id', async () => {
      const backendOrder = {
        id: 'co1', number: 'CO-001', title: 'Test', projectId: 'p1',
        createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z',
      };
      mockGet.mockResolvedValue({ data: backendOrder } as never);

      const result = await changeManagementApi.getChangeOrder('co1');
      expect(mockGet).toHaveBeenCalledWith('/change-orders/co1');
      expect(result.id).toBe('co1');
    });

    it('createChangeOrder calls POST /change-orders', async () => {
      const data = {
        projectId: 'p1',
        title: 'New CO',
      };
      const backendResp = {
        id: 'co2', number: 'CO-002', title: 'New CO', projectId: 'p1',
        changeOrderType: 'DEDUCTION', status: 'DRAFT',
        createdAt: '2026-02-21T00:00:00Z', updatedAt: '2026-02-21T00:00:00Z',
      };
      mockPost.mockResolvedValue({ data: backendResp } as never);

      const result = await changeManagementApi.createChangeOrder(data);
      expect(mockPost).toHaveBeenCalledWith('/change-orders', data);
      expect(result.id).toBe('co2');
    });

    it('updateChangeOrder calls PUT /change-orders/:id', async () => {
      const data = { title: 'Updated CO' };
      const backendResp = {
        id: 'co1', number: 'CO-001', title: 'Updated CO', projectId: 'p1',
        createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-21T00:00:00Z',
      };
      mockPut.mockResolvedValue({ data: backendResp } as never);

      const result = await changeManagementApi.updateChangeOrder('co1', data);
      expect(mockPut).toHaveBeenCalledWith('/change-orders/co1', data);
      expect(result.title).toBe('Updated CO');
    });

    it('getChangeOrderLineItems calls GET /change-orders/:id/line-items', async () => {
      const items = [{ id: 'li1', description: 'Extra concrete' }];
      mockGet.mockResolvedValue({ data: items } as never);

      const result = await changeManagementApi.getChangeOrderLineItems('co1');
      expect(mockGet).toHaveBeenCalledWith('/change-orders/co1/line-items');
      expect(result).toEqual(items);
    });

    it('deleteChangeOrder calls DELETE /change-orders/:id', async () => {
      mockDelete.mockResolvedValue({} as never);

      await changeManagementApi.deleteChangeOrder('co1');
      expect(mockDelete).toHaveBeenCalledWith('/change-orders/co1');
    });
  });

  describe('error propagation', () => {
    it('propagates API errors from get requests', async () => {
      const error = new Error('Network Error');
      mockGet.mockRejectedValue(error);

      await expect(changeManagementApi.getChangeEvents()).rejects.toThrow('Network Error');
    });

    it('propagates API errors from post requests', async () => {
      const error = new Error('Validation Error');
      mockPost.mockRejectedValue(error);

      await expect(
        changeManagementApi.createChangeEvent({ projectId: 'p1', title: '' } as never),
      ).rejects.toThrow('Validation Error');
    });
  });
});
