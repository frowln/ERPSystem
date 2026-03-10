import { apiClient } from './client';
import type { PaginatedResponse } from '@/types';

export interface LimitFenceSheet {
  id: string;
  sheetNumber: string;
  projectId: string;
  materialId: string;
  materialName?: string;
  unit?: string;
  limitQuantity: number;
  issuedQuantity: number;
  returnedQuantity: number;
  periodStart: string;
  periodEnd: string;
  warehouseId?: string;
  responsibleId?: string;
  specificationId?: string;
  status: 'ACTIVE' | 'EXHAUSTED' | 'CLOSED' | 'CANCELLED';
  organizationId?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LimitFenceSheetFilters {
  status?: string;
  projectId?: string;
  materialId?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface CreateLimitFenceSheetRequest {
  sheetNumber: string;
  projectId: string;
  materialId: string;
  materialName?: string;
  unit?: string;
  limitQuantity: number;
  periodStart: string;
  periodEnd: string;
  warehouseId?: string;
  responsibleId?: string;
  specificationId?: string;
  notes?: string;
}

export interface UpdateLimitFenceSheetRequest {
  limitQuantity?: number;
  periodStart?: string;
  periodEnd?: string;
  warehouseId?: string;
  responsibleId?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'privod_limit_fence_sheets';

function readStore(): LimitFenceSheet[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as LimitFenceSheet[];
  } catch {
    return [];
  }
}

function writeStore(items: LimitFenceSheet[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ---------------------------------------------------------------------------
// API with localStorage fallbacks
// ---------------------------------------------------------------------------
export const limitFenceSheetsApi = {
  async getSheets(params?: LimitFenceSheetFilters): Promise<PaginatedResponse<LimitFenceSheet>> {
    try {
      const response = await apiClient.get<PaginatedResponse<LimitFenceSheet>>('/warehouse/limit-fence-sheets', {
        params,
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      let stored = readStore();
      if (params?.status) stored = stored.filter((s) => s.status === params.status);
      if (params?.projectId) stored = stored.filter((s) => s.projectId === params.projectId);
      if (params?.materialId) stored = stored.filter((s) => s.materialId === params.materialId);
      return { content: stored, totalElements: stored.length, totalPages: 1, page: params?.page ?? 0, size: params?.size ?? 20 };
    }
  },

  async getSheet(id: string): Promise<LimitFenceSheet> {
    try {
      const response = await apiClient.get<LimitFenceSheet>(`/warehouse/limit-fence-sheets/${id}`, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore();
      const found = stored.find((s) => s.id === id);
      if (found) return found;
      throw new Error(`LimitFenceSheet ${id} not found`);
    }
  },

  async getRemainingLimit(projectId: string, materialId: string): Promise<number> {
    try {
      const response = await apiClient.get<number>('/warehouse/limit-fence-sheets/remaining-limit', {
        params: { projectId, materialId },
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore();
      const matching = stored.filter(
        (s) => s.projectId === projectId && s.materialId === materialId && s.status === 'ACTIVE',
      );
      return matching.reduce((sum, s) => sum + (s.limitQuantity - s.issuedQuantity + s.returnedQuantity), 0);
    }
  },

  async createSheet(data: CreateLimitFenceSheetRequest): Promise<LimitFenceSheet> {
    try {
      const response = await apiClient.post<LimitFenceSheet>('/warehouse/limit-fence-sheets', data, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore();
      const newItem: LimitFenceSheet = {
        ...data,
        id: crypto.randomUUID(),
        issuedQuantity: 0,
        returnedQuantity: 0,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      stored.push(newItem);
      writeStore(stored);
      return newItem;
    }
  },

  async updateSheet(id: string, data: UpdateLimitFenceSheetRequest): Promise<LimitFenceSheet> {
    try {
      const response = await apiClient.put<LimitFenceSheet>(`/warehouse/limit-fence-sheets/${id}`, data, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore();
      const idx = stored.findIndex((s) => s.id === id);
      if (idx === -1) throw new Error(`LimitFenceSheet ${id} not found`);
      stored[idx] = { ...stored[idx], ...data, updatedAt: new Date().toISOString() };
      writeStore(stored);
      return stored[idx];
    }
  },

  async issueBySheet(id: string, quantity: number): Promise<LimitFenceSheet> {
    try {
      const response = await apiClient.post<LimitFenceSheet>(`/warehouse/limit-fence-sheets/${id}/issue`, null, {
        params: { quantity },
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore();
      const idx = stored.findIndex((s) => s.id === id);
      if (idx === -1) throw new Error(`LimitFenceSheet ${id} not found`);
      stored[idx].issuedQuantity += quantity;
      if (stored[idx].issuedQuantity >= stored[idx].limitQuantity) {
        stored[idx].status = 'EXHAUSTED';
      }
      stored[idx].updatedAt = new Date().toISOString();
      writeStore(stored);
      return stored[idx];
    }
  },

  async returnBySheet(id: string, quantity: number): Promise<LimitFenceSheet> {
    try {
      const response = await apiClient.post<LimitFenceSheet>(`/warehouse/limit-fence-sheets/${id}/return`, null, {
        params: { quantity },
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore();
      const idx = stored.findIndex((s) => s.id === id);
      if (idx === -1) throw new Error(`LimitFenceSheet ${id} not found`);
      stored[idx].returnedQuantity += quantity;
      if (stored[idx].status === 'EXHAUSTED' && stored[idx].issuedQuantity - stored[idx].returnedQuantity < stored[idx].limitQuantity) {
        stored[idx].status = 'ACTIVE';
      }
      stored[idx].updatedAt = new Date().toISOString();
      writeStore(stored);
      return stored[idx];
    }
  },

  async closeSheet(id: string): Promise<LimitFenceSheet> {
    try {
      const response = await apiClient.post<LimitFenceSheet>(`/warehouse/limit-fence-sheets/${id}/close`, null, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore();
      const idx = stored.findIndex((s) => s.id === id);
      if (idx === -1) throw new Error(`LimitFenceSheet ${id} not found`);
      stored[idx].status = 'CLOSED';
      stored[idx].updatedAt = new Date().toISOString();
      writeStore(stored);
      return stored[idx];
    }
  },

  async deleteSheet(id: string): Promise<void> {
    try {
      await apiClient.delete(`/warehouse/limit-fence-sheets/${id}`, {
        _silentErrors: true,
      } as any);
    } catch {
      const stored = readStore();
      const filtered = stored.filter((s) => s.id !== id);
      writeStore(filtered);
    }
  },
};
