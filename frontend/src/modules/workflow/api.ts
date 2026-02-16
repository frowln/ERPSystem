import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  WorkflowDefinition,
  WorkflowStep,
  AutomationRule,
  AutomationExecution,
  EntityType,
} from './types';

export interface ApprovalRuleFilters extends PaginationParams {
  search?: string;
  entityType?: EntityType;
  isActive?: boolean;
  organizationId?: string;
  projectId?: string;
}

export interface AutoApprovalRule {
  id: string;
  name: string;
  description?: string;
  entityType: EntityType;
  isActive: boolean;
  conditions: string;
  approverRole?: string;
  organizationId?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export const workflowApi = {
  // ---- Auto Approval Rules ----

  getApprovalRules: async (params?: ApprovalRuleFilters): Promise<PaginatedResponse<AutoApprovalRule>> => {
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
};
