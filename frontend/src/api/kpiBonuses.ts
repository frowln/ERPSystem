import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { KpiAchievement, BonusCalculation, BonusStatus } from '@/modules/analytics/types';

export interface KpiAchievementFilters extends PaginationParams {
  employeeId?: string;
  period?: string;
  category?: string;
  search?: string;
}

export interface BonusCalculationFilters extends PaginationParams {
  status?: BonusStatus;
  period?: string;
  search?: string;
}

export const kpiBonusesApi = {
  getAchievements: async (params?: KpiAchievementFilters): Promise<PaginatedResponse<KpiAchievement>> => {
    const response = await apiClient.get<PaginatedResponse<KpiAchievement>>('/analytics/kpi-achievements', { params });
    return response.data;
  },

  getAchievement: async (id: string): Promise<KpiAchievement> => {
    const response = await apiClient.get<KpiAchievement>(`/analytics/kpi-achievements/${id}`);
    return response.data;
  },

  getBonusCalculations: async (params?: BonusCalculationFilters): Promise<PaginatedResponse<BonusCalculation>> => {
    const response = await apiClient.get<PaginatedResponse<BonusCalculation>>('/analytics/bonus-calculations', { params });
    return response.data;
  },

  getBonusCalculation: async (id: string): Promise<BonusCalculation> => {
    const response = await apiClient.get<BonusCalculation>(`/analytics/bonus-calculations/${id}`);
    return response.data;
  },

  approveBonusCalculation: async (id: string): Promise<BonusCalculation> => {
    const response = await apiClient.patch<BonusCalculation>(`/analytics/bonus-calculations/${id}/approve`);
    return response.data;
  },

  recalculateBonus: async (id: string): Promise<BonusCalculation> => {
    const response = await apiClient.post<BonusCalculation>(`/analytics/bonus-calculations/${id}/recalculate`);
    return response.data;
  },
};
