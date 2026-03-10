import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { ApprovalInstance } from './types';

export interface AutoApprovalRule {
  id: string;
  name: string;
  description?: string;
  entityType: string;
  entityTypeDisplayName?: string;
  isActive: boolean;
  conditions?: string;
  approverRole?: string;
  autoApproveThreshold?: number;
  requiredApprovers?: number;
  escalationTimeoutHours?: number;
  projectId?: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export const workflowApi = {
  // ---- Auto Approval Rules ----

  getApprovalRules: async (params?: PaginationParams & { search?: string; entityType?: string; isActive?: boolean }): Promise<PaginatedResponse<AutoApprovalRule>> => {
    const response = await apiClient.get<PaginatedResponse<AutoApprovalRule>>('/approval-rules', { params });
    return response.data;
  },

  getApprovalRuleById: async (id: string): Promise<AutoApprovalRule> => {
    const response = await apiClient.get<AutoApprovalRule>(`/approval-rules/${id}`);
    return response.data;
  },

  createApprovalRule: async (data: Partial<AutoApprovalRule>): Promise<AutoApprovalRule> => {
    const response = await apiClient.post<AutoApprovalRule>('/approval-rules', data);
    return response.data;
  },

  updateApprovalRule: async (id: string, data: Partial<AutoApprovalRule>): Promise<AutoApprovalRule> => {
    const response = await apiClient.put<AutoApprovalRule>(`/approval-rules/${id}`, data);
    return response.data;
  },

  toggleApprovalRule: async (id: string): Promise<AutoApprovalRule> => {
    const response = await apiClient.patch<AutoApprovalRule>(`/approval-rules/${id}/toggle`);
    return response.data;
  },

  deleteApprovalRule: async (id: string): Promise<void> => {
    await apiClient.delete(`/approval-rules/${id}`);
  },

  // ---- Approval Inbox (approval instances) ----

  getApprovalInbox: async (params?: PaginationParams): Promise<PaginatedResponse<ApprovalInstance>> => {
    const response = await apiClient.get<PaginatedResponse<ApprovalInstance>>('/approval-instances/inbox', { params });
    return response.data;
  },

  submitDecision: async (id: string, data: { decision: string; comments?: string }): Promise<ApprovalInstance> => {
    const response = await apiClient.post<ApprovalInstance>(`/approval-instances/${id}/decision`, data);
    return response.data;
  },

  cancelApproval: async (id: string): Promise<ApprovalInstance> => {
    const response = await apiClient.post<ApprovalInstance>(`/approval-instances/${id}/cancel`);
    return response.data;
  },

  batchDecision: async (data: { instanceIds: string[]; decision: string; comments?: string }): Promise<{
    total: number;
    succeeded: number;
    failed: number;
    results: Array<{ instanceId: string; success: boolean; error?: string }>;
  }> => {
    const response = await apiClient.post('/approval-instances/batch-decision', data);
    return response.data;
  },

  delegateApproval: async (id: string, data: { delegateToId: string; comments?: string }): Promise<ApprovalInstance> => {
    const response = await apiClient.post<ApprovalInstance>(`/approval-instances/${id}/delegate`, data);
    return response.data;
  },

  getApprovalHistory: async (entityType: string, entityId: string): Promise<Array<{
    id: string;
    approvalInstanceId: string;
    workflowStepId: string;
    stepName: string;
    stepOrder: number;
    approverId: string;
    decision: string;
    comments: string;
    decidedAt: string;
  }>> => {
    const response = await apiClient.get(`/approval-instances/entity/${entityType}/${entityId}/history`);
    return response.data;
  },

  getApprovalInstance: async (id: string): Promise<ApprovalInstance> => {
    const response = await apiClient.get<ApprovalInstance>(`/approval-instances/${id}`);
    return response.data;
  },
};
