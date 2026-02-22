import { apiClient } from './client';
import type { AiConversation, AiMessage } from '@/modules/ai/types';

// ---------------------------------------------------------------------------
// Photo Analysis Types
// ---------------------------------------------------------------------------

export interface PhotoFinding {
  id: string;
  type: 'SAFETY_VIOLATION' | 'DEFECT' | 'PROGRESS' | 'WEATHER' | 'EQUIPMENT';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  suggestedAction?: string;
}

export interface PhotoAnalysisResult {
  id: string;
  photoUrl: string;
  analyzedAt: string;
  findings: PhotoFinding[];
  overallAssessment: string;
  safetyScore: number;
  progressEstimate: number;
}

// ---------------------------------------------------------------------------
// Risk Prediction Types
// ---------------------------------------------------------------------------

export interface RiskFactor {
  id: string;
  name: string;
  category: 'SCHEDULE' | 'COST' | 'SAFETY' | 'QUALITY' | 'RESOURCE';
  probability: number;
  impact: number;
  riskScore: number;
  mitigationStatus: 'NONE' | 'PLANNED' | 'IN_PROGRESS' | 'RESOLVED';
  suggestedMitigation: string;
}

export interface RiskPrediction {
  id: string;
  projectId: string;
  predictedAt: string;
  overallScore: number;
  scheduleRisk: number;
  costRisk: number;
  safetyRisk: number;
  factors: RiskFactor[];
}

// ---------------------------------------------------------------------------
// Model Config Types
// ---------------------------------------------------------------------------

export type AiProvider = 'YANDEX_GPT' | 'GIGACHAT' | 'SELF_HOSTED' | 'OPENAI';

export interface AiModelConfig {
  id: string;
  organizationId: string;
  provider: AiProvider;
  providerDisplayName: string;
  apiUrl: string | null;
  modelName: string;
  maxTokens: number;
  temperature: number;
  isActive: boolean;
  isDefault: boolean;
  dataProcessingAgreementSigned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAiModelConfigRequest {
  provider: AiProvider;
  apiUrl?: string;
  apiKeyEncrypted?: string;
  modelName: string;
  maxTokens?: number;
  temperature?: number;
  isDefault?: boolean;
  dataProcessingAgreementSigned?: boolean;
}

// ---------------------------------------------------------------------------
// Usage Types
// ---------------------------------------------------------------------------

export interface AiUsageSummary {
  totalConversations: number;
  totalTokens: number;
  totalCostRub: number;
  avgResponseTimeMs: number;
}

export interface AiUsageLogEntry {
  id: string;
  userId: string;
  conversationId: string | null;
  modelConfigId: string | null;
  feature: string;
  tokensInput: number;
  tokensOutput: number;
  cost: number;
  costRub: number;
  responseTimeMs: number | null;
  wasSuccessful: boolean;
  errorMessage: string | null;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const aiApi = {
  // Conversations
  getConversations: async (): Promise<AiConversation[]> => {
    const response = await apiClient.get<AiConversation[]>('/ai/conversations');
    return response.data;
  },

  getConversation: async (id: string): Promise<AiConversation> => {
    const response = await apiClient.get<AiConversation>(`/ai/conversations/${id}`);
    return response.data;
  },

  createConversation: async (title?: string): Promise<AiConversation> => {
    const response = await apiClient.post<AiConversation>('/ai/conversations', { title });
    return response.data;
  },

  updateConversationTitle: async (id: string, title: string): Promise<AiConversation> => {
    const response = await apiClient.patch<AiConversation>(`/ai/conversations/${id}`, { title });
    return response.data;
  },

  deleteConversation: async (id: string): Promise<void> => {
    await apiClient.delete(`/ai/conversations/${id}`);
  },

  getMessages: async (conversationId: string): Promise<AiMessage[]> => {
    const response = await apiClient.get<AiMessage[]>(`/ai/conversations/${conversationId}/messages`);
    return response.data;
  },

  sendMessage: async (conversationId: string, content: string): Promise<AiMessage> => {
    const response = await apiClient.post<AiMessage>(`/ai/conversations/${conversationId}/messages`, { content });
    return response.data;
  },

  // Photo Analysis
  analyzePhoto: async (file: File, projectId?: string): Promise<PhotoAnalysisResult> => {
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) {
      formData.append('projectId', projectId);
    }
    const response = await apiClient.post<PhotoAnalysisResult>('/ai/photos/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getPhotoAnalyses: async (): Promise<PhotoAnalysisResult[]> => {
    const response = await apiClient.get<PhotoAnalysisResult[]>('/ai/photos/analyses');
    return response.data;
  },

  // Risk Predictions
  getRiskPrediction: async (projectId?: string): Promise<RiskPrediction> => {
    const params = projectId ? { projectId } : {};
    const response = await apiClient.get<RiskPrediction>('/ai/risk-predictions', { params });
    return response.data;
  },

  getRiskFactors: async (projectId?: string): Promise<RiskFactor[]> => {
    const params = projectId ? { projectId } : {};
    const response = await apiClient.get<RiskFactor[]>('/ai/risk-predictions/factors', { params });
    return response.data;
  },

  // Model Configs
  getModelConfigs: async (page = 0, size = 20): Promise<PageResponse<AiModelConfig>> => {
    const response = await apiClient.get<{ data: PageResponse<AiModelConfig> }>('/ai/assistant/model-configs', {
      params: { page, size },
    });
    return response.data.data;
  },

  getDefaultModelConfig: async (): Promise<AiModelConfig> => {
    const response = await apiClient.get<{ data: AiModelConfig }>('/ai/assistant/model-configs/default');
    return response.data.data;
  },

  createModelConfig: async (request: CreateAiModelConfigRequest): Promise<AiModelConfig> => {
    const response = await apiClient.post<{ data: AiModelConfig }>('/ai/assistant/model-configs', request);
    return response.data.data;
  },

  updateModelConfig: async (id: string, request: CreateAiModelConfigRequest): Promise<AiModelConfig> => {
    const response = await apiClient.put<{ data: AiModelConfig }>(`/ai/assistant/model-configs/${id}`, request);
    return response.data.data;
  },

  deleteModelConfig: async (id: string): Promise<void> => {
    await apiClient.delete(`/ai/assistant/model-configs/${id}`);
  },

  // Usage Analytics
  getUsageSummary: async (from: string, to: string): Promise<AiUsageSummary> => {
    const response = await apiClient.get<{ data: AiUsageSummary }>('/ai/assistant/usage', {
      params: { from, to },
    });
    return response.data.data;
  },

  getUsageLogs: async (from?: string, to?: string, page = 0, size = 50): Promise<PageResponse<AiUsageLogEntry>> => {
    const response = await apiClient.get<{ data: PageResponse<AiUsageLogEntry> }>('/ai/assistant/usage/logs', {
      params: { from, to, page, size },
    });
    return response.data.data;
  },
};
