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

// Backend endpoints:
//   GET /api/analytics/dashboard       → OrgDashboardResponse (activeProjects, totalBudget, totalSpent, etc.)
//   GET /api/admin/dashboard/metrics   → DashboardMetricsResponse (totalUsers, totalProjects, storageUsedMb, recentActions)

export const dashboardApi = {
  // Combines analytics/dashboard + admin/dashboard/metrics into DashboardData
  getDashboardData: async (_params?: DashboardFilters): Promise<DashboardData> => {
    try {
      const [orgResp, adminResp] = await Promise.allSettled([
        apiClient.get('/analytics/dashboard'),
        apiClient.get('/admin/dashboard/metrics'),
      ]);

      // Parse org dashboard
      const orgData = orgResp.status === 'fulfilled' ? (orgResp.value.data?.data ?? orgResp.value.data) : null;
      // Parse admin metrics
      const adminData = adminResp.status === 'fulfilled' ? (adminResp.value.data?.data ?? adminResp.value.data) : null;

      const activeProjects = orgData?.activeProjects ?? adminData?.totalProjects ?? 0;
      const totalBudget = Number(orgData?.totalBudget ?? 0);
      const totalSpent = Number(orgData?.totalSpent ?? 0);
      const activeTasks = orgData?.activeTasks ?? 0;
      const overdueTasks = orgData?.overdueTasks ?? 0;

      const metrics: DashboardMetric[] = [
        { id: 'active-projects', label: 'Active Projects', value: activeProjects, previousValue: 0, unit: '', trend: 'stable', changePercent: 0 },
        { id: 'total-budget', label: 'Total Budget', value: totalBudget, previousValue: 0, unit: '₽', trend: 'stable', changePercent: 0 },
        { id: 'total-spent', label: 'Total Spent', value: totalSpent, previousValue: 0, unit: '₽', trend: 'stable', changePercent: 0 },
        { id: 'active-tasks', label: 'Active Tasks', value: activeTasks, previousValue: 0, unit: '', trend: 'stable', changePercent: 0 },
        { id: 'overdue-tasks', label: 'Overdue Tasks', value: overdueTasks, previousValue: 0, unit: '', trend: overdueTasks > 0 ? 'up' : 'stable', changePercent: 0 },
      ];

      const budgetUtil = orgData?.budgetUtilization ?? (totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0);

      const projectSummary: ProjectSummary = {
        totalProjects: adminData?.totalProjects ?? activeProjects,
        activeProjects,
        completedProjects: 0,
        overdueProjects: overdueTasks,
        totalBudget,
        spentBudget: totalSpent,
        completionPercent: Math.round(budgetUtil),
      };

      const recentActivity: RecentActivity[] = [];
      // Map org dashboard activities
      if (orgData?.recentActivities) {
        for (const a of orgData.recentActivities) {
          recentActivity.push({
            id: crypto.randomUUID(),
            type: a.type ?? '',
            description: a.description ?? '',
            user: a.projectName ?? '',
            timestamp: a.timestamp ?? '',
            entityType: a.type ?? '',
            entityId: '',
          });
        }
      }
      // Map admin recent actions
      if (adminData?.recentActions) {
        for (const a of adminData.recentActions) {
          recentActivity.push({
            id: a.id ?? crypto.randomUUID(),
            type: a.action ?? '',
            description: `${a.action} ${a.entityType}`,
            user: a.userName ?? '',
            timestamp: a.timestamp ?? '',
            entityType: a.entityType ?? '',
            entityId: a.id ?? '',
          });
        }
      }

      return { metrics, widgets: [], projectSummary, recentActivity };
    } catch {
      return {
        metrics: [],
        widgets: [],
        projectSummary: { totalProjects: 0, activeProjects: 0, completedProjects: 0, overdueProjects: 0, totalBudget: 0, spentBudget: 0, completionPercent: 0 },
        recentActivity: [],
      };
    }
  },

  // Backend: GET /api/admin/dashboard/metrics
  getMetrics: async (_params?: DashboardFilters): Promise<DashboardMetric[]> => {
    try {
      const response = await apiClient.get('/admin/dashboard/metrics');
      const d = response.data?.data ?? response.data;
      return [
        { id: 'total-users', label: 'Total Users', value: d?.totalUsers ?? 0, previousValue: 0, unit: '', trend: 'stable' as const, changePercent: 0 },
        { id: 'total-projects', label: 'Total Projects', value: d?.totalProjects ?? 0, previousValue: 0, unit: '', trend: 'stable' as const, changePercent: 0 },
        { id: 'storage-used', label: 'Storage Used', value: d?.storageUsedMb ?? 0, previousValue: 0, unit: 'MB', trend: 'stable' as const, changePercent: 0 },
      ];
    } catch {
      return [];
    }
  },

  getWidgets: async (): Promise<DashboardWidget[]> => {
    // TODO: implement backend endpoint; custom dashboards are at /api/dashboards/{id}/widgets
    return [];
  },

  updateWidgetLayout: async (_widgets: DashboardWidget[]): Promise<void> => {
    // TODO: implement backend endpoint
  },

  // Backend: GET /api/analytics/dashboard → OrgDashboardResponse
  getProjectSummary: async (_params?: DashboardFilters): Promise<ProjectSummary> => {
    try {
      const response = await apiClient.get('/analytics/dashboard');
      const d = response.data?.data ?? response.data;
      const totalBudget = Number(d?.totalBudget ?? 0);
      const totalSpent = Number(d?.totalSpent ?? 0);
      return {
        totalProjects: d?.activeProjects ?? 0,
        activeProjects: d?.activeProjects ?? 0,
        completedProjects: 0,
        overdueProjects: d?.overdueTasks ?? 0,
        totalBudget,
        spentBudget: totalSpent,
        completionPercent: Math.round(d?.budgetUtilization ?? 0),
      };
    } catch {
      return { totalProjects: 0, activeProjects: 0, completedProjects: 0, overdueProjects: 0, totalBudget: 0, spentBudget: 0, completionPercent: 0 };
    }
  },

  getRecentActivity: async (_limit?: number): Promise<RecentActivity[]> => {
    try {
      const response = await apiClient.get('/analytics/dashboard');
      const d = response.data?.data ?? response.data;
      if (!d?.recentActivities) return [];
      return d.recentActivities.map((a: { type?: string; description?: string; projectName?: string; timestamp?: string }) => ({
        id: crypto.randomUUID(),
        type: a.type ?? '',
        description: a.description ?? '',
        user: a.projectName ?? '',
        timestamp: a.timestamp ?? '',
        entityType: a.type ?? '',
        entityId: '',
      }));
    } catch {
      return [];
    }
  },
};
