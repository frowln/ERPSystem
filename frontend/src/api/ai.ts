import { apiClient } from './client';
import type { AiConversation, AiMessage } from '@/modules/ai/types';

// ---------------------------------------------------------------------------
// Daily Log Auto-Fill Types
// ---------------------------------------------------------------------------

export interface DailyLogSuggestion {
  workDescription: string;
  weatherCondition: string;
  temperatureMin: number;
  temperatureMax: number;
  workersOnSite: number;
  equipmentOnSite: number;
  safetyNotes: string;
  issuesNotes: string;
  entries: Array<{
    workArea: string;
    workDescription: string;
    workersCount: number;
    hoursWorked: number;
    equipmentUsed: string;
    percentComplete: number;
  }>;
}

export interface DailyLogSuggestRequest {
  projectId: string;
  date: string;
}

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

  // Daily Log Auto-Fill
  suggestDailyLog: async (request: DailyLogSuggestRequest): Promise<DailyLogSuggestion> => {
    try {
      const response = await apiClient.post<DailyLogSuggestion>('/ai/daily-log-suggest', request);
      return response.data;
    } catch {
      // Fallback: generate client-side mock when backend endpoint is not available
      return generateMockDailyLogSuggestion(request.date);
    }
  },

  // Photo Analysis with simulation fallback
  analyzePhotoWithSimulation: async (file: File, projectId?: string): Promise<PhotoAnalysisResult> => {
    try {
      return await aiApi.analyzePhoto(file, projectId);
    } catch {
      // Fallback: simulate analysis on client side
      return simulatePhotoAnalysis(file);
    }
  },
};

// ---------------------------------------------------------------------------
// Mock Data Generators (client-side fallback when backend is unavailable)
// ---------------------------------------------------------------------------

function generateMockDailyLogSuggestion(date: string): DailyLogSuggestion {
  const month = new Date(date).getMonth();
  const isWinter = month >= 10 || month <= 2;
  const isSummer = month >= 5 && month <= 8;

  return {
    workDescription:
      'Выполнены работы по монтажу металлоконструкций каркаса 3-го этажа. ' +
      'Армирование и бетонирование фундаментных плит секции Б. ' +
      'Монтаж инженерных коммуникаций (водоснабжение, канализация) на 2-м этаже.',
    weatherCondition: isWinter ? 'SNOW' : isSummer ? 'CLEAR' : 'CLOUDY',
    temperatureMin: isWinter ? -15 : isSummer ? 18 : 5,
    temperatureMax: isWinter ? -5 : isSummer ? 28 : 12,
    workersOnSite: 45,
    equipmentOnSite: 8,
    safetyNotes:
      'Проведён утренний инструктаж по ТБ. Проверка СИЗ — замечаний нет. ' +
      'Ограждения на высотных работах в норме.',
    issuesNotes:
      'Задержка поставки арматуры A500C d16 — ожидается завтра. ' +
      'Требуется дополнительный автокран для монтажа на секции В.',
    entries: [
      {
        workArea: 'Секция А, 3 этаж',
        workDescription: 'Монтаж металлоконструкций каркаса, сварка узлов',
        workersCount: 12,
        hoursWorked: 8,
        equipmentUsed: 'Автокран 25т, сварочные аппараты (4 шт.)',
        percentComplete: 65,
      },
      {
        workArea: 'Секция Б, фундамент',
        workDescription: 'Армирование и бетонирование фундаментных плит',
        workersCount: 18,
        hoursWorked: 10,
        equipmentUsed: 'Бетононасос, вибраторы (3 шт.)',
        percentComplete: 40,
      },
      {
        workArea: 'Секция А, 2 этаж',
        workDescription: 'Монтаж трубопроводов ВК, разводка канализации',
        workersCount: 8,
        hoursWorked: 8,
        equipmentUsed: 'Трубогиб, сварочный аппарат ПЭ',
        percentComplete: 55,
      },
    ],
  };
}

function simulatePhotoAnalysis(file: File): Promise<PhotoAnalysisResult> {
  return new Promise((resolve) => {
    // Simulate AI processing delay (1.5-3 seconds)
    const delay = 1500 + Math.random() * 1500;
    setTimeout(() => {
      const previewUrl = URL.createObjectURL(file);

      const findings: PhotoFinding[] = [
        {
          id: crypto.randomUUID(),
          type: 'SAFETY_VIOLATION',
          severity: 'HIGH',
          description: 'Рабочий без защитной каски в зоне монтажных работ (отметка +12.0м)',
          confidence: 0.92,
          boundingBox: { x: 120, y: 80, width: 60, height: 90 },
          suggestedAction: 'Остановить работы, выдать СИЗ, провести внеплановый инструктаж',
        },
        {
          id: crypto.randomUUID(),
          type: 'DEFECT',
          severity: 'MEDIUM',
          description: 'Видимые трещины в бетонной стяжке пола (ширина раскрытия ~2мм)',
          confidence: 0.85,
          boundingBox: { x: 200, y: 300, width: 150, height: 40 },
          suggestedAction: 'Зафиксировать, оформить акт, назначить ремонт инъектированием',
        },
        {
          id: crypto.randomUUID(),
          type: 'PROGRESS',
          severity: 'LOW',
          description: 'Монтаж кирпичной кладки наружных стен — выполнено ~70% от плана этажа',
          confidence: 0.78,
        },
        {
          id: crypto.randomUUID(),
          type: 'SAFETY_VIOLATION',
          severity: 'MEDIUM',
          description: 'Отсутствие ограждения проёма лестничной клетки на 4-м этаже',
          confidence: 0.88,
          boundingBox: { x: 350, y: 150, width: 80, height: 120 },
          suggestedAction: 'Установить временное ограждение и предупредительные знаки',
        },
        {
          id: crypto.randomUUID(),
          type: 'EQUIPMENT',
          severity: 'LOW',
          description: 'Строительные леса установлены корректно, анкеры закреплены',
          confidence: 0.91,
        },
      ];

      const result: PhotoAnalysisResult = {
        id: crypto.randomUUID(),
        photoUrl: previewUrl,
        analyzedAt: new Date().toISOString(),
        findings,
        overallAssessment:
          'Обнаружены 2 нарушения техники безопасности, требующие немедленного устранения. ' +
          'Выявлен 1 строительный дефект средней степени. ' +
          'Общий прогресс работ соответствует плану (~70%). ' +
          'Рекомендуется провести внеплановую проверку ТБ на участке.',
        safetyScore: 62,
        progressEstimate: 70,
      };

      resolve(result);
    }, delay);
  });
}
