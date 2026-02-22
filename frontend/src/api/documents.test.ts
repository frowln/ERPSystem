// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { documentsApi } from './documents';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import { apiClient } from './client';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);
const mockPut = vi.mocked(apiClient.put);

describe('documentsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDocuments', () => {
    it('calls GET /documents without params', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const result = await documentsApi.getDocuments();
      expect(mockGet).toHaveBeenCalledWith('/documents', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('passes filter params to GET /documents', async () => {
      const params = { category: 'CONTRACT', status: 'ACTIVE', search: 'test', page: 0, size: 20 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await documentsApi.getDocuments(params);
      expect(mockGet).toHaveBeenCalledWith('/documents', { params });
    });

    it('passes projectId filter', async () => {
      const params = { projectId: 'p1' };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await documentsApi.getDocuments(params);
      expect(mockGet).toHaveBeenCalledWith('/documents', { params });
    });

    it('passes contractId filter', async () => {
      const params = { contractId: 'c1' };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await documentsApi.getDocuments(params);
      expect(mockGet).toHaveBeenCalledWith('/documents', { params });
    });
  });

  describe('getDocument', () => {
    it('calls GET /documents/:id', async () => {
      const mockDoc = { id: 'doc1', title: 'Contract A', category: 'CONTRACT' };
      mockGet.mockResolvedValue({ data: mockDoc } as never);

      const result = await documentsApi.getDocument('doc1');
      expect(mockGet).toHaveBeenCalledWith('/documents/doc1');
      expect(result).toEqual(mockDoc);
    });
  });

  describe('createDocument', () => {
    it('calls POST /documents with data', async () => {
      const data = {
        title: 'New Document',
        documentNumber: 'DOC-001',
        category: 'REPORT',
        projectId: 'p1',
        description: 'Test description',
      };
      const created = { id: 'doc2', ...data };
      mockPost.mockResolvedValue({ data: created } as never);

      const result = await documentsApi.createDocument(data);
      expect(mockPost).toHaveBeenCalledWith('/documents', data);
      expect(result).toEqual(created);
    });

    it('creates document with file metadata', async () => {
      const data = {
        title: 'Blueprint',
        fileName: 'blueprint.pdf',
        fileSize: 2048000,
        mimeType: 'application/pdf',
        storagePath: '/uploads/blueprint.pdf',
      };
      const created = { id: 'doc3', ...data };
      mockPost.mockResolvedValue({ data: created } as never);

      const result = await documentsApi.createDocument(data);
      expect(mockPost).toHaveBeenCalledWith('/documents', data);
      expect(result.fileName).toBe('blueprint.pdf');
    });
  });

  describe('updateDocument', () => {
    it('calls PUT /documents/:id with data', async () => {
      const data = { title: 'Updated Document', description: 'Updated description' };
      const updated = { id: 'doc1', ...data };
      mockPut.mockResolvedValue({ data: updated } as never);

      const result = await documentsApi.updateDocument('doc1', data);
      expect(mockPut).toHaveBeenCalledWith('/documents/doc1', data);
      expect(result).toEqual(updated);
    });
  });

  describe('error propagation', () => {
    it('propagates API errors from get requests', async () => {
      const error = new Error('Not Found');
      mockGet.mockRejectedValue(error);

      await expect(documentsApi.getDocument('invalid')).rejects.toThrow('Not Found');
    });

    it('propagates API errors from post requests', async () => {
      const error = new Error('Validation Error');
      mockPost.mockRejectedValue(error);

      await expect(documentsApi.createDocument({ title: '' })).rejects.toThrow('Validation Error');
    });
  });
});
