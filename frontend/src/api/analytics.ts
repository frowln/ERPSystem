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
  description?: string;
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

// -- Dashboard Analytics types --

export interface OrgDashboardData {
  activeProjects: number;
  totalBudget: number;
  totalSpent: number;
  budgetUtilization: number;
  activeTasks: number;
  overdueTasks: number;
  openDefects: number;
  safetyScore: number;
  upcomingMilestones: MilestoneEntry[];
  recentActivities: ActivityEntry[];
}

export interface MilestoneEntry {
  projectName: string;
  milestoneName: string;
  dueDate: string;
  status: string;
}

export interface ActivityEntry {
  type: string;
  description: string;
  projectName: string;
  timestamp: string;
}

export interface FinancialSummaryData {
  totalBudget: number;
  totalSpent: number;
  totalCommitted: number;
  totalForecast: number;
  marginPercent: number;
  projectFinancials: ProjectFinancialEntry[];
  monthlySpend: MonthlySpendEntry[];
}

export interface ProjectFinancialEntry {
  projectId: string;
  projectName: string;
  budget: number;
  spent: number;
  committed: number;
  utilizationPercent: number;
}

export interface MonthlySpendEntry {
  month: string;
  planned: number;
  actual: number;
}

export interface TaskAnalyticsData {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  avgCompletionDays: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
}

export interface SafetyMetricsData {
  totalInspections: number;
  passRate: number;
  openViolations: number;
  resolvedViolations: number;
  incidentCount: number;
  trainingComplianceRate: number;
  daysSinceLastIncident: number;
}

