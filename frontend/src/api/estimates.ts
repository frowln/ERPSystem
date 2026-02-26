import { apiClient } from './client';
import type {
  Estimate,
  EstimateItem,
  EstimateStatus,
  LocalEstimate,
  LocalEstimateLine,
  FmReconciliationItem,
  PaginatedResponse,
  PaginationParams,
} from '@/types';
import type {
  ImportFormat,
  ImportHistory,
  ExportValidation,
  ExportConfig,
  ExportHistory,
  VolumeWorkType,
  VolumeCalculation,
  EstimateComparison,
  MinstroyIndex,
  MinstroyApplyResult,
  SummaryEstimate,
} from '@/modules/estimates/types';

export interface EstimateFilters extends PaginationParams {
  status?: EstimateStatus;
  projectId?: string;
  search?: string;
}

export interface EstimateFinancialSummary {
  totalPlanned: number;
  totalOrdered: number;
  totalInvoiced: number;
  totalSpent: number;
  balance: number;
  executionPercent: number;
}

export const estimatesApi = {
  getEstimates: async (params?: EstimateFilters): Promise<PaginatedResponse<Estimate>> => {
    const response = await apiClient.get<PaginatedResponse<Estimate>>('/estimates', { params });
    return response.data;
  },

  getEstimate: async (id: string): Promise<Estimate> => {
    const response = await apiClient.get<Estimate>(`/estimates/${id}`);
    return response.data;
  },

  getEstimateItems: async (estimateId: string): Promise<EstimateItem[]> => {
    const response = await apiClient.get<EstimateItem[]>(`/estimates/${estimateId}/items`);
    return response.data;
  },

  getEstimateFinancialSummary: async (estimateId: string): Promise<EstimateFinancialSummary> => {
    const response = await apiClient.get<EstimateFinancialSummary>(`/estimates/${estimateId}/financial-summary`);
    return response.data;
  },

  createEstimateFromSpec: async (data: { specificationId: string; name?: string; contractId?: string; notes?: string }): Promise<Estimate> => {
    const response = await apiClient.post<Estimate>('/estimates/from-spec', data);
    return response.data;
  },

  updateEstimate: async (id: string, data: Partial<Estimate>): Promise<Estimate> => {
    const response = await apiClient.put<Estimate>(`/estimates/${id}`, data);
    return response.data;
  },

  // === Local Estimates (normative-based) ===

  getLocalEstimates: async (params?: { projectId?: string; status?: string; page?: number; size?: number }): Promise<PaginatedResponse<LocalEstimate>> => {
    const response = await apiClient.get<PaginatedResponse<LocalEstimate>>('/estimates/local', { params });
    return response.data;
  },

  getLocalEstimate: async (id: string): Promise<{ estimate: LocalEstimate; lines: LocalEstimateLine[] }> => {
    const response = await apiClient.get<{ estimate?: LocalEstimate; lines: LocalEstimateLine[] } & LocalEstimate>(`/estimates/local/${id}`);
    const lines = response.data.lines ?? [];
    const estimate = response.data.estimate ?? response.data as LocalEstimate;
    return { estimate, lines };
  },

  getLocalEstimateRaw: async (id: string): Promise<{ estimate?: LocalEstimate; lines: LocalEstimateLine[] } & LocalEstimate> => {
    const response = await apiClient.get<{ estimate?: LocalEstimate; lines: LocalEstimateLine[] } & LocalEstimate>(`/estimates/local/${id}`);
    return response.data;
  },

  getLocalEstimateList: async (params?: { projectId?: string; status?: string; page?: number; size?: number }): Promise<PaginatedResponse<LocalEstimate>> => {
    const response = await apiClient.get<PaginatedResponse<LocalEstimate>>('/estimates/local', { params });
    return response.data;
  },

  calculateLocalEstimate: async (id: string): Promise<{ estimate: LocalEstimate; lines: LocalEstimateLine[] }> => {
    const response = await apiClient.post<{ estimate?: LocalEstimate; lines: LocalEstimateLine[] } & LocalEstimate>(`/estimates/local/${id}/calculate`);
    const lines = response.data.lines ?? [];
    const estimate = response.data.estimate ?? response.data as LocalEstimate;
    return { estimate, lines };
  },

  getFmReconciliation: async (estimateId: string, budgetId: string): Promise<FmReconciliationItem[]> => {
    const response = await apiClient.get<FmReconciliationItem[]>(`/estimates/local/${estimateId}/fm-reconciliation`, {
      params: { budgetId },
    });
    return response.data;
  },

  // === Import (GRAND-Smeta formats) ===

  importEstimate: async (file: File, format: ImportFormat): Promise<ImportHistory> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);
    const response = await apiClient.post<ImportHistory>('/estimates/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getImportHistory: async (): Promise<ImportHistory[]> => {
    const response = await apiClient.get<ImportHistory[]>('/estimates/import/history');
    return response.data;
  },

  // === Export for GGE ===

  validateForExport: async (estimateId: string): Promise<ExportValidation> => {
    const response = await apiClient.get<ExportValidation>(`/estimates/${estimateId}/export/validate`);
    return response.data;
  },

  exportEstimate: async (estimateId: string, config: ExportConfig): Promise<Blob> => {
    const response = await apiClient.post(`/estimates/${estimateId}/export`, config, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  getExportHistory: async (): Promise<ExportHistory[]> => {
    const response = await apiClient.get<ExportHistory[]>('/estimates/export/history');
    return response.data;
  },

  // === Volume Calculator ===

  calculateVolume: async (workType: VolumeWorkType, params: Record<string, number>): Promise<VolumeCalculation> => {
    const response = await apiClient.post<VolumeCalculation>('/estimates/volume/calculate', { workType, params });
    return response.data;
  },

  saveCalculation: async (calculation: VolumeCalculation): Promise<VolumeCalculation> => {
    const response = await apiClient.post<VolumeCalculation>('/estimates/volume/save', calculation);
    return response.data;
  },

  getSavedCalculations: async (): Promise<VolumeCalculation[]> => {
    const response = await apiClient.get<VolumeCalculation[]>('/estimates/volume/calculations');
    return response.data;
  },

  // === Comparison (Plan vs Fact) ===

  getComparison: async (estimateId: string): Promise<EstimateComparison> => {
    const response = await apiClient.get<EstimateComparison>(`/estimates/${estimateId}/comparison`);
    return response.data;
  },

  // === Minstroy Indices ===

  getMinstroyIndices: async (region: string, quarter: number, year: number): Promise<MinstroyIndex[]> => {
    const response = await apiClient.get<MinstroyIndex[]>('/estimates/local/minstroy/indices', {
      params: { region, quarter, year },
    });
    return response.data;
  },

  applyIndices: async (estimateId: string, indices: MinstroyIndex[]): Promise<MinstroyApplyResult> => {
    const response = await apiClient.post<MinstroyApplyResult>(`/estimates/local/${estimateId}/minstroy/apply`, { indices });
    return response.data;
  },

  // === Summary Estimate Report ===

  getSummaryEstimate: async (projectId: string): Promise<SummaryEstimate> => {
    const response = await apiClient.get<SummaryEstimate>(`/estimates/summary/${projectId}`);
    return response.data;
  },
};
