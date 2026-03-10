import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  WorkflowDefinition,
  WorkflowStep,
  AutomationExecution,
} from '@/modules/workflow/types';

export interface WorkflowFilters extends PaginationParams {
  isActive?: boolean;
  entityType?: string;
  search?: string;
}

export const workflowApi = {
  // ---- Workflow Definitions (templates) ----

  getWorkflows: async (params?: WorkflowFilters): Promise<PaginatedResponse<WorkflowDefinition>> => {
    const response = await apiClient.get<PaginatedResponse<WorkflowDefinition>>('/workflow-definitions', { params });
    return response.data;
  },

  getWorkflow: async (id: string): Promise<WorkflowDefinition> => {
    const response = await apiClient.get<WorkflowDefinition>(`/workflow-definitions/${id}`);
    return response.data;
  },

  createWorkflow: async (data: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> => {
    const response = await apiClient.post<WorkflowDefinition>('/workflow-definitions', data);
    return response.data;
  },

  updateWorkflow: async (id: string, data: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> => {
    const response = await apiClient.put<WorkflowDefinition>(`/workflow-definitions/${id}`, data);
    return response.data;
  },

  deleteWorkflow: async (id: string): Promise<void> => {
    await apiClient.delete(`/workflow-definitions/${id}`);
  },

  toggleWorkflowActive: async (id: string): Promise<WorkflowDefinition> => {
    const response = await apiClient.patch<WorkflowDefinition>(`/workflow-definitions/${id}/toggle`);
    return response.data;
  },

  // ---- Steps ----

  getWorkflowSteps: async (workflowId: string): Promise<WorkflowStep[]> => {
    const response = await apiClient.get<WorkflowStep[]>(`/workflow-definitions/${workflowId}/steps`);
    return response.data;
  },

  updateWorkflowSteps: async (workflowId: string, steps: Partial<WorkflowStep>[]): Promise<WorkflowStep[]> => {
    const response = await apiClient.put<WorkflowStep[]>(`/workflow-definitions/${workflowId}/steps`, steps);
    return response.data;
  },

  // ---- Automation Executions ----

  getExecutions: async (ruleId?: string, params?: PaginationParams): Promise<PaginatedResponse<AutomationExecution>> => {
    const queryParams = { ...params, ruleId };
    const response = await apiClient.get<PaginatedResponse<AutomationExecution>>('/workflow-definitions/executions', { params: queryParams });
    return response.data;
  },
};
