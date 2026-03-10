import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  StockLimit,
  StockLimitType,
  StockLimitAlert,
  StockAlertSeverity,
  StockAlertStatus,
} from '@/modules/warehouse/types';

export interface StockLimitFilters extends PaginationParams {
  limitType?: StockLimitType;
  isBreached?: boolean;
  locationId?: string;
  search?: string;
}

export interface StockAlertFilters extends PaginationParams {
  severity?: StockAlertSeverity;
  status?: StockAlertStatus;
  search?: string;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------
const STORAGE_LIMITS = 'privod_stock_limits';
const STORAGE_ALERTS = 'privod_stock_limit_alerts';

function readStore<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as T[];
  } catch {
    return [];
  }
}

function writeStore<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

// ---------------------------------------------------------------------------
// API with localStorage fallbacks
// ---------------------------------------------------------------------------
export const stockLimitsApi = {
  getLimits: async (params?: StockLimitFilters): Promise<PaginatedResponse<StockLimit>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<StockLimit>>('/warehouse/stock-limits', {
        params,
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      let stored = readStore<StockLimit>(STORAGE_LIMITS);
      if (params?.limitType) stored = stored.filter((s) => s.limitType === params.limitType);
      if (params?.isBreached !== undefined) stored = stored.filter((s) => s.isBreached === params.isBreached);
      if (params?.locationId) stored = stored.filter((s) => s.locationId === params.locationId);
      if (params?.search) {
        const q = params.search.toLowerCase();
        stored = stored.filter((s) => s.materialName.toLowerCase().includes(q) || s.locationName.toLowerCase().includes(q));
      }
      return { content: stored, totalElements: stored.length, totalPages: 1, page: params?.page ?? 0, size: params?.size ?? 20 };
    }
  },

  getLimit: async (id: string): Promise<StockLimit> => {
    try {
      const response = await apiClient.get<StockLimit>(`/warehouse/stock-limits/${id}`, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore<StockLimit>(STORAGE_LIMITS);
      const found = stored.find((s) => s.id === id);
      if (found) return found;
      throw new Error(`StockLimit ${id} not found`);
    }
  },

  createLimit: async (data: Partial<StockLimit>): Promise<StockLimit> => {
    try {
      const response = await apiClient.post<StockLimit>('/warehouse/stock-limits', data, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore<StockLimit>(STORAGE_LIMITS);
      const newItem: StockLimit = {
        id: crypto.randomUUID(),
        materialId: '',
        materialName: '',
        locationName: '',
        limitType: 'MIN',
        limitValue: 0,
        currentStock: 0,
        unitOfMeasure: '',
        isBreached: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      } as StockLimit;
      stored.push(newItem);
      writeStore(STORAGE_LIMITS, stored);
      return newItem;
    }
  },

  updateLimit: async (id: string, data: Partial<StockLimit>): Promise<StockLimit> => {
    try {
      const response = await apiClient.put<StockLimit>(`/warehouse/stock-limits/${id}`, data, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore<StockLimit>(STORAGE_LIMITS);
      const idx = stored.findIndex((s) => s.id === id);
      if (idx === -1) throw new Error(`StockLimit ${id} not found`);
      stored[idx] = { ...stored[idx], ...data, updatedAt: new Date().toISOString() };
      writeStore(STORAGE_LIMITS, stored);
      return stored[idx];
    }
  },

  deleteLimit: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/warehouse/stock-limits/${id}`, {
        _silentErrors: true,
      } as any);
    } catch {
      const stored = readStore<StockLimit>(STORAGE_LIMITS);
      writeStore(STORAGE_LIMITS, stored.filter((s) => s.id !== id));
    }
  },

  getAlerts: async (params?: StockAlertFilters): Promise<PaginatedResponse<StockLimitAlert>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<StockLimitAlert>>('/warehouse/stock-limits/alerts', {
        params,
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      let stored = readStore<StockLimitAlert>(STORAGE_ALERTS);
      if (params?.severity) stored = stored.filter((a) => a.severity === params.severity);
      if (params?.status) stored = stored.filter((a) => a.status === params.status);
      if (params?.search) {
        const q = params.search.toLowerCase();
        stored = stored.filter((a) => a.materialName.toLowerCase().includes(q) || a.message.toLowerCase().includes(q));
      }
      return { content: stored, totalElements: stored.length, totalPages: 1, page: params?.page ?? 0, size: params?.size ?? 20 };
    }
  },

  acknowledgeAlert: async (id: string): Promise<StockLimitAlert> => {
    try {
      const response = await apiClient.post<StockLimitAlert>(`/warehouse/stock-limits/alerts/${id}/acknowledge`, null, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore<StockLimitAlert>(STORAGE_ALERTS);
      const idx = stored.findIndex((a) => a.id === id);
      if (idx === -1) throw new Error(`StockLimitAlert ${id} not found`);
      stored[idx] = { ...stored[idx], status: 'ACKNOWLEDGED', acknowledgedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      writeStore(STORAGE_ALERTS, stored);
      return stored[idx];
    }
  },

  resolveAlert: async (id: string): Promise<StockLimitAlert> => {
    try {
      const response = await apiClient.post<StockLimitAlert>(`/warehouse/stock-limits/alerts/${id}/resolve`, null, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore<StockLimitAlert>(STORAGE_ALERTS);
      const idx = stored.findIndex((a) => a.id === id);
      if (idx === -1) throw new Error(`StockLimitAlert ${id} not found`);
      stored[idx] = { ...stored[idx], status: 'RESOLVED', resolvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      writeStore(STORAGE_ALERTS, stored);
      return stored[idx];
    }
  },
};
