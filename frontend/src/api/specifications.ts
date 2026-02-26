import { apiClient } from './client';
import type {
  Specification,
  SpecItem,
  SpecItemType,
  PaginatedResponse,
  PaginationParams,
  SpecificationStatus,
} from '@/types';

export interface SpecificationFilters extends PaginationParams {
  status?: SpecificationStatus;
  projectId?: string;
  search?: string;
}

export interface CreateSpecItemRequest {
  name: string;
  itemType: SpecItemType;
  brand?: string;
  productCode?: string;
  manufacturer?: string;
  quantity: number;
  unitOfMeasure: string;
  weight?: number;
  notes?: string;
  sequence?: number;
  position?: string;
  sectionName?: string;
}

/** DTO returned by the /parse-pdf endpoint — mirrors ParsedSpecItemDto.java */
export interface ParsedSpecItem {
  position: string | null;
  itemType: SpecItemType;
  name: string;
  brand: string | null;
  productCode: string | null;
  manufacturer: string | null;
  unitOfMeasure: string;
  quantity: number;
  mass: number | null;
  notes: string | null;
  /** Section label parsed from PDF (e.g. "СИСТЕМА ОТОПЛЕНИЯ (ОВ)") */
  sectionName: string | null;
}

export const specificationsApi = {
  getSpecifications: async (params?: SpecificationFilters): Promise<PaginatedResponse<Specification>> => {
    const response = await apiClient.get<PaginatedResponse<Specification>>('/specifications', { params });
    return response.data;
  },

  getSpecification: async (id: string): Promise<Specification> => {
    const response = await apiClient.get<Specification>(`/specifications/${id}`);
    return response.data;
  },

  getSpecItems: async (specId: string): Promise<SpecItem[]> => {
    const response = await apiClient.get<SpecItem[]>(`/specifications/${specId}/items`);
    return response.data;
  },

  createSpecification: async (data: Partial<Specification>): Promise<Specification> => {
    const response = await apiClient.post<Specification>('/specifications', data);
    return response.data;
  },

  updateSpecification: async (id: string, data: Partial<Specification>): Promise<Specification> => {
    const response = await apiClient.put<Specification>(`/specifications/${id}`, data);
    return response.data;
  },

  deleteSpecification: async (id: string): Promise<void> => {
    await apiClient.delete(`/specifications/${id}`);
  },

  getSupplySummary: async (specId: string): Promise<{ total: number; fullyCovered: number; partiallyCovered: number; notCovered: number }> => {
    const items = await specificationsApi.getSpecItems(specId);
    const fullyCovered = items.filter(i => i.supplyStatus === 'FULLY_COVERED').length;
    const partiallyCovered = items.filter(i => i.supplyStatus === 'PARTIALLY_COVERED').length;
    const notCovered = items.filter(i => !i.supplyStatus || i.supplyStatus === 'NOT_COVERED').length;
    return { total: items.length, fullyCovered, partiallyCovered, notCovered };
  },

  createSpecItem: async (specId: string, data: CreateSpecItemRequest): Promise<SpecItem> => {
    const response = await apiClient.post<SpecItem>(`/specifications/${specId}/items`, data);
    return response.data;
  },

  updateSpecItem: async (
    itemId: string,
    data: Partial<CreateSpecItemRequest> & { budgetItemId?: string },
    options?: { silent?: boolean },
  ): Promise<SpecItem> => {
    const response = await apiClient.put<SpecItem>(
      `/specifications/items/${itemId}`,
      data,
      options?.silent ? { _silentErrors: true } as never : undefined,
    );
    return response.data;
  },

  deleteSpecItem: async (itemId: string): Promise<void> => {
    await apiClient.delete(`/specifications/items/${itemId}`);
  },

  batchCreateSpecItems: async (specId: string, items: CreateSpecItemRequest[]): Promise<SpecItem[]> => {
    const created: SpecItem[] = [];
    for (const item of items) {
      const si = await specificationsApi.createSpecItem(specId, item);
      created.push(si);
    }
    return created;
  },

  recalculateSupplyStatus: async (specId: string): Promise<void> => {
    await apiClient.post(`/specifications/${specId}/recalculate-supply`);
  },

  /**
   * Parses a PDF without a specId — for use on the Create form before spec is saved.
   */
  previewPdf: async (file: File): Promise<ParsedSpecItem[]> => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post<ParsedSpecItem[]>(
      '/specifications/preview-pdf',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  /**
   * Uploads a PDF and returns parsed spec items (preview only, not saved yet).
   */
  parsePdf: async (specId: string, file: File): Promise<ParsedSpecItem[]> => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post<ParsedSpecItem[]>(
      `/specifications/${specId}/parse-pdf`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  /**
   * Confirms import: saves parsed items to the specification.
   */
  importPdfItems: async (specId: string, items: ParsedSpecItem[]): Promise<SpecItem[]> => {
    const response = await apiClient.post<SpecItem[]>(
      `/specifications/${specId}/import-pdf-items`,
      items,
    );
    return response.data;
  },

  /**
   * Creates a new version (revision) of the specification.
   * The current spec is frozen (isCurrent=false) and a new one with docVersion+1 is returned.
   */
  createVersion: async (specId: string): Promise<Specification> => {
    const response = await apiClient.post<Specification>(`/specifications/${specId}/version`);
    return response.data;
  },
};
