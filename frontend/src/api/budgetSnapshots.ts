import { apiClient } from './client';
import type { BudgetSnapshot, SnapshotComparison, PaginatedResponse, PaginationParams } from '@/types';

export const budgetSnapshotsApi = {
  create: async (
    budgetId: string,
    name: string,
    options?: { snapshotType?: 'BASELINE' | 'REFORECAST' | 'SNAPSHOT'; sourceSnapshotId?: string; notes?: string },
  ): Promise<BudgetSnapshot> => {
    const response = await apiClient.post<BudgetSnapshot>(`/budgets/${budgetId}/snapshots`, {
      name,
      ...options,
    });
    return response.data;
  },

  list: async (budgetId: string, params?: PaginationParams): Promise<PaginatedResponse<BudgetSnapshot>> => {
    const response = await apiClient.get<PaginatedResponse<BudgetSnapshot>>(`/budgets/${budgetId}/snapshots`, {
      params,
    });
    return response.data;
  },

  getById: async (budgetId: string, id: string): Promise<BudgetSnapshot> => {
    const response = await apiClient.get<BudgetSnapshot>(`/budgets/${budgetId}/snapshots/${id}`);
    return response.data;
  },

  compare: async (budgetId: string, id1: string, id2?: string): Promise<SnapshotComparison> => {
    const response = await apiClient.get<SnapshotComparison>(
      `/budgets/${budgetId}/snapshots/${id1}/compare`,
      { params: id2 ? { targetSnapshotId: id2 } : undefined },
    );
    return response.data;
  },

  delete: async (budgetId: string, id: string): Promise<void> => {
    await apiClient.delete(`/budgets/${budgetId}/snapshots/${id}`);
  },
};