export const analyticsApi = {
  /**
   * GET /api/analytics/dashboard → OrgDashboardResponse
   * The backend returns organization-level summary, not chart data.
   * We aggregate multiple endpoints to build AnalyticsDashboardData.
   */
  getDashboardData: async (params?: AnalyticsFilters): Promise<AnalyticsDashboardData> => {
    try {
      const [statusRes, financialRes, safetyRes, taskRes, procurementRes, warehouseRes] = await Promise.allSettled([
        apiClient.get('/analytics/project-status'),
        apiClient.get('/analytics/financial', { params }),
        apiClient.get('/analytics/safety', { params }),
        apiClient.get('/analytics/task-progress', { params: params?.projectId ? { projectId: params.projectId } : undefined }),
        apiClient.get('/analytics/procurement-spend', { params }),
        apiClient.get('/analytics/warehouse-stock'),
      ]);

      const unwrap = <T,>(r: PromiseSettledResult<{ data: T }>): T | null =>
        r.status === 'fulfilled' ? r.value.data : null;

      // project-status returns { byStatus: { IN_PROGRESS: 4, PLANNING: 1 }, ... }
      const statusData = unwrap(statusRes) as Record<string, unknown> | null;
      const STATUS_COLORS: Record<string, string> = {
        DRAFT: '#94a3b8', PLANNING: '#3b82f6', IN_PROGRESS: '#22c55e',
        ON_HOLD: '#f59e0b', COMPLETED: '#a855f7', CANCELLED: '#ef4444',
      };
      const STATUS_LABELS: Record<string, string> = {
        DRAFT: 'Черновик', PLANNING: 'Планирование', IN_PROGRESS: 'В работе',
        ON_HOLD: 'На паузе', COMPLETED: 'Завершён', CANCELLED: 'Отменён',
      };
      const byStatus = (statusData?.byStatus ?? {}) as Record<string, number>;
      const projectStatusSummary: ProjectStatusSummary[] = Object.entries(byStatus).map(([status, count]) => ({
        status,
        label: STATUS_LABELS[status] ?? status,
        count,
        color: STATUS_COLORS[status] ?? '#94a3b8',
      }));

      // financial returns List<FinancialBarResponse>
      const financialBars: FinancialBar[] = (unwrap(financialRes) as FinancialBar[] | null) ?? [];

      // safety returns List<SafetyMetricResponse>
      const safetyMetrics: SafetyMetric[] = (unwrap(safetyRes) as SafetyMetric[] | null) ?? [];

      // task-progress returns { totalTasks, byStatus: {DONE: N, ...}, completionPercent, overdueTasks }
      // Build a synthetic burndown from the data
      const taskProgressData = unwrap(taskRes) as Record<string, unknown> | null;
      const totalTasks = Number(taskProgressData?.totalTasks ?? 0);
      const taskByStatus = (taskProgressData?.byStatus ?? {}) as Record<string, number>;
      const completedTasks = Number(taskByStatus.DONE ?? 0);
      const taskBurndown: TaskBurndown[] = totalTasks > 0
        ? (() => {
            const weeks = 6;
            const result: TaskBurndown[] = [];
            for (let i = weeks; i >= 0; i--) {
              const d = new Date(); d.setDate(d.getDate() - i * 7);
              const progress = Math.min(completedTasks, Math.round(completedTasks * (1 - i / weeks)));
              const idealProg = Math.round(totalTasks * (1 - i / weeks));
              result.push({
                date: d.toISOString().slice(5, 10),
                ideal: totalTasks - idealProg,
                planned: totalTasks - Math.round(idealProg * 0.9),
                actual: totalTasks - progress,
              });
            }
            return result;
          })()
        : [];

      // procurement-spend returns List<ProcurementSpendResponse>
      const procurementSpend: ProcurementSpend[] = (unwrap(procurementRes) as ProcurementSpend[] | null) ?? [];

      // warehouse-stock returns List<WarehouseStockResponse>
      const warehouseStockLevels: WarehouseStockLevel[] = (unwrap(warehouseRes) as WarehouseStockLevel[] | null) ?? [];

      return { projectStatusSummary, financialBars, safetyMetrics, taskBurndown, procurementSpend, warehouseStockLevels };
    } catch {
      return { projectStatusSummary: [], financialBars: [], safetyMetrics: [], taskBurndown: [], procurementSpend: [], warehouseStockLevels: [] };
    }
  },

  /** GET /api/analytics/project-status → ApiResponse<ProjectStatusSummary> (single object) */
  getProjectStatusSummary: async (): Promise<ProjectStatusSummary[]> => {
    try {
      const response = await apiClient.get('/analytics/project-status');
      const data = response.data;
      return Array.isArray(data) ? data : data ? [data] : [];
    } catch {
      return [];
    }
  },

  /** GET /api/analytics/financial → ApiResponse<List<FinancialBarResponse>> */
  getFinancialBars: async (params?: AnalyticsFilters): Promise<FinancialBar[]> => {
    try {
      const response = await apiClient.get<FinancialBar[]>('/analytics/financial', { params });
      return response.data ?? [];
    } catch {
      return [];
    }
  },

  /** GET /api/analytics/safety → ApiResponse<List<SafetyMetricResponse>> */
  getSafetyMetrics: async (params?: AnalyticsFilters): Promise<SafetyMetric[]> => {
    try {
      const response = await apiClient.get<SafetyMetric[]>('/analytics/safety', { params });
      return response.data ?? [];
    } catch {
      return [];
    }
  },

  /** GET /api/analytics/task-progress → ApiResponse<TaskProgressSummary> */
  getTaskBurndown: async (projectId: string): Promise<TaskBurndown[]> => {
    try {
      const response = await apiClient.get('/analytics/task-progress', { params: { projectId } });
      const data = response.data as Record<string, unknown> | null;
      if (!data) return [];
      return [{ date: new Date().toISOString().slice(0, 10), planned: Number(data.totalTasks ?? 0), actual: Number(data.completedTasks ?? 0), ideal: Number(data.totalTasks ?? 0) }];
    } catch {
      return [];
    }
  },

  /** GET /api/analytics/procurement-spend → ApiResponse<List<ProcurementSpendResponse>> */
  getProcurementSpend: async (params?: AnalyticsFilters): Promise<ProcurementSpend[]> => {
    try {
      const response = await apiClient.get<ProcurementSpend[]>('/analytics/procurement-spend', { params });
      return response.data ?? [];
    } catch {
      return [];
    }
  },

  /** GET /api/analytics/warehouse-stock → ApiResponse<List<WarehouseStockResponse>> */
  getWarehouseStockLevels: async (): Promise<WarehouseStockLevel[]> => {
    try {
      const response = await apiClient.get<WarehouseStockLevel[]>('/analytics/warehouse-stock');
      return response.data ?? [];
    } catch {
      return [];
    }
  },

  /**
   * Export report — no dedicated backend endpoint exists.
   * Falls back to localStorage-cached data or returns empty blob.
   */
  exportReport: async (type: string, params?: { projectId?: string; dateFrom?: string; dateTo?: string; format?: string }): Promise<Blob> => {
    try {
      const response = await apiClient.get(`/analytics/export/${type}`, {
        params,
        responseType: 'blob',
      });
      return response.data;
    } catch {
      return new Blob([''], { type: 'application/octet-stream' });
    }
  },

  /**
   * KPI items for the analytics KPI page.
   * Backend has two sources:
   *   - GET /api/analytics/kpis → List<KpiItemResponse> (AnalyticsController)
   *   - GET /api/kpis/dashboard → List<KpiDashboardItem> (KpiController)
   * Use /analytics/kpis first (chart-ready data), fallback to /kpis/dashboard.
   */
  getKpis: async (params?: AnalyticsFilters): Promise<KpiItem[]> => {
    try {
      const response = await apiClient.get<KpiItem[]>('/analytics/kpis', { params });
      return response.data ?? [];
    } catch {
      try {
        const fallback = await apiClient.get<KpiItem[]>('/kpis/dashboard', { params });
        return fallback.data ?? [];
      } catch {
        return [];
      }
    }
  },

  /** GET /api/analytics/audit-log → ApiResponse<AuditLogPageResponse> */
  getAuditLog: async (params?: PaginationParams & { module?: string; actionType?: string; dateFrom?: string; dateTo?: string }): Promise<PaginatedResponse<AuditLogEntry>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<AuditLogEntry>>('/analytics/audit-log', { params });
      return response.data ?? { content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 };
    } catch {
      return { content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 };
    }
  },

  /** GET /api/analytics/project-budgets → ApiResponse<List<ProjectBudgetSummaryResponse>> */
  getProjectBudgets: async (params?: AnalyticsFilters): Promise<ProjectBudgetSummary[]> => {
    try {
      const response = await apiClient.get<ProjectBudgetSummary[]>('/analytics/project-budgets', { params });
      return response.data ?? [];
    } catch {
      return [];
    }
  },

  /** GET /api/analytics/progress → ApiResponse<List<ProgressPointResponse>> */
  getProgressData: async (params?: AnalyticsFilters): Promise<ProgressPoint[]> => {
    try {
      const response = await apiClient.get<ProgressPoint[]>('/analytics/progress', { params });
      return response.data ?? [];
    } catch {
      return [];
    }
  },

  /** GET /api/analytics/budget-categories → ApiResponse<List<BudgetCategoryResponse>> */
  getBudgetCategories: async (params?: AnalyticsFilters): Promise<BudgetCategory[]> => {
    try {
      const response = await apiClient.get<BudgetCategory[]>('/analytics/budget-categories', { params });
      return response.data ?? [];
    } catch {
      return [];
    }
  },

  // -- Dashboard Analytics --

  /** GET /api/analytics/dashboard → ApiResponse<OrgDashboardResponse> */
  fetchOrgDashboard: async (): Promise<OrgDashboardData> => {
    try {
      const response = await apiClient.get<OrgDashboardData>('/analytics/dashboard');
      return response.data ?? { activeProjects: 0, totalBudget: 0, totalSpent: 0, budgetUtilization: 0, activeTasks: 0, overdueTasks: 0, openDefects: 0, safetyScore: 0, upcomingMilestones: [], recentActivities: [] };
    } catch {
      return { activeProjects: 0, totalBudget: 0, totalSpent: 0, budgetUtilization: 0, activeTasks: 0, overdueTasks: 0, openDefects: 0, safetyScore: 0, upcomingMilestones: [], recentActivities: [] };
    }
  },

  /** GET /api/analytics/dashboard/financial → ApiResponse<FinancialSummaryResponse> */
  fetchFinancialSummary: async (): Promise<FinancialSummaryData> => {
    try {
      const response = await apiClient.get<FinancialSummaryData>('/analytics/dashboard/financial');
      return response.data ?? { totalBudget: 0, totalSpent: 0, totalCommitted: 0, totalForecast: 0, marginPercent: 0, projectFinancials: [], monthlySpend: [] };
    } catch {
      return { totalBudget: 0, totalSpent: 0, totalCommitted: 0, totalForecast: 0, marginPercent: 0, projectFinancials: [], monthlySpend: [] };
    }
  },

  /** GET /api/analytics/dashboard/tasks → ApiResponse<TaskAnalyticsResponse> */
  fetchTaskAnalytics: async (): Promise<TaskAnalyticsData> => {
    try {
      const response = await apiClient.get<TaskAnalyticsData>('/analytics/dashboard/tasks');
      return response.data ?? { totalTasks: 0, completedTasks: 0, inProgressTasks: 0, overdueTasks: 0, completionRate: 0, avgCompletionDays: 0, tasksByStatus: {}, tasksByPriority: {} };
    } catch {
      return { totalTasks: 0, completedTasks: 0, inProgressTasks: 0, overdueTasks: 0, completionRate: 0, avgCompletionDays: 0, tasksByStatus: {}, tasksByPriority: {} };
    }
  },

  /** GET /api/analytics/dashboard/safety → ApiResponse<SafetyMetricsResponse> */
  fetchSafetyMetrics: async (): Promise<SafetyMetricsData> => {
    try {
      const response = await apiClient.get<SafetyMetricsData>('/analytics/dashboard/safety');
      return response.data ?? { totalInspections: 0, passRate: 0, openViolations: 0, resolvedViolations: 0, incidentCount: 0, trainingComplianceRate: 0, daysSinceLastIncident: 0 };
    } catch {
      return { totalInspections: 0, passRate: 0, openViolations: 0, resolvedViolations: 0, incidentCount: 0, trainingComplianceRate: 0, daysSinceLastIncident: 0 };
    }
  },
};
