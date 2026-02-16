import { apiClient } from './client';
import type {
  Budget,
  BudgetItem,
  Payment,
  Invoice,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export interface BudgetFilters extends PaginationParams {
  status?: string;
  projectId?: string;
  search?: string;
}

export interface CashFlowEntry {
  id: string;
  month: string;
  incoming: number;
  outgoing: number;
  net: number;
}

export interface CashFlowChartData {
  startBalance: number;
  monthlyData: {
    month: string;
    monthShort: string;
    inflow: number;
    outflow: number;
  }[];
}

export const financeApi = {
  getBudgets: async (params?: BudgetFilters): Promise<PaginatedResponse<Budget>> => {
    const response = await apiClient.get<PaginatedResponse<Budget>>('/budgets', { params });
    return response.data;
  },

  getBudget: async (id: string): Promise<Budget> => {
    const response = await apiClient.get<Budget>(`/budgets/${id}`);
    return response.data;
  },

  getBudgetItems: async (budgetId: string): Promise<BudgetItem[]> => {
    const response = await apiClient.get<BudgetItem[]>(`/budgets/${budgetId}/items`);
    return response.data;
  },

  getPayments: async (params?: PaginationParams): Promise<PaginatedResponse<Payment>> => {
    const response = await apiClient.get<PaginatedResponse<Payment>>('/payments', { params });
    return response.data;
  },

  getInvoices: async (params?: PaginationParams): Promise<PaginatedResponse<Invoice>> => {
    const response = await apiClient.get<PaginatedResponse<Invoice>>('/invoices', { params });
    return response.data;
  },

  createBudget: async (data: Partial<Budget>): Promise<Budget> => {
    const response = await apiClient.post<Budget>('/budgets', data);
    return response.data;
  },

  createPayment: async (data: Partial<Payment>): Promise<Payment> => {
    const response = await apiClient.post<Payment>('/payments', data);
    return response.data;
  },

  createInvoice: async (data: Partial<Invoice>): Promise<Invoice> => {
    const response = await apiClient.post<Invoice>('/invoices', data);
    return response.data;
  },

  getInvoice: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get<Invoice>(`/invoices/${id}`);
    return response.data;
  },

  getPayment: async (id: string): Promise<Payment> => {
    const response = await apiClient.get<Payment>(`/payments/${id}`);
    return response.data;
  },

  getCashFlow: async (): Promise<CashFlowEntry[]> => {
    const response = await apiClient.get<CashFlowEntry[]>('/cash-flow');
    return response.data;
  },

  getCashFlowChart: async (): Promise<CashFlowChartData> => {
    const response = await apiClient.get<CashFlowChartData>('/cash-flow/chart');
    return response.data;
  },
};
