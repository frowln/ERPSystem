// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { closingApi } from './closing';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from './client';

const mockGet = vi.mocked(apiClient.get);

describe('closingApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('KS-2', () => {
    it('getKs2Documents calls GET /closing/ks2 without params', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const result = await closingApi.getKs2Documents();
      expect(mockGet).toHaveBeenCalledWith('/closing/ks2', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('getKs2Documents passes filter params', async () => {
      const params = { status: 'DRAFT' as const, projectId: 'p1', page: 0, size: 20 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await closingApi.getKs2Documents(params);
      expect(mockGet).toHaveBeenCalledWith('/closing/ks2', { params });
    });

    it('getKs2 calls GET /closing/ks2/:id', async () => {
      const doc = { id: 'k1', number: 'KS2-001', name: 'Works Act' };
      mockGet.mockResolvedValue({ data: doc } as never);

      const result = await closingApi.getKs2('k1');
      expect(mockGet).toHaveBeenCalledWith('/closing/ks2/k1');
      expect(result).toEqual(doc);
    });
  });

  describe('KS-3', () => {
    it('getKs3Documents calls GET /closing/ks3', async () => {
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      const result = await closingApi.getKs3Documents();
      expect(mockGet).toHaveBeenCalledWith('/closing/ks3', { params: undefined });
      expect(result.content).toEqual([]);
    });

    it('getKs3 calls GET /closing/ks3/:id', async () => {
      const doc = { id: 'ks3-1', number: 'KS3-001', name: 'Summary Act' };
      mockGet.mockResolvedValue({ data: doc } as never);

      const result = await closingApi.getKs3('ks3-1');
      expect(mockGet).toHaveBeenCalledWith('/closing/ks3/ks3-1');
      expect(result).toEqual(doc);
    });
  });

  describe('error propagation', () => {
    it('propagates API errors', async () => {
      const error = new Error('Server Error');
      mockGet.mockRejectedValue(error);

      await expect(closingApi.getKs2Documents()).rejects.toThrow('Server Error');
    });
  });
});
