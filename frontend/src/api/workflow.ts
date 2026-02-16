import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowStatus,
  AutomationRule,
  AutomationExecution,
} from '@/modules/workflow/types';

export interface WorkflowFilters extends PaginationParams {
  status?: WorkflowStatus;
  entityType?: string;
  search?: string;
}

export interface AutomationRuleFilters extends PaginationParams {
  isEnabled?: boolean;
  entityType?: string;
  search?: string;
}

export const workflowApi = {
  getWorkflows: async (params?: WorkflowFilters): Promise<PaginatedResponse<WorkflowDefinition>> => {
    const response = await apiClient.get<PaginatedResponse<WorkflowDefinition>>('/approval-rules', { params });
    return response.data;
  },

  getWorkflow: async (id: string): Promise<WorkflowDefinition> => {
    const response = await apiClient.get<WorkflowDefinition>(`/approval-rules/${id}`);
    return response.data;
  },

  createWorkflow: async (data: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> => {
    const response = await apiClient.post<WorkflowDefinition>('/approval-rules', data);
    return response.data;
  },

  updateWorkflow: async (id: string, data: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> => {
    const response = await apiClient.put<WorkflowDefinition>(`/approval-rules/${id}`, data);
    return response.data;
  },

  deleteWorkflow: async (id: string): Promise<void> => {
    await apiClient.delete(`/approval-rules/${id}`);
  },

  getWorkflowSteps: async (workflowId: string): Promise<WorkflowStep[]> => {
    const response = await apiClient.get<WorkflowStep[]>(`/approval-rules/${workflowId}/steps`);
    return response.data;
  },

  updateWorkflowSteps: async (workflowId: string, steps: Partial<WorkflowStep>[]): Promise<WorkflowStep[]> => {
    const response = await apiClient.put<WorkflowStep[]>(`/approval-rules/${workflowId}/steps`, steps);
    return response.data;
  },

  changeWorkflowStatus: async (id: string, status: WorkflowStatus): Promise<WorkflowDefinition> => {
    const response = await apiClient.patch<WorkflowDefinition>(`/approval-rules/${id}/status`, { status });
    return response.data;
  },

  getAutomationRules: async (params?: AutomationRuleFilters): Promise<PaginatedResponse<AutomationRule>> => {
    const response = await apiClient.get<PaginatedResponse<AutomationRule>>('/approval-rules', { params });
    return response.data;
  },

  getAutomationRule: async (id: string): Promise<AutomationRule> => {
    const response = await apiClient.get<AutomationRule>(`/approval-rules/${id}`);
    return response.data;
  },

  createAutomationRule: async (data: Partial<AutomationRule>): Promise<AutomationRule> => {
    const response = await apiClient.post<AutomationRule>('/approval-rules', data);
    return response.data;
  },

  updateAutomationRule: async (id: string, data: Partial<AutomationRule>): Promise<AutomationRule> => {
    const response = await apiClient.put<AutomationRule>(`/approval-rules/${id}`, data);
    return response.data;
  },

  toggleAutomationRule: async (id: string, isEnabled: boolean): Promise<AutomationRule> => {
    const response = await apiClient.patch<AutomationRule>(`/approval-rules/${id}/toggle`, { isEnabled });
    return response.data;
  },

  getExecutions: async (ruleId?: string): Promise<PaginatedResponse<AutomationExecution>> => {
    const params = ruleId ? { ruleId } : {};
    const response = await apiClient.get<PaginatedResponse<AutomationExecution>>('/approval-rules/executions', { params });
    return response.data;
  },
};
