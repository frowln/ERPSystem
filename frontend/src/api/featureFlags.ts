import { apiClient } from './client';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  organizationScoped: boolean;
  createdAt: string;
  updatedAt: string;
}

export const featureFlagApi = {
  getAll: async (): Promise<FeatureFlag[]> => {
    const response = await apiClient.get<FeatureFlag[]>('/feature-flags');
    return response.data;
  },

  check: async (key: string): Promise<{ enabled: boolean }> => {
    const response = await apiClient.get<{ enabled: boolean }>('/feature-flags/check', {
      params: { key },
    });
    return response.data;
  },

  setEnabled: async (key: string, enabled: boolean): Promise<FeatureFlag> => {
    const response = await apiClient.put<FeatureFlag>(`/feature-flags/${key}`, { enabled });
    return response.data;
  },
};
