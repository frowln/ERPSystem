// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { safetyApi } from './safety';

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
const mockPatch = vi.mocked(apiClient.patch);
const mockDelete = vi.mocked(apiClient.delete);

describe('safetyApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('incidents', () => {
    it('getIncidents calls GET /safety/incidents without params', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const result = await safetyApi.getIncidents();
      expect(mockGet).toHaveBeenCalledWith('/safety/incidents', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('getIncidents passes filter params', async () => {
      const params = { status: 'OPEN', severity: 'HIGH', projectId: 'p1', page: 0, size: 20 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await safetyApi.getIncidents(params);
      expect(mockGet).toHaveBeenCalledWith('/safety/incidents', { params });
    });

    it('getIncident calls GET /safety/incidents/:id', async () => {
      const incident = { id: 'inc1', title: 'Fall from height' };
      mockGet.mockResolvedValue({ data: incident } as never);

      const result = await safetyApi.getIncident('inc1');
      expect(mockGet).toHaveBeenCalledWith('/safety/incidents/inc1');
      expect(result).toEqual(incident);
    });

    it('createIncident calls POST /safety/incidents', async () => {
      const data = { title: 'New Incident', incidentDate: '2026-02-01', severity: 'MEDIUM' };
      const created = { id: 'inc2', ...data };
      mockPost.mockResolvedValue({ data: created } as never);

      const result = await safetyApi.createIncident(data as never);
      expect(mockPost).toHaveBeenCalledWith('/safety/incidents', data);
      expect(result).toEqual(created);
    });

    it('updateIncident calls PUT /safety/incidents/:id', async () => {
      const data = { title: 'Updated Incident' } as never;
      const updated = { id: 'inc1', title: 'Updated Incident' };
      mockPut.mockResolvedValue({ data: updated } as never);

      const result = await safetyApi.updateIncident('inc1', data);
      expect(mockPut).toHaveBeenCalledWith('/safety/incidents/inc1', data);
      expect(result).toEqual(updated);
    });

    it('changeIncidentStatus calls PATCH /safety/incidents/:id/status', async () => {
      const result = { id: 'inc1', status: 'INVESTIGATING' };
      mockPatch.mockResolvedValue({ data: result } as never);

      const response = await safetyApi.changeIncidentStatus('inc1', 'INVESTIGATING' as never);
      expect(mockPatch).toHaveBeenCalledWith('/safety/incidents/inc1/status', { status: 'INVESTIGATING' });
      expect(response).toEqual(result);
    });

    it('deleteIncident calls DELETE /safety/incidents/:id', async () => {
      mockDelete.mockResolvedValue({} as never);

      await safetyApi.deleteIncident('inc1');
      expect(mockDelete).toHaveBeenCalledWith('/safety/incidents/inc1');
    });
  });

  describe('inspections', () => {
    it('getInspections calls GET /safety/inspections', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const result = await safetyApi.getInspections();
      expect(mockGet).toHaveBeenCalledWith('/safety/inspections', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('getInspection calls GET /safety/inspections/:id', async () => {
      const inspection = { id: 'insp1', inspectionType: 'PLANNED' };
      mockGet.mockResolvedValue({ data: inspection } as never);

      const result = await safetyApi.getInspection('insp1');
      expect(mockGet).toHaveBeenCalledWith('/safety/inspections/insp1');
      expect(result).toEqual(inspection);
    });

    it('createInspection calls POST /safety/inspections', async () => {
      const data = { inspectionDate: '2026-02-10', inspectionType: 'PLANNED', projectId: 'p1' };
      const created = { id: 'insp2', ...data };
      mockPost.mockResolvedValue({ data: created } as never);

      const result = await safetyApi.createInspection(data);
      expect(mockPost).toHaveBeenCalledWith('/safety/inspections', data);
      expect(result).toEqual(created);
    });

    it('updateInspection calls PUT /safety/inspections/:id', async () => {
      const data = { inspectionDate: '2026-02-15', inspectionType: 'UNPLANNED' };
      const updated = { id: 'insp1', ...data };
      mockPut.mockResolvedValue({ data: updated } as never);

      const result = await safetyApi.updateInspection('insp1', data);
      expect(mockPut).toHaveBeenCalledWith('/safety/inspections/insp1', data);
      expect(result).toEqual(updated);
    });
  });

  describe('violations', () => {
    it('getViolations calls GET /safety/violations', async () => {
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      const result = await safetyApi.getViolations();
      expect(mockGet).toHaveBeenCalledWith('/safety/violations', { params: undefined });
      expect(result.content).toEqual([]);
    });

    it('getViolation calls GET /safety/violations/:id', async () => {
      const violation = { id: 'v1', description: 'Missing barrier' };
      mockGet.mockResolvedValue({ data: violation } as never);

      const result = await safetyApi.getViolation('v1');
      expect(mockGet).toHaveBeenCalledWith('/safety/violations/v1');
      expect(result).toEqual(violation);
    });

    it('resolveViolation calls PATCH /safety/violations/:id/resolve', async () => {
      const resolved = { id: 'v1', status: 'RESOLVED' };
      mockPatch.mockResolvedValue({ data: resolved } as never);

      const result = await safetyApi.resolveViolation('v1', 'Fixed barrier');
      expect(mockPatch).toHaveBeenCalledWith('/safety/violations/v1/resolve', { correctiveAction: 'Fixed barrier' });
      expect(result).toEqual(resolved);
    });
  });

  describe('error propagation', () => {
    it('propagates API errors', async () => {
      const error = new Error('Server Error');
      mockGet.mockRejectedValue(error);

      await expect(safetyApi.getIncidents()).rejects.toThrow('Server Error');
    });
  });
});
