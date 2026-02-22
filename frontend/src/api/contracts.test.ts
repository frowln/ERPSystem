// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contractsApi } from './contracts';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

import { apiClient } from './client';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);
const mockPut = vi.mocked(apiClient.put);
const mockPatch = vi.mocked(apiClient.patch);

describe('contractsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getContracts', () => {
    it('calls GET /contracts without params', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const result = await contractsApi.getContracts();
      expect(mockGet).toHaveBeenCalledWith('/contracts', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('passes filter params to GET /contracts', async () => {
      const params = { status: 'ACTIVE' as const, projectId: 'p1', search: 'test', page: 0, size: 20 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await contractsApi.getContracts(params);
      expect(mockGet).toHaveBeenCalledWith('/contracts', { params });
    });
  });

  describe('getContract', () => {
    it('calls GET /contracts/:id', async () => {
      const contract = { id: 'c1', name: 'General Contract', status: 'ACTIVE' };
      mockGet.mockResolvedValue({ data: contract } as never);

      const result = await contractsApi.getContract('c1');
      expect(mockGet).toHaveBeenCalledWith('/contracts/c1');
      expect(result).toEqual(contract);
    });
  });

  describe('createContract', () => {
    it('calls POST /contracts with data', async () => {
      const data = { name: 'New Contract', number: 'CNT-001', amount: 500000 };
      const created = { id: 'c2', ...data };
      mockPost.mockResolvedValue({ data: created } as never);

      const result = await contractsApi.createContract(data);
      expect(mockPost).toHaveBeenCalledWith('/contracts', data);
      expect(result).toEqual(created);
    });
  });

  describe('updateContract', () => {
    it('calls PUT /contracts/:id with data', async () => {
      const data = { name: 'Updated Contract', amount: 600000 };
      const updated = { id: 'c1', ...data };
      mockPut.mockResolvedValue({ data: updated } as never);

      const result = await contractsApi.updateContract('c1', data);
      expect(mockPut).toHaveBeenCalledWith('/contracts/c1', data);
      expect(result).toEqual(updated);
    });
  });

  describe('changeContractStatus', () => {
    it('calls PATCH /contracts/:id/status with status', async () => {
      const updated = { id: 'c1', status: 'SIGNED' };
      mockPatch.mockResolvedValue({ data: updated } as never);

      const result = await contractsApi.changeContractStatus('c1', 'SIGNED' as never);
      expect(mockPatch).toHaveBeenCalledWith('/contracts/c1/status', { status: 'SIGNED' });
      expect(result).toEqual(updated);
    });
  });

  describe('getContractApprovals', () => {
    it('calls GET /contracts/:id/approvals', async () => {
      const approvals = [{ id: 'a1', approverName: 'Admin', status: 'APPROVED' }];
      mockGet.mockResolvedValue({ data: approvals } as never);

      const result = await contractsApi.getContractApprovals('c1');
      expect(mockGet).toHaveBeenCalledWith('/contracts/c1/approvals');
      expect(result).toEqual(approvals);
    });
  });

  describe('getContractDashboard', () => {
    it('calls GET /contracts/dashboard without projectId', async () => {
      const dashboard = { totalContracts: 10, activeContracts: 5, totalAmount: 1000000, totalPaid: 500000, totalBalance: 500000, byStatus: [] };
      mockGet.mockResolvedValue({ data: dashboard } as never);

      const result = await contractsApi.getContractDashboard();
      expect(mockGet).toHaveBeenCalledWith('/contracts/dashboard', { params: undefined });
      expect(result.totalContracts).toBe(10);
    });

    it('calls GET /contracts/dashboard with projectId', async () => {
      mockGet.mockResolvedValue({ data: { totalContracts: 3 } } as never);

      await contractsApi.getContractDashboard('p1');
      expect(mockGet).toHaveBeenCalledWith('/contracts/dashboard', { params: { projectId: 'p1' } });
    });
  });

  describe('error propagation', () => {
    it('propagates API errors from get requests', async () => {
      const error = new Error('Unauthorized');
      mockGet.mockRejectedValue(error);

      await expect(contractsApi.getContracts()).rejects.toThrow('Unauthorized');
    });

    it('propagates API errors from post requests', async () => {
      const error = new Error('Bad Request');
      mockPost.mockRejectedValue(error);

      await expect(contractsApi.createContract({})).rejects.toThrow('Bad Request');
    });
  });
});
