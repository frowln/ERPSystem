import { apiClient } from './client';
import type { EngineeringSurvey, SurveyStatus } from '@/types';

export const surveysApi = {
  getSurveys: async (projectId: string): Promise<EngineeringSurvey[]> => {
    const response = await apiClient.get<EngineeringSurvey[]>(`/projects/${projectId}/surveys`);
    return response.data;
  },

  createSurvey: async (projectId: string, data: Partial<EngineeringSurvey>): Promise<EngineeringSurvey> => {
    const response = await apiClient.post<EngineeringSurvey>(`/projects/${projectId}/surveys`, data);
    return response.data;
  },

  updateSurvey: async (projectId: string, surveyId: string, data: Partial<EngineeringSurvey>): Promise<EngineeringSurvey> => {
    const response = await apiClient.put<EngineeringSurvey>(`/projects/${projectId}/surveys/${surveyId}`, data);
    return response.data;
  },

  changeStatus: async (projectId: string, surveyId: string, status: SurveyStatus): Promise<EngineeringSurvey> => {
    const response = await apiClient.patch<EngineeringSurvey>(`/projects/${projectId}/surveys/${surveyId}/status`, { status });
    return response.data;
  },
};
