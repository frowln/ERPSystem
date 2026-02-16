import { apiClient } from './client';

export interface DashboardMetric {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'table' | 'stat' | 'list';
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, unknown>;
}

export interface ProjectSummary {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueProjects: number;
  totalBudget: number;
  spentBudget: number;
  completionPercent: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  user: string;
  timestamp: string;
  entityType: string;
  entityId: string;
}

export interface DashboardData {
  metrics: DashboardMetric[];
  widgets: DashboardWidget[];
  projectSummary: ProjectSummary;
  recentActivity: RecentActivity[];
}

export interface DashboardFilters {
  dateFrom?: string;
  dateTo?: string;
  projectId?: string;
}

export const dashboardApi = {
  getDashboardData: async (params?: DashboardFilters): Promise<DashboardData> => {
    const response = await apiClient.get<DashboardData>('/dashboard', { params });
    return response.data;
  },

  getMetrics: async (params?: DashboardFilters): Promise<DashboardMetric[]> => {
    const response = await apiClient.get<DashboardMetric[]>('/dashboard/metrics', { params });
    return response.data;
  },

  getWidgets: async (): Promise<DashboardWidget[]> => {
    const response = await apiClient.get<DashboardWidget[]>('/dashboard/widgets');
    return response.data;
  },

  updateWidgetLayout: async (widgets: DashboardWidget[]): Promise<void> => {
    await apiClient.put('/dashboard/widgets', { widgets });
  },

  getProjectSummary: async (params?: DashboardFilters): Promise<ProjectSummary> => {
    const response = await apiClient.get<ProjectSummary>('/dashboard/project-summary', { params });
    return response.data;
  },

  getRecentActivity: async (limit?: number): Promise<RecentActivity[]> => {
    const response = await apiClient.get<RecentActivity[]>('/dashboard/recent-activity', {
      params: { limit },
    });
    return response.data;
  },
};
