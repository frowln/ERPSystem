import { apiClient } from './client';

export type QualityGateStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'PASSED' | 'FAILED';

export interface QualityGate {
  id: string;
  wbsNodeId: string;
  wbsNodeName?: string;
  projectId: string;
  projectName?: string;
  name: string;
  description?: string;
  requiredDocuments: string[];
  requiredQualityChecks: string[];
  volumeThresholdPercent: number;
  status: QualityGateStatus;
  docCompletionPercent: number;
  qualityCompletionPercent: number;
  volumeCompletionPercent: number;
  blockedReason?: string;
  passedAt?: string;
  passedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualityGateTemplate {
  id: string;
  name: string;
  description?: string;
  wbsLevelPattern: string;
  requiredDocuments: string[];
  requiredQualityChecks: string[];
  volumeThresholdPercent: number;
  createdAt: string;
}

export interface CreateQualityGateRequest {
  wbsNodeId: string;
  projectId: string;
  name: string;
  description?: string;
  requiredDocuments: string[];
  requiredQualityChecks: string[];
  volumeThresholdPercent: number;
}

export interface UpdateQualityGateRequest {
  name?: string;
  description?: string;
  requiredDocuments?: string[];
  requiredQualityChecks?: string[];
  volumeThresholdPercent?: number;
}

export interface ApplyTemplateRequest {
  projectId: string;
  templateId: string;
}

export interface ProgressionCheckResponse {
  wbsNodeId: string;
  allowed: boolean;
  blockedGates: { gateId: string; gateName: string; status: QualityGateStatus; reason?: string }[];
}

export const qualityGatesApi = {
  getForProject: async (projectId: string): Promise<QualityGate[]> => {
    const response = await apiClient.get<QualityGate[]>(`/quality/gates/project/${projectId}`);
    return response.data;
  },

  getDetail: async (id: string): Promise<QualityGate> => {
    const response = await apiClient.get<QualityGate>(`/quality/gates/${id}`);
    return response.data;
  },

  evaluate: async (id: string): Promise<QualityGate> => {
    const response = await apiClient.post<QualityGate>(`/quality/gates/evaluate/${id}`);
    return response.data;
  },

  evaluateProject: async (projectId: string): Promise<QualityGate[]> => {
    const response = await apiClient.post<QualityGate[]>(`/quality/gates/evaluate/project/${projectId}`);
    return response.data;
  },

  applyTemplate: async (data: ApplyTemplateRequest): Promise<QualityGate[]> => {
    const response = await apiClient.post<QualityGate[]>('/quality/gates/apply-template', data);
    return response.data;
  },

  create: async (data: CreateQualityGateRequest): Promise<QualityGate> => {
    const response = await apiClient.post<QualityGate>('/quality/gates', data);
    return response.data;
  },

  update: async (id: string, data: UpdateQualityGateRequest): Promise<QualityGate> => {
    const response = await apiClient.put<QualityGate>(`/quality/gates/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/quality/gates/${id}`);
  },

  checkProgression: async (wbsNodeId: string): Promise<ProgressionCheckResponse> => {
    const response = await apiClient.get<ProgressionCheckResponse>(`/quality/gates/check-progression/${wbsNodeId}`);
    return response.data;
  },

  getTemplates: async (): Promise<QualityGateTemplate[]> => {
    const response = await apiClient.get<QualityGateTemplate[]>('/quality/gates/templates');
    return response.data;
  },
};
