import { apiClient } from './client';
import type {
  Project,
  ProjectFilters,
  ProjectMember,
  PaginatedResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
  DashboardSummary,
  ProjectStatus,
  ProjectFinancialSummary,
  ConstructionPlan,
} from '@/types';

export const projectsApi = {
  getProjects: async (params?: ProjectFilters): Promise<PaginatedResponse<Project>> => {
    const response = await apiClient.get<PaginatedResponse<Project>>('/projects', { params });
    return response.data;
  },

  getProject: async (id: string): Promise<Project> => {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    return response.data;
  },

  createProject: async (data: CreateProjectRequest): Promise<Project> => {
    const response = await apiClient.post<Project>('/projects', data);
    return response.data;
  },

  updateProject: async (id: string, data: UpdateProjectRequest): Promise<Project> => {
    const response = await apiClient.put<Project>(`/projects/${id}`, data);
    return response.data;
  },

  changeStatus: async (id: string, status: ProjectStatus): Promise<Project> => {
    const response = await apiClient.patch<Project>(`/projects/${id}/status`, { status });
    return response.data;
  },

  getProjectMembers: async (id: string): Promise<ProjectMember[]> => {
    const response = await apiClient.get<ProjectMember[]>(`/projects/${id}/members`);
    return response.data;
  },

  addMember: async (
    projectId: string,
    data: { userId: string; role: string },
  ): Promise<ProjectMember> => {
    const response = await apiClient.post<ProjectMember>(
      `/projects/${projectId}/members`,
      data,
    );
    return response.data;
  },

  removeMember: async (projectId: string, memberId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/members/${memberId}`);
  },

  getProjectFinancials: async (id: string): Promise<ProjectFinancialSummary> => {
    const response = await apiClient.get<ProjectFinancialSummary>(`/projects/${id}/financials`);
    return response.data;
  },

  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await apiClient.get('/projects/dashboard/summary');
    const raw = response.data as Record<string, unknown>;

    // Transform backend statusCounts (Map<String,Long>) → projectsByStatus array
    const statusCounts = (raw.statusCounts ?? {}) as Record<string, number>;
    const projectsByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    // Fetch recent projects for the table
    let recentProjects: Project[] = [];
    try {
      const projRes = await apiClient.get<PaginatedResponse<Project>>('/projects', { params: { page: 0, size: 5, sort: 'updatedAt', direction: 'DESC' } });
      recentProjects = projRes.data?.content ?? [];
    } catch { /* fallback empty */ }

    // Build budgetVsActual from recent projects (budget vs progress-based estimate)
    const budgetVsActual = recentProjects
      .filter((p) => (p.budget ?? p.budgetAmount ?? 0) > 0)
      .slice(0, 6)
      .map((p) => ({
        month: p.name.length > 12 ? p.name.slice(0, 10) + '…' : p.name,
        budget: (p.budget ?? p.budgetAmount ?? 0) / 1_000_000,
        actual: ((p.budget ?? p.budgetAmount ?? 0) * (p.progress ?? 0) / 100) / 1_000_000,
      }));

    return {
      activeProjects: (raw.totalProjects as number) ?? 0,
      totalBudget: (raw.totalBudget as number) ?? 0,
      totalContractAmount: (raw.totalContractAmount as number) ?? 0,
      onWatch: 0,
      overdue: 0,
      projectsByStatus,
      budgetVsActual,
      recentProjects,
      computedTotalContractAmount: (raw.computedTotalContractAmount as number) ?? 0,
      computedTotalPlannedBudget: (raw.computedTotalPlannedBudget as number) ?? 0,
      computedTotalActualCost: (raw.computedTotalActualCost as number) ?? 0,
      computedTotalCashFlow: (raw.computedTotalCashFlow as number) ?? 0,
    };
  },

  // TODO: No backend endpoint exists for construction plans. Using localStorage fallback.
  getConstructionPlans: async (projectId: string): Promise<ConstructionPlan[]> => {
    try {
      const stored = localStorage.getItem('privod-construction-plans');
      const data = stored ? JSON.parse(stored) : {};
      return data[projectId] || [];
    } catch { return []; }
  },

  initializeConstructionPlans: async (projectId: string): Promise<ConstructionPlan[]> => {
    try {
      const stored = localStorage.getItem('privod-construction-plans');
      const all = stored ? JSON.parse(stored) : {};
      const existing: ConstructionPlan[] = all[projectId] || [];
      if (existing.length > 0) return existing;
      const now = Date.now();
      const plans: ConstructionPlan[] = [
        { id: `plan-${now}-1`, projectId, planType: 'POS' as any, status: 'NOT_STARTED' as any, author: '', version: 1 } as ConstructionPlan,
        { id: `plan-${now}-2`, projectId, planType: 'PPR' as any, status: 'NOT_STARTED' as any, author: '', version: 1 } as ConstructionPlan,
        { id: `plan-${now}-3`, projectId, planType: 'SITE_PLAN' as any, status: 'NOT_STARTED' as any, author: '', version: 1 } as ConstructionPlan,
      ];
      all[projectId] = plans;
      localStorage.setItem('privod-construction-plans', JSON.stringify(all));
      return plans;
    } catch { return []; }
  },

  updateConstructionPlan: async (projectId: string, planId: string, data: Partial<ConstructionPlan>): Promise<ConstructionPlan> => {
    try {
      const stored = localStorage.getItem('privod-construction-plans');
      const all = stored ? JSON.parse(stored) : {};
      const items: ConstructionPlan[] = all[projectId] || [];
      const idx = items.findIndex((p) => p.id === planId);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...data } as ConstructionPlan;
      }
      all[projectId] = items;
      localStorage.setItem('privod-construction-plans', JSON.stringify(all));
      return idx >= 0 ? items[idx] : ({ id: planId, ...data } as ConstructionPlan);
    } catch {
      return { id: planId, ...data } as ConstructionPlan;
    }
  },
};
