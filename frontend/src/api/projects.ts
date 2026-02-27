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
    const response = await apiClient.get<DashboardSummary>('/projects/dashboard/summary');
    return response.data;
  },

  getConstructionPlans: async (projectId: string): Promise<ConstructionPlan[]> => {
    const response = await apiClient.get<ConstructionPlan[]>(`/projects/${projectId}/construction-plans`);
    return response.data;
  },

  updateConstructionPlan: async (projectId: string, planId: string, data: Partial<ConstructionPlan>): Promise<ConstructionPlan> => {
    const response = await apiClient.put<ConstructionPlan>(`/projects/${projectId}/construction-plans/${planId}`, data);
    return response.data;
  },
};
