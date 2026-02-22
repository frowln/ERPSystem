import { apiClient } from './client';

export interface VolumeEntry {
  specItemId?: string;
  workDescription: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PipelinePreview {
  volumes: VolumeEntry[];
  estimatedTotal: number;
  lineCount: number;
  contractNumber?: string;
  projectName?: string;
}

export interface Ks2PipelineRequest {
  projectId: string;
  contractId: string;
  yearMonth: string; // "2026-02"
}

export const ks2PipelineApi = {
  getPreview: async (projectId: string, contractId: string, yearMonth: string): Promise<PipelinePreview> => {
    const response = await apiClient.get('/ks2-pipeline/preview', {
      params: { projectId, contractId, yearMonth },
    });
    return response.data.data ?? response.data;
  },

  getVolumes: async (projectId: string, yearMonth: string): Promise<VolumeEntry[]> => {
    const response = await apiClient.get('/ks2-pipeline/volumes', {
      params: { projectId, yearMonth },
    });
    return response.data.data ?? response.data;
  },

  generate: async (request: Ks2PipelineRequest): Promise<unknown> => {
    const response = await apiClient.post('/ks2-pipeline/generate', request);
    return response.data.data ?? response.data;
  },

  batchGenerate: async (projectId: string, yearMonth: string): Promise<unknown[]> => {
    const response = await apiClient.post('/ks2-pipeline/batch-generate', { projectId, yearMonth });
    return response.data.data ?? response.data;
  },
};
