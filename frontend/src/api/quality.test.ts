// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { qualityApi } from './quality';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from './client';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);
const mockPut = vi.mocked(apiClient.put);
const mockDelete = vi.mocked(apiClient.delete);

describe('qualityApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getChecks', () => {
    it('calls GET /quality/checks without params', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const result = await qualityApi.getChecks();
      expect(mockGet).toHaveBeenCalledWith('/quality/checks', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('passes filter params to GET /quality/checks', async () => {
      const params = { type: 'INCOMING' as const, status: 'PLANNED' as const, page: 0, size: 20 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await qualityApi.getChecks(params);
      expect(mockGet).toHaveBeenCalledWith('/quality/checks', { params });
    });
  });

  describe('getCheck', () => {
    it('calls GET /quality/checks/:id', async () => {
      const check = { id: 'qc1', number: 'QC-001', name: 'Concrete test' };
      mockGet.mockResolvedValue({ data: check } as never);

      const result = await qualityApi.getCheck('qc1');
      expect(mockGet).toHaveBeenCalledWith('/quality/checks/qc1');
      expect(result).toEqual(check);
    });
  });

  describe('createCheck', () => {
    it('calls POST /quality/checks with data', async () => {
      const data = { name: 'New Check', type: 'FINAL', projectId: 'p1' };
      const created = { id: 'qc2', ...data };
      mockPost.mockResolvedValue({ data: created } as never);

      const result = await qualityApi.createCheck(data as never);
      expect(mockPost).toHaveBeenCalledWith('/quality/checks', data);
      expect(result).toEqual(created);
    });
  });

  describe('updateCheck', () => {
    it('calls PUT /quality/checks/:id with data', async () => {
      const data = { name: 'Updated Check', result: 'PASSED' };
      const updated = { id: 'qc1', ...data };
      mockPut.mockResolvedValue({ data: updated } as never);

      const result = await qualityApi.updateCheck('qc1', data as never);
      expect(mockPut).toHaveBeenCalledWith('/quality/checks/qc1', data);
      expect(result).toEqual(updated);
    });
  });

  describe('getNonConformances', () => {
    it('calls GET /quality/non-conformances without params', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const result = await qualityApi.getNonConformances();
      expect(mockGet).toHaveBeenCalledWith('/quality/non-conformances', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('passes pagination params', async () => {
      const params = { page: 1, size: 10 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await qualityApi.getNonConformances(params);
      expect(mockGet).toHaveBeenCalledWith('/quality/non-conformances', { params });
    });
  });

  describe('createNonConformance', () => {
    it('calls POST /quality/non-conformances with data', async () => {
      const data = { description: 'Crack found', severity: 'MAJOR', qualityCheckId: 'qc1' };
      const created = { id: 'nc1', ...data };
      mockPost.mockResolvedValue({ data: created } as never);

      const result = await qualityApi.createNonConformance(data as never);
      expect(mockPost).toHaveBeenCalledWith('/quality/non-conformances', data);
      expect(result).toEqual(created);
    });
  });

  describe('deleteCheck', () => {
    it('calls DELETE /quality/checks/:id', async () => {
      mockDelete.mockResolvedValue({} as never);

      await qualityApi.deleteCheck('qc1');
      expect(mockDelete).toHaveBeenCalledWith('/quality/checks/qc1');
    });
  });

  describe('error propagation', () => {
    it('propagates API errors from get requests', async () => {
      const error = new Error('Not Found');
      mockGet.mockRejectedValue(error);

      await expect(qualityApi.getChecks()).rejects.toThrow('Not Found');
    });

    it('propagates API errors from post requests', async () => {
      const error = new Error('Validation Error');
      mockPost.mockRejectedValue(error);

      await expect(qualityApi.createCheck({} as never)).rejects.toThrow('Validation Error');
    });

    it('propagates API errors from delete requests', async () => {
      const error = new Error('Forbidden');
      mockDelete.mockRejectedValue(error);

      await expect(qualityApi.deleteCheck('qc1')).rejects.toThrow('Forbidden');
    });
  });
});
