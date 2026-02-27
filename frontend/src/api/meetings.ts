import { apiClient } from './client';
import type { PreConstructionMeeting } from '@/types';

export const meetingsApi = {
  getMeeting: async (projectId: string): Promise<PreConstructionMeeting | null> => {
    const response = await apiClient.get<PreConstructionMeeting>(`/projects/${projectId}/meeting`);
    return response.data;
  },

  createMeeting: async (projectId: string, data: Partial<PreConstructionMeeting>): Promise<PreConstructionMeeting> => {
    const response = await apiClient.post<PreConstructionMeeting>(`/projects/${projectId}/meeting`, data);
    return response.data;
  },

  updateMeeting: async (projectId: string, data: Partial<PreConstructionMeeting>): Promise<PreConstructionMeeting> => {
    const response = await apiClient.put<PreConstructionMeeting>(`/projects/${projectId}/meeting`, data);
    return response.data;
  },

  toggleDecision: async (projectId: string, decisionId: string): Promise<PreConstructionMeeting> => {
    const response = await apiClient.patch<PreConstructionMeeting>(`/projects/${projectId}/meeting/decisions/${decisionId}/toggle`);
    return response.data;
  },

  toggleActionItem: async (projectId: string, actionItemId: string): Promise<PreConstructionMeeting> => {
    const response = await apiClient.patch<PreConstructionMeeting>(`/projects/${projectId}/meeting/action-items/${actionItemId}/toggle`);
    return response.data;
  },
};
