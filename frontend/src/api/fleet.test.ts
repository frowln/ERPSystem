// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fleetApi } from './fleet';

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

describe('fleetApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getVehicles', () => {
    it('calls GET /fleet/vehicles without params', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const result = await fleetApi.getVehicles();
      expect(mockGet).toHaveBeenCalledWith('/fleet/vehicles', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('passes filter params to GET /fleet/vehicles', async () => {
      const params = { type: 'CRANE' as const, status: 'AVAILABLE' as const, page: 0, size: 20 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await fleetApi.getVehicles(params);
      expect(mockGet).toHaveBeenCalledWith('/fleet/vehicles', { params });
    });
  });

  describe('getVehicle', () => {
    it('calls GET /fleet/vehicles/:id', async () => {
      const vehicle = { id: 'v1', name: 'CAT 320', type: 'EXCAVATOR' };
      mockGet.mockResolvedValue({ data: vehicle } as never);

      const result = await fleetApi.getVehicle('v1');
      expect(mockGet).toHaveBeenCalledWith('/fleet/vehicles/v1');
      expect(result).toEqual(vehicle);
    });
  });

  describe('createVehicle', () => {
    it('calls POST /fleet/vehicles with data', async () => {
      const data = { name: 'New Crane', type: 'CRANE', brand: 'Liebherr' };
      const created = { id: 'v2', ...data };
      mockPost.mockResolvedValue({ data: created } as never);

      const result = await fleetApi.createVehicle(data as never);
      expect(mockPost).toHaveBeenCalledWith('/fleet/vehicles', data);
      expect(result).toEqual(created);
    });
  });

  describe('updateVehicle', () => {
    it('calls PUT /fleet/vehicles/:id with data', async () => {
      const data = { name: 'Updated Crane' };
      const updated = { id: 'v1', ...data };
      mockPut.mockResolvedValue({ data: updated } as never);

      const result = await fleetApi.updateVehicle('v1', data as never);
      expect(mockPut).toHaveBeenCalledWith('/fleet/vehicles/v1', data);
      expect(result).toEqual(updated);
    });
  });

  describe('getAssignments', () => {
    it('calls GET /fleet/vehicles/:id/assignments', async () => {
      const assignments = [{ id: 'a1', projectName: 'Project A', status: 'ACTIVE' }];
      mockGet.mockResolvedValue({ data: assignments } as never);

      const result = await fleetApi.getAssignments('v1');
      expect(mockGet).toHaveBeenCalledWith('/fleet/vehicles/v1/assignments');
      expect(result).toEqual(assignments);
    });
  });

  describe('getMaintenanceRecords', () => {
    it('calls GET /fleet/maintenance/history/:vehicleId', async () => {
      const records = [{ id: 'mr1', type: 'SCHEDULED', cost: 5000 }];
      mockGet.mockResolvedValue({ data: records } as never);

      const result = await fleetApi.getMaintenanceRecords('v1');
      expect(mockGet).toHaveBeenCalledWith('/fleet/maintenance/history/v1');
      expect(result).toEqual(records);
    });
  });

  describe('getFuelRecords', () => {
    it('calls GET /fleet/fuel/history/:vehicleId', async () => {
      const records = [{ id: 'fr1', quantity: 200, totalCost: 12000 }];
      mockGet.mockResolvedValue({ data: records } as never);

      const result = await fleetApi.getFuelRecords('v1');
      expect(mockGet).toHaveBeenCalledWith('/fleet/fuel/history/v1');
      expect(result).toEqual(records);
    });
  });

  describe('getInspections', () => {
    it('calls GET /fleet/inspections with vehicleId param', async () => {
      const inspections = [{ id: 'i1', result: 'PASSED' }];
      mockGet.mockResolvedValue({ data: inspections } as never);

      const result = await fleetApi.getInspections('v1');
      expect(mockGet).toHaveBeenCalledWith('/fleet/inspections', { params: { vehicleId: 'v1' } });
      expect(result).toEqual(inspections);
    });
  });

  describe('deleteVehicle', () => {
    it('calls DELETE /fleet/vehicles/:id', async () => {
      mockDelete.mockResolvedValue({} as never);

      await fleetApi.deleteVehicle('v1');
      expect(mockDelete).toHaveBeenCalledWith('/fleet/vehicles/v1');
    });
  });

  describe('error propagation', () => {
    it('propagates API errors from get requests', async () => {
      const error = new Error('Service Unavailable');
      mockGet.mockRejectedValue(error);

      await expect(fleetApi.getVehicles()).rejects.toThrow('Service Unavailable');
    });

    it('propagates API errors from post requests', async () => {
      const error = new Error('Bad Request');
      mockPost.mockRejectedValue(error);

      await expect(fleetApi.createVehicle({} as never)).rejects.toThrow('Bad Request');
    });
  });
});
