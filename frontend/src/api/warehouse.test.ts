// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { warehouseApi } from './warehouse';

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
const mockPatch = vi.mocked(apiClient.patch);
const mockDelete = vi.mocked(apiClient.delete);

describe('warehouseApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMaterials', () => {
    it('calls GET /warehouse/materials without params', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const result = await warehouseApi.getMaterials();
      expect(mockGet).toHaveBeenCalledWith('/warehouse/materials', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('passes filter params', async () => {
      const params = { category: 'STEEL', search: 'bolt', page: 0, size: 20 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await warehouseApi.getMaterials(params);
      expect(mockGet).toHaveBeenCalledWith('/warehouse/materials', { params });
    });
  });

  describe('getMaterial', () => {
    it('calls GET /warehouse/materials/:id', async () => {
      const material = { id: 'm1', name: 'Steel Bolt', sku: 'SB-001' };
      mockGet.mockResolvedValue({ data: material } as never);

      const result = await warehouseApi.getMaterial('m1');
      expect(mockGet).toHaveBeenCalledWith('/warehouse/materials/m1');
      expect(result).toEqual(material);
    });
  });

  describe('getMaterialStock', () => {
    it('calls GET /warehouse/materials/:id/stock', async () => {
      const stock = [{ locationId: 'l1', locationName: 'Warehouse A', quantity: 100 }];
      mockGet.mockResolvedValue({ data: stock } as never);

      const result = await warehouseApi.getMaterialStock('m1');
      expect(mockGet).toHaveBeenCalledWith('/warehouse/materials/m1/stock');
      expect(result).toEqual(stock);
    });
  });

  describe('deleteMaterial', () => {
    it('calls DELETE /warehouse/materials/:id', async () => {
      mockDelete.mockResolvedValue({} as never);

      await warehouseApi.deleteMaterial('m1');
      expect(mockDelete).toHaveBeenCalledWith('/warehouse/materials/m1');
    });
  });

  describe('getMovements', () => {
    it('calls GET /warehouse/movements with params', async () => {
      const params = { page: 0, size: 10 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await warehouseApi.getMovements(params);
      expect(mockGet).toHaveBeenCalledWith('/warehouse/movements', { params });
    });
  });

  describe('getMovement', () => {
    it('calls GET /warehouse/movements/:id', async () => {
      const movement = { id: 'mv1', number: 'MV-001', type: 'RECEIPT' };
      mockGet.mockResolvedValue({ data: movement } as never);

      const result = await warehouseApi.getMovement('mv1');
      expect(mockGet).toHaveBeenCalledWith('/warehouse/movements/mv1');
      expect(result).toEqual(movement);
    });
  });

  describe('updateMovementStatus', () => {
    it('calls PATCH /warehouse/movements/:id/status', async () => {
      const updated = { id: 'mv1', status: 'APPROVED' };
      mockPatch.mockResolvedValue({ data: updated } as never);

      const result = await warehouseApi.updateMovementStatus('mv1', 'APPROVED');
      expect(mockPatch).toHaveBeenCalledWith('/warehouse/movements/mv1/status', { status: 'APPROVED' });
      expect(result).toEqual(updated);
    });
  });

  describe('createMaterial', () => {
    it('calls POST /warehouse/materials with data', async () => {
      const data = { name: 'New Material', sku: 'NM-001' };
      const created = { id: 'm2', ...data };
      mockPost.mockResolvedValue({ data: created } as never);

      const result = await warehouseApi.createMaterial(data as never);
      expect(mockPost).toHaveBeenCalledWith('/warehouse/materials', data);
      expect(result).toEqual(created);
    });
  });

  describe('createMovement', () => {
    it('calls POST /warehouse/movements with data', async () => {
      const data = { type: 'RECEIPT', quantity: 50 };
      const created = { id: 'mv2', ...data };
      mockPost.mockResolvedValue({ data: created } as never);

      const result = await warehouseApi.createMovement(data as never);
      expect(mockPost).toHaveBeenCalledWith('/warehouse/movements', data);
      expect(result).toEqual(created);
    });
  });

  describe('getLocations', () => {
    it('calls GET /warehouse/locations', async () => {
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await warehouseApi.getLocations();
      expect(mockGet).toHaveBeenCalledWith('/warehouse/locations', { params: undefined });
    });
  });

  describe('getKs2Acts', () => {
    it('calls GET /warehouse/ks2-acts', async () => {
      const acts = [{ id: 'a1', number: 'KS2-001' }];
      mockGet.mockResolvedValue({ data: acts } as never);

      const result = await warehouseApi.getKs2Acts();
      expect(mockGet).toHaveBeenCalledWith('/warehouse/ks2-acts');
      expect(result).toEqual(acts);
    });
  });

  describe('getM29Materials', () => {
    it('calls POST /warehouse/m29/materials with actIds', async () => {
      const materials = [{ id: 'm1', name: 'Concrete' }];
      mockPost.mockResolvedValue({ data: materials } as never);

      const result = await warehouseApi.getM29Materials(['a1', 'a2']);
      expect(mockPost).toHaveBeenCalledWith('/warehouse/m29/materials', { actIds: ['a1', 'a2'] });
      expect(result).toEqual(materials);
    });
  });

  describe('getMovementBoard', () => {
    it('calls GET /warehouse/movements/board', async () => {
      const movements = [{ id: 'mv1' }];
      mockGet.mockResolvedValue({ data: movements } as never);

      const result = await warehouseApi.getMovementBoard();
      expect(mockGet).toHaveBeenCalledWith('/warehouse/movements/board');
      expect(result).toEqual(movements);
    });
  });

  describe('error propagation', () => {
    it('propagates API errors from get requests', async () => {
      const error = new Error('Not Found');
      mockGet.mockRejectedValue(error);

      await expect(warehouseApi.getMaterials()).rejects.toThrow('Not Found');
    });

    it('propagates API errors from delete requests', async () => {
      const error = new Error('Forbidden');
      mockDelete.mockRejectedValue(error);

      await expect(warehouseApi.deleteMaterial('m1')).rejects.toThrow('Forbidden');
    });
  });
});
