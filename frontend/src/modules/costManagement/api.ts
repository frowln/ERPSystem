import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { Commitment, CostCode, BudgetSummary } from './types';

export interface CommitmentFilters extends PaginationParams {
  projectId: string;
  status?: string;
}

export interface CostCodeFilters extends PaginationParams {
  projectId: string;
}

export interface BudgetLineFilters extends PaginationParams {
  projectId: string;
}

export interface BudgetLine {
  id: string;
  projectId: string;
  costCodeId?: string;
  name: string;
  originalBudget: number;
  revisedBudget: number;
  actualCost: number;
  variance: number;
  createdAt: string;
}

export const costManagementApi = {
  // ---- Commitments ----

  getCommitments: async (params: CommitmentFilters): Promise<PaginatedResponse<Commitment>> => {
    const response = await apiClient.get<PaginatedResponse<Commitment>>('/commitments', { params });
    return response.data;
  },

  getCommitmentById: async (id: string): Promise<Commitment> => {
    const response = await apiClient.get<Commitment>(`/commitments/${id}`);
    return response.data;
  },

  createCommitment: async (data: Partial<Commitment>): Promise<Commitment> => {
    const response = await apiClient.post<Commitment>('/commitments', data);
    return response.data;
  },

  updateCommitment: async (id: string, data: Partial<Commitment>): Promise<Commitment> => {
    const response = await apiClient.put<Commitment>(`/commitments/${id}`, data);
    return response.data;
  },

  changeCommitmentStatus: async (id: string, data: { status: string }): Promise<Commitment> => {
    const response = await apiClient.patch<Commitment>(`/commitments/${id}/status`, data);
    return response.data;
  },

  addChangeOrder: async (id: string, amount: number): Promise<Commitment> => {
    const response = await apiClient.post<Commitment>(`/commitments/${id}/change-orders`, null, { params: { amount } });
    return response.data;
  },

  getCommitmentItems: async (id: string): Promise<unknown[]> => {
    const response = await apiClient.get(`/commitments/${id}/items`);
    return response.data;
  },

  addCommitmentItem: async (id: string, data: unknown): Promise<unknown> => {
    const response = await apiClient.post(`/commitments/${id}/items`, data);
    return response.data;
  },

  deleteCommitmentItem: async (itemId: string): Promise<void> => {
    await apiClient.delete(`/commitments/items/${itemId}`);
  },

  deleteCommitment: async (id: string): Promise<void> => {
    await apiClient.delete(`/commitments/${id}`);
  },

  // ---- Cost Codes ----

  getCostCodes: async (params: CostCodeFilters): Promise<PaginatedResponse<CostCode>> => {
    const response = await apiClient.get<PaginatedResponse<CostCode>>('/cost-codes', { params });
    return response.data;
  },

  getAllCostCodes: async (projectId: string): Promise<CostCode[]> => {
    const response = await apiClient.get<CostCode[]>('/cost-codes/all', { params: { projectId } });
    return response.data;
  },

  getCostCodeById: async (id: string): Promise<CostCode> => {
    const response = await apiClient.get<CostCode>(`/cost-codes/${id}`);
    return response.data;
  },

  getCostCodeChildren: async (id: string): Promise<CostCode[]> => {
    const response = await apiClient.get<CostCode[]>(`/cost-codes/${id}/children`);
    return response.data;
  },

  createCostCode: async (data: Partial<CostCode>): Promise<CostCode> => {
    const response = await apiClient.post<CostCode>('/cost-codes', data);
    return response.data;
  },

  updateCostCode: async (id: string, data: Partial<CostCode>): Promise<CostCode> => {
    const response = await apiClient.put<CostCode>(`/cost-codes/${id}`, data);
    return response.data;
  },

  deleteCostCode: async (id: string): Promise<void> => {
    await apiClient.delete(`/cost-codes/${id}`);
  },

  // ---- Budget Lines ----

  getBudgetLines: async (params: BudgetLineFilters): Promise<PaginatedResponse<BudgetLine>> => {
    const response = await apiClient.get<PaginatedResponse<BudgetLine>>('/budget-lines', { params });
    return response.data;
  },

  getAllBudgetLines: async (projectId: string): Promise<BudgetLine[]> => {
    const response = await apiClient.get<BudgetLine[]>('/budget-lines/all', { params: { projectId } });
    return response.data;
  },

  getBudgetLineById: async (id: string): Promise<BudgetLine> => {
    const response = await apiClient.get<BudgetLine>(`/budget-lines/${id}`);
    return response.data;
  },

  createBudgetLine: async (data: Partial<BudgetLine>): Promise<BudgetLine> => {
    const response = await apiClient.post<BudgetLine>('/budget-lines', data);
    return response.data;
  },

  updateBudgetLine: async (id: string, data: Partial<BudgetLine>): Promise<BudgetLine> => {
    const response = await apiClient.put<BudgetLine>(`/budget-lines/${id}`, data);
    return response.data;
  },

  deleteBudgetLine: async (id: string): Promise<void> => {
    await apiClient.delete(`/budget-lines/${id}`);
  },

  // ---- Budget Summary ----

  getTotalOriginalBudget: async (projectId: string): Promise<number> => {
    const response = await apiClient.get<number>('/budget-lines/summary/original-budget', { params: { projectId } });
    return response.data;
  },

  getTotalRevisedBudget: async (projectId: string): Promise<number> => {
    const response = await apiClient.get<number>('/budget-lines/summary/revised-budget', { params: { projectId } });
    return response.data;
  },

  getTotalActualCost: async (projectId: string): Promise<number> => {
    const response = await apiClient.get<number>('/budget-lines/summary/actual-cost', { params: { projectId } });
    return response.data;
  },

  getTotalVariance: async (projectId: string): Promise<number> => {
    const response = await apiClient.get<number>('/budget-lines/summary/variance', { params: { projectId } });
    return response.data;
  },

  // ---- Cost Forecasts ----

  getCostForecasts: async (params?: PaginationParams & { projectId?: string }): Promise<PaginatedResponse<unknown>> => {
    const response = await apiClient.get('/cost-forecasts', { params });
    return response.data;
  },

  // ---- Cash Flow Projections ----

  getCashFlowProjections: async (params?: PaginationParams & { projectId?: string }): Promise<PaginatedResponse<unknown>> => {
    const response = await apiClient.get('/cash-flow-projections', { params });
    return response.data;
  },
};
