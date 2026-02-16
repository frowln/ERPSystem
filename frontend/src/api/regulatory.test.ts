// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { regulatoryApi } from './regulatory';

// Mock the apiClient
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

describe('regulatoryApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Permits ---

  describe('getPermits', () => {
    it('calls GET /regulatory/permits without params', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await regulatoryApi.getPermits();
      expect(mockGet).toHaveBeenCalledWith('/regulatory/permits', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('passes filter params to permits endpoint', async () => {
      const params = { permitType: 'BUILDING_PERMIT' as const, status: 'ACTIVE' as const, projectId: 'p1' };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } });

      await regulatoryApi.getPermits(params);
      expect(mockGet).toHaveBeenCalledWith('/regulatory/permits', { params });
    });
  });

  describe('getPermit', () => {
    it('calls GET /regulatory/permits/:id', async () => {
      const mockPermit = { id: 'perm1', name: 'Building Permit' };
      mockGet.mockResolvedValue({ data: mockPermit });

      const result = await regulatoryApi.getPermit('perm1');
      expect(mockGet).toHaveBeenCalledWith('/regulatory/permits/perm1');
      expect(result).toEqual(mockPermit);
    });
  });

  describe('createPermit', () => {
    it('calls POST /regulatory/permits', async () => {
      const data = { name: 'New Permit' } as never;
      const created = { id: 'perm2', name: 'New Permit' };
      mockPost.mockResolvedValue({ data: created });

      const result = await regulatoryApi.createPermit(data);
      expect(mockPost).toHaveBeenCalledWith('/regulatory/permits', data);
      expect(result).toEqual(created);
    });
  });

  describe('updatePermit', () => {
    it('calls PUT /regulatory/permits/:id', async () => {
      const data = { name: 'Updated Permit' };
      const updated = { id: 'perm1', name: 'Updated Permit' };
      mockPut.mockResolvedValue({ data: updated });

      const result = await regulatoryApi.updatePermit('perm1', data);
      expect(mockPut).toHaveBeenCalledWith('/regulatory/permits/perm1', data);
      expect(result).toEqual(updated);
    });
  });

  describe('changePermitStatus', () => {
    it('calls PATCH /regulatory/permits/:id/status', async () => {
      const updated = { id: 'perm1', status: 'APPROVED' };
      mockPatch.mockResolvedValue({ data: updated });

      const result = await regulatoryApi.changePermitStatus('perm1', 'APPROVED' as never);
      expect(mockPatch).toHaveBeenCalledWith('/regulatory/permits/perm1/status', { status: 'APPROVED' });
      expect(result).toEqual(updated);
    });
  });

  // --- Licenses ---

  describe('getLicenses', () => {
    it('calls GET /regulatory/licenses without params', async () => {
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } });

      const result = await regulatoryApi.getLicenses();
      expect(mockGet).toHaveBeenCalledWith('/regulatory/licenses', { params: undefined });
      expect(result).toEqual({ content: [], totalElements: 0 });
    });

    it('passes search filter to licenses', async () => {
      const params = { search: 'lic-test' };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } });

      await regulatoryApi.getLicenses(params);
      expect(mockGet).toHaveBeenCalledWith('/regulatory/licenses', { params });
    });
  });

  describe('getLicense', () => {
    it('calls GET /regulatory/licenses/:id', async () => {
      const mockLicense = { id: 'lic1', name: 'License A' };
      mockGet.mockResolvedValue({ data: mockLicense });

      const result = await regulatoryApi.getLicense('lic1');
      expect(mockGet).toHaveBeenCalledWith('/regulatory/licenses/lic1');
      expect(result).toEqual(mockLicense);
    });
  });

  describe('createLicense', () => {
    it('calls POST /regulatory/licenses', async () => {
      const data = { name: 'New License' };
      mockPost.mockResolvedValue({ data: { id: 'lic2', ...data } });

      const result = await regulatoryApi.createLicense(data);
      expect(mockPost).toHaveBeenCalledWith('/regulatory/licenses', data);
      expect(result.id).toBe('lic2');
    });
  });

  describe('updateLicense', () => {
    it('calls PUT /regulatory/licenses/:id', async () => {
      const data = { name: 'Updated License' };
      mockPut.mockResolvedValue({ data: { id: 'lic1', ...data } });

      const result = await regulatoryApi.updateLicense('lic1', data);
      expect(mockPut).toHaveBeenCalledWith('/regulatory/licenses/lic1', data);
      expect(result.name).toBe('Updated License');
    });
  });

  // --- Inspections ---

  describe('getInspections', () => {
    it('calls GET /regulatory/inspections without params', async () => {
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } });

      await regulatoryApi.getInspections();
      expect(mockGet).toHaveBeenCalledWith('/regulatory/inspections', { params: undefined });
    });

    it('passes date range filters', async () => {
      const params = { dateFrom: '2026-01-01', dateTo: '2026-12-31' };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } });

      await regulatoryApi.getInspections(params);
      expect(mockGet).toHaveBeenCalledWith('/regulatory/inspections', { params });
    });
  });

  describe('getInspection', () => {
    it('calls GET /regulatory/inspections/:id', async () => {
      const mockInspection = { id: 'ins1', type: 'SAFETY' };
      mockGet.mockResolvedValue({ data: mockInspection });

      const result = await regulatoryApi.getInspection('ins1');
      expect(mockGet).toHaveBeenCalledWith('/regulatory/inspections/ins1');
      expect(result).toEqual(mockInspection);
    });
  });

  describe('createInspection', () => {
    it('calls POST /regulatory/inspections', async () => {
      const data = { type: 'QUALITY' } as never;
      mockPost.mockResolvedValue({ data: { id: 'ins2', type: 'QUALITY' } });

      const result = await regulatoryApi.createInspection(data);
      expect(mockPost).toHaveBeenCalledWith('/regulatory/inspections', data);
      expect(result.id).toBe('ins2');
    });
  });

  describe('updateInspection', () => {
    it('calls PUT /regulatory/inspections/:id', async () => {
      const data = { notes: 'Updated' };
      mockPut.mockResolvedValue({ data: { id: 'ins1', ...data } });

      const result = await regulatoryApi.updateInspection('ins1', data);
      expect(mockPut).toHaveBeenCalledWith('/regulatory/inspections/ins1', data);
      expect(result).toEqual({ id: 'ins1', notes: 'Updated' });
    });
  });

  describe('changeInspectionStatus', () => {
    it('calls PATCH /regulatory/inspections/:id/status', async () => {
      mockPatch.mockResolvedValue({ data: { id: 'ins1', status: 'COMPLETED' } });

      const result = await regulatoryApi.changeInspectionStatus('ins1', 'COMPLETED' as never);
      expect(mockPatch).toHaveBeenCalledWith('/regulatory/inspections/ins1/status', { status: 'COMPLETED' });
      expect(result.status).toBe('COMPLETED');
    });
  });

  // --- Compliance Checks ---

  describe('getComplianceChecks', () => {
    it('calls GET /regulatory/compliance without params', async () => {
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } });

      await regulatoryApi.getComplianceChecks();
      expect(mockGet).toHaveBeenCalledWith('/regulatory/compliance', { params: undefined });
    });

    it('passes projectId filter', async () => {
      const params = { projectId: 'p1', result: 'PASS' };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } });

      await regulatoryApi.getComplianceChecks(params);
      expect(mockGet).toHaveBeenCalledWith('/regulatory/compliance', { params });
    });
  });

  describe('getComplianceCheck', () => {
    it('calls GET /regulatory/compliance/:id', async () => {
      const mockCheck = { id: 'cc1', result: 'PASS' };
      mockGet.mockResolvedValue({ data: mockCheck });

      const result = await regulatoryApi.getComplianceCheck('cc1');
      expect(mockGet).toHaveBeenCalledWith('/regulatory/compliance/cc1');
      expect(result).toEqual(mockCheck);
    });
  });

  describe('createComplianceCheck', () => {
    it('calls POST /regulatory/compliance', async () => {
      const data = { projectId: 'p1' };
      mockPost.mockResolvedValue({ data: { id: 'cc2', ...data } });

      const result = await regulatoryApi.createComplianceCheck(data);
      expect(mockPost).toHaveBeenCalledWith('/regulatory/compliance', data);
      expect(result.id).toBe('cc2');
    });
  });

  // --- Error handling ---

  describe('error propagation', () => {
    it('propagates network errors', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));
      await expect(regulatoryApi.getPermits()).rejects.toThrow('Network Error');
    });

    it('propagates errors from POST calls', async () => {
      mockPost.mockRejectedValue(new Error('403 Forbidden'));
      await expect(regulatoryApi.createPermit({} as never)).rejects.toThrow('403 Forbidden');
    });

    it('propagates errors from PUT calls', async () => {
      mockPut.mockRejectedValue(new Error('Not Found'));
      await expect(regulatoryApi.updatePermit('bad-id', {})).rejects.toThrow('Not Found');
    });

    it('propagates errors from PATCH calls', async () => {
      mockPatch.mockRejectedValue(new Error('Invalid status'));
      await expect(regulatoryApi.changePermitStatus('perm1', 'INVALID' as never)).rejects.toThrow('Invalid status');
    });
  });
});
