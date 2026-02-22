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

export const limitFenceSheetsApi = {
  async getSheets(params?: LimitFenceSheetFilters): Promise<PaginatedResponse<LimitFenceSheet>> {
    const response = await apiClient.get<PaginatedResponse<LimitFenceSheet>>('/warehouse/limit-fence-sheets', { params });
    return response.data;
  },

  async getSheet(id: string): Promise<LimitFenceSheet> {
    const response = await apiClient.get<LimitFenceSheet>(`/warehouse/limit-fence-sheets/${id}`);
    return response.data;
  },

  async getRemainingLimit(projectId: string, materialId: string): Promise<number> {
    const response = await apiClient.get<number>('/warehouse/limit-fence-sheets/remaining-limit', {
      params: { projectId, materialId },
    });
    return response.data;
  },

  async createSheet(data: CreateLimitFenceSheetRequest): Promise<LimitFenceSheet> {
    const response = await apiClient.post<LimitFenceSheet>('/warehouse/limit-fence-sheets', data);
    return response.data;
  },

  async updateSheet(id: string, data: UpdateLimitFenceSheetRequest): Promise<LimitFenceSheet> {
    const response = await apiClient.put<LimitFenceSheet>(`/warehouse/limit-fence-sheets/${id}`, data);
    return response.data;
  },

  async issueBySheet(id: string, quantity: number): Promise<LimitFenceSheet> {
    const response = await apiClient.post<LimitFenceSheet>(`/warehouse/limit-fence-sheets/${id}/issue`, null, {
      params: { quantity },
    });
    return response.data;
  },

  async returnBySheet(id: string, quantity: number): Promise<LimitFenceSheet> {
    const response = await apiClient.post<LimitFenceSheet>(`/warehouse/limit-fence-sheets/${id}/return`, null, {
      params: { quantity },
    });
    return response.data;
  },

  async closeSheet(id: string): Promise<LimitFenceSheet> {
    const response = await apiClient.post<LimitFenceSheet>(`/warehouse/limit-fence-sheets/${id}/close`);
    return response.data;
  },

  async deleteSheet(id: string): Promise<void> {
    await apiClient.delete(`/warehouse/limit-fence-sheets/${id}`);
  },
};
