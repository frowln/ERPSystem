import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
export type IssuePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
export type IssueType = 'DEFECT' | 'SAFETY' | 'DESIGN' | 'QUALITY' | 'DELAY' | 'OTHER';

export interface Issue {
  id: string;
  code: string;
  title: string;
  description?: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  projectId: string;
  projectName?: string;
  assigneeId?: string;
  assigneeName?: string;
  reportedById: string;
  reportedByName: string;
  dueDate?: string;
  resolvedAt?: string;
  closedAt?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IssueComment {
  id: string;
  issueId: string;
  content: string;
  authorId: string;
  authorName: string;
  postedAt: string;
}

export interface IssueFilters extends PaginationParams {
  status?: IssueStatus;
  priority?: IssuePriority;
  type?: IssueType;
  projectId?: string;
  assigneeId?: string;
  search?: string;
}

export const issuesApi = {
  getAll: async (params?: IssueFilters): Promise<PaginatedResponse<Issue>> => {
    const response = await apiClient.get<PaginatedResponse<Issue>>('/pm/issues', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Issue> => {
    const response = await apiClient.get<Issue>(`/pm/issues/${id}`);
    return response.data;
  },

  create: async (data: Partial<Issue>): Promise<Issue> => {
    const response = await apiClient.post<Issue>('/pm/issues', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Issue>): Promise<Issue> => {
    const response = await apiClient.put<Issue>(`/pm/issues/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/pm/issues/${id}`);
  },

  updateStatus: async (id: string, status: IssueStatus, reason?: string): Promise<Issue> => {
    const response = await apiClient.patch<Issue>(`/pm/issues/${id}/status`, { status, reason });
    return response.data;
  },

  getOverdue: async (projectId?: string): Promise<Issue[]> => {
    const response = await apiClient.get<Issue[]>('/pm/issues/overdue', {
      params: projectId ? { projectId } : undefined,
    });
    return response.data;
  },

  // Comments
  getComments: async (issueId: string, params?: PaginationParams): Promise<PaginatedResponse<IssueComment>> => {
    const response = await apiClient.get<PaginatedResponse<IssueComment>>(`/pm/issues/${issueId}/comments`, { params });
    return response.data;
  },

  addComment: async (issueId: string, content: string): Promise<IssueComment> => {
    const response = await apiClient.post<IssueComment>(`/pm/issues/${issueId}/comments`, { content });
    return response.data;
  },
};
