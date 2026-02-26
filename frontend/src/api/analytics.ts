import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { KpiItem } from '@/modules/analytics/types';

export interface AuditLogEntry extends Record<string, unknown> {
  [key: string]: unknown;
  id: string;
  module: string;
  action_type: string;
  count: number;
  userName: string;
  timestamp: string;
}

export interface ProjectBudgetSummary {
  name: string;
  budget: number;
  actual: number;
}

export interface ProgressPoint {
  month: string;
  planned: number;
  actual: number;
}

export interface BudgetCategory {
  name: string;
  amount: number;
  color: string;
}

export interface ProjectStatusSummary {
  status: string;
  label: string;
  count: number;
  color: string;
}

export interface FinancialBar {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
}

export interface SafetyMetric {
  month: string;
  incidents: number;
  nearMisses: number;
  inspections: number;
  daysWithoutIncident: number;
}

export interface TaskBurndown {
  date: string;
  planned: number;
  actual: number;
  ideal: number;
}

export interface ProcurementSpend {
  category: string;
  planned: number;
  actual: number;
}

export interface WarehouseStockLevel {
  category: string;
  label: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  value: number;
}

export interface AnalyticsDashboardData {
  projectStatusSummary: ProjectStatusSummary[];
  financialBars: FinancialBar[];
  safetyMetrics: SafetyMetric[];
  taskBurndown: TaskBurndown[];
  procurementSpend: ProcurementSpend[];
  warehouseStockLevels: WarehouseStockLevel[];
}

export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  projectId?: string;
}

export const analyticsApi = {
  getDashboardData: async (params?: AnalyticsFilters): Promise<AnalyticsDashboardData> => {
    const response = await apiClient.get<AnalyticsDashboardData>('/analytics/dashboard', { params });
    return response.data;
  },

  getProjectStatusSummary: async (): Promise<ProjectStatusSummary[]> => {
    const response = await apiClient.get<ProjectStatusSummary[]>('/analytics/project-status');
    return response.data;
  },

  getFinancialBars: async (params?: AnalyticsFilters): Promise<FinancialBar[]> => {
    const response = await apiClient.get<FinancialBar[]>('/analytics/financial', { params });
    return response.data;
  },

  getSafetyMetrics: async (params?: AnalyticsFilters): Promise<SafetyMetric[]> => {
    const response = await apiClient.get<SafetyMetric[]>('/analytics/safety', { params });
    return response.data;
  },

  getTaskBurndown: async (projectId: string): Promise<TaskBurndown[]> => {
    const response = await apiClient.get<TaskBurndown[]>(`/analytics/task-burndown/${projectId}`);
    return response.data;
  },

  getProcurementSpend: async (params?: AnalyticsFilters): Promise<ProcurementSpend[]> => {
    const response = await apiClient.get<ProcurementSpend[]>('/analytics/procurement-spend', { params });
    return response.data;
  },

  getWarehouseStockLevels: async (): Promise<WarehouseStockLevel[]> => {
    const response = await apiClient.get<WarehouseStockLevel[]>('/analytics/warehouse-stock');
    return response.data;
  },

  exportReport: async (type: string, params?: AnalyticsFilters): Promise<Blob> => {
    const response = await apiClient.get(`/analytics/export/${type}`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // KPI definitions
  getKpis: async (params?: AnalyticsFilters): Promise<KpiItem[]> => {
    const response = await apiClient.get<KpiItem[]>('/analytics/kpis', { params });
    return response.data;
  },

  // Audit log
  getAuditLog: async (params?: PaginationParams & { module?: string; actionType?: string; dateFrom?: string; dateTo?: string }): Promise<PaginatedResponse<AuditLogEntry>> => {
    const response = await apiClient.get<PaginatedResponse<AuditLogEntry>>('/analytics/audit-log', { params });
    return response.data;
  },

  // Project budget summaries
  getProjectBudgets: async (params?: AnalyticsFilters): Promise<ProjectBudgetSummary[]> => {
    const response = await apiClient.get<ProjectBudgetSummary[]>('/analytics/project-budgets', { params });
    return response.data;
  },

  // Cumulative progress
  getProgressData: async (params?: AnalyticsFilters): Promise<ProgressPoint[]> => {
    const response = await apiClient.get<ProgressPoint[]>('/analytics/progress', { params });
    return response.data;
  },

  // Budget by category
  getBudgetCategories: async (params?: AnalyticsFilters): Promise<BudgetCategory[]> => {
    const response = await apiClient.get<BudgetCategory[]>('/analytics/budget-categories', { params });
    return response.data;
  },
};
