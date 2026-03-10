import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  Commitment,
  CostDashboard,
  CashFlowEntry,
  CostCode,
  CommitmentStatus,
  CashFlowScenario,
  CashFlowForecastBucket,
  VarianceSummary,
  ProfitabilityForecast,
  ProfitabilityPortfolio,
  ProfitabilitySnapshot,
} from '@/modules/costManagement/types';

export interface CommitmentFilters extends PaginationParams {
  status?: CommitmentStatus;
  projectId?: string;
  search?: string;
}

export const costManagementApi = {
  getCostDashboard: async (projectId?: string): Promise<CostDashboard> => {
    const response = await apiClient.get<CostDashboard>('/cost-management/dashboard', {
      params: projectId ? { projectId } : undefined,
    });
    return response.data;
  },

  getCommitments: async (params?: CommitmentFilters): Promise<PaginatedResponse<Commitment>> => {
    const response = await apiClient.get<PaginatedResponse<Commitment>>('/cost-management/commitments', { params });
    return response.data;
  },

  getCommitment: async (id: string): Promise<Commitment> => {
    const response = await apiClient.get<Commitment>(`/cost-management/commitments/${id}`);
    return response.data;
  },

  getCostCodes: async (projectId?: string): Promise<CostCode[]> => {
    const response = await apiClient.get<CostCode[]>('/cost-management/cost-codes', {
      params: projectId ? { projectId } : undefined,
    });
    return response.data;
  },

  getCostCode: async (id: string): Promise<CostCode> => {
    const response = await apiClient.get<CostCode>(`/cost-management/cost-codes/${id}`);
    return response.data;
  },

  createCommitment: async (data: Partial<Commitment>): Promise<Commitment> => {
    const response = await apiClient.post<Commitment>('/cost-management/commitments', data);
    return response.data;
  },

  updateCommitment: async (id: string, data: Partial<Commitment>): Promise<Commitment> => {
    const response = await apiClient.put<Commitment>(`/cost-management/commitments/${id}`, data);
    return response.data;
  },

  getCashFlow: async (projectId?: string): Promise<CashFlowEntry[]> => {
    const response = await apiClient.get<CashFlowEntry[]>('/cost-management/cash-flow', {
      params: projectId ? { projectId } : undefined,
    });
    return response.data;
  },

  // Cash Flow Forecast Scenarios
  getScenarios: async (params?: PaginationParams): Promise<PaginatedResponse<CashFlowScenario>> => {
    const response = await apiClient.get<PaginatedResponse<CashFlowScenario>>('/cost-management/cf-scenarios', { params });
    return response.data;
  },

  createScenario: async (data: Partial<CashFlowScenario>): Promise<CashFlowScenario> => {
    const response = await apiClient.post<CashFlowScenario>('/cost-management/cf-scenarios', data);
    return response.data;
  },

  updateScenario: async (id: string, data: Partial<CashFlowScenario>): Promise<CashFlowScenario> => {
    const response = await apiClient.put<CashFlowScenario>(`/cost-management/cf-scenarios/${id}`, data);
    return response.data;
  },

  deleteScenario: async (id: string): Promise<void> => {
    await apiClient.delete(`/cost-management/cf-scenarios/${id}`);
  },

  getForecastBuckets: async (scenarioId: string): Promise<CashFlowForecastBucket[]> => {
    const response = await apiClient.get<CashFlowForecastBucket[]>(`/cost-management/cf-scenarios/${scenarioId}/buckets`);
    return response.data;
  },

  getVarianceSummary: async (scenarioId: string): Promise<VarianceSummary> => {
    const response = await apiClient.get<VarianceSummary>(`/cost-management/cf-scenarios/${scenarioId}/variance`);
    return response.data;
  },

  generateForecast: async (scenarioId: string): Promise<void> => {
    await apiClient.post(`/cost-management/cash-flow-forecast/scenarios/${scenarioId}/generate`);
  },

  // Profitability
  getProfitabilityForecasts: async (params?: PaginationParams): Promise<PaginatedResponse<ProfitabilityForecast>> => {
    const response = await apiClient.get<PaginatedResponse<ProfitabilityForecast>>('/cost-management/profitability/forecasts', { params });
    return response.data;
  },

  getPortfolioSummary: async (): Promise<ProfitabilityPortfolio> => {
    const response = await apiClient.get<ProfitabilityPortfolio>('/cost-management/profitability/portfolio');
    return response.data;
  },

  getProfitabilitySnapshots: async (projectId: string): Promise<ProfitabilitySnapshot[]> => {
    const response = await apiClient.get<ProfitabilitySnapshot[]>(`/cost-management/profitability/snapshots/${projectId}`);
    return response.data;
  },

  recalculateProfitability: async (projectId: string): Promise<void> => {
    await apiClient.post(`/cost-management/profitability/recalculate/${projectId}`);
  },

  recalculateAllProfitability: async (): Promise<void> => {
    await apiClient.post('/cost-management/profitability/recalculate-all');
  },
};
