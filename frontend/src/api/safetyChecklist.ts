import { apiClient } from './client';
import type { SafetyChecklistItem } from '@/types';

export const safetyChecklistApi = {
  getChecklist: async (projectId: string): Promise<SafetyChecklistItem[]> => {
    const response = await apiClient.get<SafetyChecklistItem[]>(`/projects/${projectId}/safety-checklist`);
    return response.data;
  },

  updateItem: async (projectId: string, itemId: string, data: Partial<SafetyChecklistItem>): Promise<SafetyChecklistItem> => {
    const response = await apiClient.put<SafetyChecklistItem>(`/projects/${projectId}/safety-checklist/${itemId}`, data);
    return response.data;
  },

  initializeChecklist: async (projectId: string): Promise<SafetyChecklistItem[]> => {
    const response = await apiClient.post<SafetyChecklistItem[]>(`/projects/${projectId}/safety-checklist/initialize`);
    return response.data;
  },
};
