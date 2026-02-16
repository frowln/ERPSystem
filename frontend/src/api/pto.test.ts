// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ptoApi } from './pto';

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

describe('ptoApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // PTO Documents
  describe('getDocuments', () => {
    it('calls GET /pto/documents without params', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const result = await ptoApi.getDocuments();
      expect(mockGet).toHaveBeenCalledWith('/pto/documents', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('passes filter params', async () => {
      const params = { type: 'AKT_OV' as const, status: 'DRAFT' as const, page: 0, size: 20 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await ptoApi.getDocuments(params);
      expect(mockGet).toHaveBeenCalledWith('/pto/documents', { params });
    });
  });

  describe('getDocument', () => {
    it('calls GET /pto/documents/:id', async () => {
      const doc = { id: 'd1', number: 'PTO-001', title: 'Act' };
      mockGet.mockResolvedValue({ data: doc } as never);

      const result = await ptoApi.getDocument('d1');
      expect(mockGet).toHaveBeenCalledWith('/pto/documents/d1');
      expect(result).toEqual(doc);
    });
  });

  describe('createDocument', () => {
    it('calls POST /pto/documents with data', async () => {
      const data = { title: 'New Doc', type: 'PROTOCOL' };
      const created = { id: 'd2', ...data };
      mockPost.mockResolvedValue({ data: created } as never);

      const result = await ptoApi.createDocument(data as never);
      expect(mockPost).toHaveBeenCalledWith('/pto/documents', data);
      expect(result).toEqual(created);
    });
  });

  describe('updateDocument', () => {
    it('calls PUT /pto/documents/:id with data', async () => {
      const data = { title: 'Updated' };
      const updated = { id: 'd1', title: 'Updated' };
      mockPut.mockResolvedValue({ data: updated } as never);

      const result = await ptoApi.updateDocument('d1', data as never);
      expect(mockPut).toHaveBeenCalledWith('/pto/documents/d1', data);
      expect(result).toEqual(updated);
    });
  });

  describe('deleteDocument', () => {
    it('calls DELETE /pto/documents/:id', async () => {
      mockDelete.mockResolvedValue({} as never);

      await ptoApi.deleteDocument('d1');
      expect(mockDelete).toHaveBeenCalledWith('/pto/documents/d1');
    });
  });

  describe('submitDocument', () => {
    it('calls POST /pto/documents/:id/submit', async () => {
      const doc = { id: 'd1', status: 'IN_REVIEW' };
      mockPost.mockResolvedValue({ data: doc } as never);

      const result = await ptoApi.submitDocument('d1');
      expect(mockPost).toHaveBeenCalledWith('/pto/documents/d1/submit');
      expect(result).toEqual(doc);
    });
  });

  describe('rejectDocument', () => {
    it('calls POST /pto/documents/:id/reject with reason', async () => {
      const doc = { id: 'd1', status: 'REJECTED' };
      mockPost.mockResolvedValue({ data: doc } as never);

      const result = await ptoApi.rejectDocument('d1', 'Incomplete data');
      expect(mockPost).toHaveBeenCalledWith('/pto/documents/d1/reject', { reason: 'Incomplete data' });
      expect(result).toEqual(doc);
    });
  });

  // Work Permits
  describe('getWorkPermits', () => {
    it('calls GET /pto/work-permits with params', async () => {
      const params = { type: 'HOT_WORK' as const, page: 0, size: 10 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await ptoApi.getWorkPermits(params);
      expect(mockGet).toHaveBeenCalledWith('/pto/work-permits', { params });
    });
  });

  describe('createWorkPermit', () => {
    it('calls POST /pto/work-permits with data', async () => {
      const data = { type: 'CRANE', location: 'Zone A' };
      const created = { id: 'wp1', ...data };
      mockPost.mockResolvedValue({ data: created } as never);

      const result = await ptoApi.createWorkPermit(data as never);
      expect(mockPost).toHaveBeenCalledWith('/pto/work-permits', data);
      expect(result).toEqual(created);
    });
  });

  describe('suspendWorkPermit', () => {
    it('calls POST /pto/work-permits/:id/suspend with reason', async () => {
      const permit = { id: 'wp1', status: 'SUSPENDED' };
      mockPost.mockResolvedValue({ data: permit } as never);

      const result = await ptoApi.suspendWorkPermit('wp1', 'Safety concern');
      expect(mockPost).toHaveBeenCalledWith('/pto/work-permits/wp1/suspend', { reason: 'Safety concern' });
      expect(result).toEqual(permit);
    });
  });

  // Lab Tests
  describe('getLabTests', () => {
    it('calls GET /pto/lab-tests with params', async () => {
      const params = { status: 'PENDING' as const, page: 0, size: 20 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await ptoApi.getLabTests(params);
      expect(mockGet).toHaveBeenCalledWith('/pto/lab-tests', { params });
    });
  });

  describe('submitLabTestResult', () => {
    it('calls POST /pto/lab-tests/:id/result with result and comment', async () => {
      const labTest = { id: 'lt1', result: 'PASSED' };
      mockPost.mockResolvedValue({ data: labTest } as never);

      const result = await ptoApi.submitLabTestResult('lt1', 'PASSED', 'All good');
      expect(mockPost).toHaveBeenCalledWith('/pto/lab-tests/lt1/result', { result: 'PASSED', comment: 'All good' });
      expect(result).toEqual(labTest);
    });
  });

  describe('error propagation', () => {
    it('propagates API errors from get requests', async () => {
      const error = new Error('Network Error');
      mockGet.mockRejectedValue(error);

      await expect(ptoApi.getDocuments()).rejects.toThrow('Network Error');
    });

    it('propagates API errors from delete requests', async () => {
      const error = new Error('Forbidden');
      mockDelete.mockRejectedValue(error);

      await expect(ptoApi.deleteDocument('d1')).rejects.toThrow('Forbidden');
    });
  });
});
