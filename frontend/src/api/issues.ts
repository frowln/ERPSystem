import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { Issue, IssueComment, IssueStatus } from '@/modules/issues/types';

export interface IssueFilters extends PaginationParams {
  status?: IssueStatus;
  projectId?: string;
  search?: string;
}

export const issuesApi = {
  getIssues: async (params?: IssueFilters): Promise<PaginatedResponse<Issue>> => {
    const response = await apiClient.get<PaginatedResponse<Issue>>('/pm/issues', { params });
    return response.data;
  },

  getIssue: async (id: string): Promise<Issue> => {
    const response = await apiClient.get<Issue>(`/pm/issues/${id}`);
    return response.data;
  },

  createIssue: async (data: Partial<Issue>): Promise<Issue> => {
    const response = await apiClient.post<Issue>('/pm/issues', data);
    return response.data;
  },

  updateIssue: async (id: string, data: Partial<Issue>): Promise<Issue> => {
    const response = await apiClient.put<Issue>(`/pm/issues/${id}`, data);
    return response.data;
  },

  getIssueComments: async (id: string): Promise<IssueComment[]> => {
    const response = await apiClient.get<IssueComment[]>(`/pm/issues/${id}/comments`);
    return response.data;
  },

  addIssueComment: async (id: string, content: string): Promise<IssueComment> => {
    const response = await apiClient.post<IssueComment>(`/pm/issues/${id}/comments`, { content });
    return response.data;
  },

  deleteIssue: async (id: string): Promise<void> => {
    await apiClient.delete(`/pm/issues/${id}`);
  },
};
