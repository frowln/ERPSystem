import { apiClient } from './client';

export type ApprovalStepStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ApprovalChainStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';

export interface ApprovalStep {
  id: string;
  stepOrder: number;
  approverName: string;
  approverRole?: string;
  status: ApprovalStepStatus;
  comment?: string;
  decidedAt?: string;
  createdAt?: string;
}

export interface ApprovalChain {
  id: string;
  entityType: string;
  entityId: string;
  name?: string;
  status: ApprovalChainStatus;
  steps?: ApprovalStep[];
  createdAt: string;
}

export type ApprovalEntityType =
  | 'SPECIFICATION'
  | 'INVOICE'
  | 'PURCHASE_ORDER'
  | 'PURCHASE_REQUEST'
  | 'CHANGE_ORDER'
  | 'CONTRACT'
  | 'BUDGET'
  | 'KS2'
  | 'KS3';

export const approvalsApi = {
  /**
   * GET /api/approvals?entityType=...&entityId=...
   * Backend returns ApiResponse<ApprovalChainResponse> for filtered, or ApiResponse<List<ApprovalChainResponse>> for all.
   * The API client interceptor unwraps the ApiResponse wrapper automatically.
   */
  getChain: async (entityType: string, entityId: string): Promise<ApprovalChain | null> => {
    try {
      const { data } = await apiClient.get('/approvals', { params: { entityType, entityId } });
      return data ?? null;
    } catch {
      return null;
    }
  },

  /** GET /api/approvals/{id} → ApiResponse<ApprovalChainResponse> */
  getChainById: async (chainId: string): Promise<ApprovalChain> => {
    const { data } = await apiClient.get(`/approvals/${chainId}`);
    return data;
  },

  /**
   * POST /api/approvals → ApiResponse<ApprovalChainResponse>
   * Backend expects CreateApprovalChainRequest with entityType, entityId, steps.
   */
  createChain: async (payload: {
    name?: string;
    entityType: string;
    entityId: string;
    steps: Array<{ approverName: string; approverRole?: string }>;
  }): Promise<ApprovalChain> => {
    const { data } = await apiClient.post('/approvals', payload);
    return data;
  },

  /** POST /api/approvals/steps/{stepId}/approve → ApiResponse<ApprovalStepResponse> */
  approveStep: async (stepId: string, comment?: string): Promise<ApprovalStep> => {
    const { data } = await apiClient.post(`/approvals/steps/${stepId}/approve`, { comment });
    return data;
  },

  /** POST /api/approvals/steps/{stepId}/reject → ApiResponse<ApprovalStepResponse> */
  rejectStep: async (stepId: string, comment?: string): Promise<ApprovalStep> => {
    const { data } = await apiClient.post(`/approvals/steps/${stepId}/reject`, { comment });
    return data;
  },
};
