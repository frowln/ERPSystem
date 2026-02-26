import { apiClient } from './client';
import type { PaginatedResponse } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PricingDatabaseType = 'FER' | 'TER' | 'GESN' | 'LOCAL';

export interface PricingDatabase {
  id: string;
  name: string;
  type: PricingDatabaseType;
  typeDisplayName: string;
  region: string | null;
  baseYear: number;
  coefficientToCurrentPrices: number;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  sourceUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
}

export interface CreatePricingDatabaseRequest {
  name: string;
  type: PricingDatabaseType;
  region?: string;
  baseYear: number;
  coefficientToCurrentPrices?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  sourceUrl?: string;
  active?: boolean;
}

export interface PriceRate {
  id: string;
  databaseId: string;
  code: string;
  name: string;
  unit: string;
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  overheadCost: number;
  totalCost: number;
  category: string | null;
  subcategory: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface PriceIndex {
  id: string;
  region: string;
  workType: string;
  baseQuarter: string;
  targetQuarter: string;
  indexValue: number;
  source: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreatePriceIndexRequest {
  region: string;
  workType: string;
  baseQuarter: string;
  targetQuarter: string;
  indexValue: number;
  source?: string;
}

export interface PricingImportReport {
  databaseId: string;
  source: string;
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
  skippedRows: number;
  errorRows: number;
  errors: string[];
}

export interface QuarterlyPriceIndexImportRequest {
  quarter: string;
  source?: string;
  entries: Array<{
    region: string;
    workType: string;
    baseQuarter?: string;
    indexValue: number;
  }>;
}

export interface QuarterlyPriceIndexImportResult {
  quarter: string;
  totalEntries: number;
  importedEntries: number;
  duplicateEntries: number;
  skippedEntries: number;
}

export interface PriceCalculationResult {
  rateId: string;
  rateCode: string;
  rateName: string;
  unit: string;
  quantity: number;
  basePricePerUnit: number;
  baseTotal: number;
  region: string | null;
  indexValue: number;
  indexQuarter: string | null;
  currentPricePerUnit: number;
  currentTotal: number;
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  overheadCost: number;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const pricingApi = {
  // --- Databases ---

  getDatabases: async (params?: { page?: number; size?: number }): Promise<PaginatedResponse<PricingDatabase>> => {
    const response = await apiClient.get<PaginatedResponse<PricingDatabase>>('/integrations/pricing/databases', { params });
    return response.data;
  },

  getDatabase: async (id: string): Promise<PricingDatabase> => {
    const response = await apiClient.get<PricingDatabase>(`/integrations/pricing/databases/${id}`);
    return response.data;
  },

  createDatabase: async (data: CreatePricingDatabaseRequest): Promise<PricingDatabase> => {
    const response = await apiClient.post<PricingDatabase>('/integrations/pricing/databases', data);
    return response.data;
  },

  // --- Rates ---

  searchRates: async (params?: {
    databaseId?: string;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<PriceRate>> => {
    const response = await apiClient.get<PaginatedResponse<PriceRate>>('/integrations/pricing/rates', { params });
    return response.data;
  },

  getRate: async (id: string): Promise<PriceRate> => {
    const response = await apiClient.get<PriceRate>(`/integrations/pricing/rates/${id}`);
    return response.data;
  },

  importRates: async (databaseId: string, file: File): Promise<PricingImportReport> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<PricingImportReport>('/integrations/pricing/rates/import', formData, {
      params: { databaseId },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  exportRates: async (databaseId: string): Promise<Blob> => {
    const response = await apiClient.get('/integrations/pricing/rates/export', {
      params: { databaseId },
      responseType: 'blob',
    });
    return response.data;
  },

  // --- Indices ---

  getIndices: async (params?: {
    region?: string;
    workType?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<PriceIndex>> => {
    const response = await apiClient.get<PaginatedResponse<PriceIndex>>('/integrations/pricing/indices', { params });
    return response.data;
  },

  createIndex: async (data: CreatePriceIndexRequest): Promise<PriceIndex> => {
    const response = await apiClient.post<PriceIndex>('/integrations/pricing/indices', data);
    return response.data;
  },

  importQuarterlyIndices: async (data: QuarterlyPriceIndexImportRequest): Promise<QuarterlyPriceIndexImportResult> => {
    const response = await apiClient.post<QuarterlyPriceIndexImportResult>(
      '/integrations/pricing/indices/import-quarterly',
      data,
    );
    return response.data;
  },

  // --- Calculate ---

  calculatePrice: async (rateId: string, quantity: number, region?: string): Promise<PriceCalculationResult> => {
    const response = await apiClient.get<PriceCalculationResult>('/integrations/pricing/calculate', {
      params: { rateId, quantity, region: region || undefined },
    });
    return response.data;
  },
};
