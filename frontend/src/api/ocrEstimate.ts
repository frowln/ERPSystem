import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OcrTask {
  id: string;
  fileUrl: string;
  fileName: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  statusDisplayName: string;
  recognizedText?: string;
  recognizedFields?: string;
  confidence?: number;
  processedAt?: string;
  organizationId?: string;
  projectId?: string;
  documentType?: string;
  totalLinesDetected?: number;
  averageConfidence?: number;
  processingTimeMs?: number;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface OcrEstimateResult {
  id: string;
  ocrTaskId: string;
  lineNumber: number;
  rateCode?: string;
  name?: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  confidence: number;
  boundingBoxJson?: string;
  accepted: boolean;
  matchedRateId?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOcrTaskRequest {
  fileUrl: string;
  fileName: string;
  organizationId?: string;
  projectId?: string;
}

export interface AcceptOcrResultRequest {
  resultIds: string[];
}

export interface PaginatedOcrTasks {
  content: OcrTask[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const ocrEstimateApi = {
  // Tasks
  listTasks: async (params?: { projectId?: string; page?: number; size?: number }): Promise<PaginatedOcrTasks> => {
    const response = await apiClient.get<PaginatedOcrTasks>('/ocr/tasks', { params });
    return response.data;
  },

  getTask: async (id: string): Promise<OcrTask> => {
    const response = await apiClient.get<OcrTask>(`/ocr/tasks/${id}`);
    return response.data;
  },

  createTask: async (data: CreateOcrTaskRequest): Promise<OcrTask> => {
    const response = await apiClient.post<OcrTask>('/ocr/tasks', data);
    return response.data;
  },

  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/ocr/tasks/${id}`);
  },

  // Estimate processing
  processEstimate: async (taskId: string): Promise<OcrEstimateResult[]> => {
    const response = await apiClient.post<OcrEstimateResult[]>(`/ocr/tasks/${taskId}/process-estimate`);
    return response.data;
  },

  getEstimateResults: async (taskId: string): Promise<OcrEstimateResult[]> => {
    const response = await apiClient.get<OcrEstimateResult[]>(`/ocr/tasks/${taskId}/estimate-results`);
    return response.data;
  },

  acceptResults: async (data: AcceptOcrResultRequest): Promise<OcrEstimateResult[]> => {
    const response = await apiClient.post<OcrEstimateResult[]>('/ocr/estimate-results/accept', data);
    return response.data;
  },

  rejectResult: async (resultId: string): Promise<void> => {
    await apiClient.delete(`/ocr/estimate-results/${resultId}`);
  },
};
