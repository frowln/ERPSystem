import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { MonteCarloSimulation, SimulationResults } from './types';

export interface SimulationFilters extends PaginationParams {
  status?: string;
  projectId?: string;
  search?: string;
}

export const monteCarloApi = {
  getAll: async (params?: SimulationFilters): Promise<PaginatedResponse<MonteCarloSimulation>> => {
    const response = await apiClient.get<PaginatedResponse<MonteCarloSimulation>>('/monte-carlo', { params });
    return response.data;
  },

  getById: async (id: string): Promise<MonteCarloSimulation> => {
    const response = await apiClient.get<MonteCarloSimulation>(`/monte-carlo/${id}`);
    return response.data;
  },

  create: async (data: Partial<MonteCarloSimulation>): Promise<MonteCarloSimulation> => {
    const response = await apiClient.post<MonteCarloSimulation>('/monte-carlo', data);
    return response.data;
  },

  update: async (id: string, data: Partial<MonteCarloSimulation>): Promise<MonteCarloSimulation> => {
    const response = await apiClient.put<MonteCarloSimulation>(`/monte-carlo/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/monte-carlo/${id}`);
  },

  runSimulation: async (id: string): Promise<SimulationResults> => {
    const response = await apiClient.post<SimulationResults>(`/monte-carlo/${id}/run`);
    return response.data;
  },
};
