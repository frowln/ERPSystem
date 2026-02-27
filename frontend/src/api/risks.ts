import { apiClient } from './client';
import type { ProjectRisk } from '@/types';

export const risksApi = {
  getRisks: async (projectId: string): Promise<ProjectRisk[]> => {
    const response = await apiClient.get<ProjectRisk[]>(`/projects/${projectId}/risks`);
    return response.data;
  },

  createRisk: async (projectId: string, data: Partial<ProjectRisk>): Promise<ProjectRisk> => {
    const response = await apiClient.post<ProjectRisk>(`/projects/${projectId}/risks`, data);
    return response.data;
  },

  updateRisk: async (projectId: string, riskId: string, data: Partial<ProjectRisk>): Promise<ProjectRisk> => {
    const response = await apiClient.put<ProjectRisk>(`/projects/${projectId}/risks/${riskId}`, data);
    return response.data;
  },

  deleteRisk: async (projectId: string, riskId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/risks/${riskId}`);
  },
};
