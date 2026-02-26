import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  Opportunity,
  OpportunityActivity,
  OpportunityStage,
  BidPackage,
  BidStatus,
  BidComparison,
} from '@/modules/portfolio/types';

export interface OpportunityFilters extends PaginationParams {
  stage?: OpportunityStage;
  search?: string;
}

export interface BidFilters extends PaginationParams {
  status?: BidStatus;
  search?: string;
}

export const portfolioApi = {
  getOpportunities: async (params?: OpportunityFilters): Promise<PaginatedResponse<Opportunity>> => {
    const response = await apiClient.get<PaginatedResponse<Opportunity>>('/portfolio/opportunities', { params });
    return response.data;
  },

  getOpportunity: async (id: string): Promise<Opportunity> => {
    const response = await apiClient.get<Opportunity>(`/portfolio/opportunities/${id}`);
    return response.data;
  },

  createOpportunity: async (data: Partial<Opportunity>): Promise<Opportunity> => {
    const response = await apiClient.post<Opportunity>('/portfolio/opportunities', data);
    return response.data;
  },

  updateOpportunity: async (id: string, data: Partial<Opportunity>): Promise<Opportunity> => {
    const response = await apiClient.put<Opportunity>(`/portfolio/opportunities/${id}`, data);
    return response.data;
  },

  getOpportunityActivities: async (id: string): Promise<OpportunityActivity[]> => {
    const response = await apiClient.get<OpportunityActivity[]>(`/portfolio/opportunities/${id}/activities`);
    return response.data;
  },

  getBidPackages: async (params?: BidFilters): Promise<PaginatedResponse<BidPackage>> => {
    const response = await apiClient.get<PaginatedResponse<BidPackage>>('/portfolio/bid-packages', { params });
    return response.data;
  },

  getBidPackage: async (id: string): Promise<BidPackage> => {
    const response = await apiClient.get<BidPackage>(`/portfolio/bid-packages/${id}`);
    return response.data;
  },

  createBidPackage: async (data: Partial<BidPackage>): Promise<BidPackage> => {
    const response = await apiClient.post<BidPackage>('/portfolio/bid-packages', data);
    return response.data;
  },

  getBidComparisons: async (bidPackageId: string): Promise<BidComparison[]> => {
    const response = await apiClient.get<BidComparison[]>(`/portfolio/bid-packages/${bidPackageId}/comparisons`);
    return response.data;
  },

  // Go/No-Go Checklist (Phase 0)
  updateGoNoGoChecklist: async (id: string, checklist: Record<string, boolean>, score: number): Promise<Opportunity> => {
    const response = await apiClient.patch<Opportunity>(`/portfolio/opportunities/${id}/checklist`, {
      checklistJson: JSON.stringify(checklist), score,
    });
    return response.data;
  },

  getAnalogAssessment: async (id: string): Promise<{ analogCount: number; avgEstimatedValue?: number; avgWinProbability?: number; recommendation: string }> => {
    const response = await apiClient.get(`/portfolio/opportunities/${id}/analog-assessment`);
    return response.data;
  },
};
