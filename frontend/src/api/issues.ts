import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { Issue, IssueComment, IssueStatus } from '@/modules/issues/types';

export interface IssueFilters extends PaginationParams {
  status?: IssueStatus;
  projectId?: string;
  search?: string;
}

function unwrap<T>(data: any): T {
  return data?.data ?? data;
}

export const issuesApi = {
  getIssues: async (params?: IssueFilters): Promise<PaginatedResponse<Issue>> => {
    const response = await apiClient.get('/pm/issues', { params });
    return unwrap<PaginatedResponse<Issue>>(response.data);
  },

  getIssue: async (id: string): Promise<Issue> => {
    const response = await apiClient.get(`/pm/issues/${id}`);
    return unwrap<Issue>(response.data);
  },

  createIssue: async (data: {
    title: string;
    description?: string;
    issueType?: string;
    priority?: string;
    projectId: string;
    assignedToId?: string;
    reportedById: string;
    dueDate?: string;
    location?: string;
  }): Promise<Issue> => {
    const response = await apiClient.post('/pm/issues', data);
    return unwrap<Issue>(response.data);
  },

  updateIssue: async (id: string, data: {
    title?: string;
    description?: string;
    issueType?: string;
    priority?: string;
    assignedToId?: string;
    dueDate?: string;
    location?: string;
    rootCause?: string;
    resolution?: string;
  }): Promise<Issue> => {
    const response = await apiClient.put(`/pm/issues/${id}`, data);
    return unwrap<Issue>(response.data);
  },

  changeStatus: async (id: string, status: IssueStatus): Promise<Issue> => {
    const response = await apiClient.patch(`/pm/issues/${id}/status`, { status });
    return unwrap<Issue>(response.data);
  },

  getIssueComments: async (id: string): Promise<IssueComment[]> => {
    const response = await apiClient.get(`/pm/issues/${id}/comments`, {
      params: { page: 0, size: 100 },
    });
    const raw = unwrap<any>(response.data);
    return raw?.content ?? (Array.isArray(raw) ? raw : []);
  },

  addIssueComment: async (issueId: string, data: {
    authorId: string;
    commentText: string;
  }): Promise<IssueComment> => {
    const response = await apiClient.post(`/pm/issues/${issueId}/comments`, {
      issueId,
      ...data,
    });
    return unwrap<IssueComment>(response.data);
  },

  deleteIssue: async (id: string): Promise<void> => {
    await apiClient.delete(`/pm/issues/${id}`);
  },
};
