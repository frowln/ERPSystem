import { apiClient } from './client';
import type { ConstructionPermit } from '@/types';

export const permitsApi = {
  getPermits: async (projectId: string): Promise<ConstructionPermit[]> => {
    const response = await apiClient.get<ConstructionPermit[]>(`/projects/${projectId}/permits`);
    return response.data;
  },

  createPermit: async (projectId: string, data: Partial<ConstructionPermit>): Promise<ConstructionPermit> => {
    const response = await apiClient.post<ConstructionPermit>(`/projects/${projectId}/permits`, data);
    return response.data;
  },

  updatePermit: async (projectId: string, permitId: string, data: Partial<ConstructionPermit>): Promise<ConstructionPermit> => {
    const response = await apiClient.put<ConstructionPermit>(`/projects/${projectId}/permits/${permitId}`, data);
    return response.data;
  },
};
