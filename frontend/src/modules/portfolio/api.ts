import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  Opportunity,
  BidPackage,
  PrequalificationRecord,
  OpportunityStage,
  BidStatus,
  PrequalificationStatus,
} from './types';

export interface OpportunityFilters extends PaginationParams {
  search?: string;
  stage?: OpportunityStage;
  clientType?: string;
  organizationId?: string;
}

export interface BidPackageFilters extends PaginationParams {
  opportunityId?: string;
  status?: BidStatus;
}

export interface PrequalificationFilters extends PaginationParams {
  organizationId?: string;
  status?: PrequalificationStatus;
}

export interface TenderSubmissionFilters extends PaginationParams {
  bidPackageId: string;
}

export interface TenderSubmission {
  id: string;
  bidPackageId: string;
  vendorName: string;
  submittedAt: string;
  totalPrice: number;
  technicalScore?: number;
  status: string;
  createdAt: string;
}

export interface PortfolioDashboard {
  totalOpportunities: number;
  totalWeightedValue: number;
  winRate: number;
  activeBids: number;
  pipelineByStage: Record<string, number>;
}

export const portfolioApi = {
  // ---- Opportunities ----

  getOpportunities: async (params?: OpportunityFilters): Promise<PaginatedResponse<Opportunity>> => {
    const response = await apiClient.get<PaginatedResponse<Opportunity>>('/portfolio/opportunities', { params });
    return response.data;
  },

  getOpportunityById: async (id: string): Promise<Opportunity> => {
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

  changeOpportunityStage: async (id: string, data: { stage: OpportunityStage; reason?: string }): Promise<Opportunity> => {
    const response = await apiClient.patch<Opportunity>(`/portfolio/opportunities/${id}/stage`, data);
    return response.data;
  },

  deleteOpportunity: async (id: string): Promise<void> => {
    await apiClient.delete(`/portfolio/opportunities/${id}`);
  },

  // ---- Dashboard ----

  getDashboard: async (organizationId?: string): Promise<PortfolioDashboard> => {
    const response = await apiClient.get<PortfolioDashboard>('/portfolio/dashboard', {
      params: organizationId ? { organizationId } : undefined,
    });
    return response.data;
  },

  // ---- Bid Packages ----

  getBidPackages: async (params?: BidPackageFilters): Promise<PaginatedResponse<BidPackage>> => {
    const response = await apiClient.get<PaginatedResponse<BidPackage>>('/portfolio/bid-packages', { params });
    return response.data;
  },

  getBidPackageById: async (id: string): Promise<BidPackage> => {
    const response = await apiClient.get<BidPackage>(`/portfolio/bid-packages/${id}`);
    return response.data;
  },

  createBidPackage: async (data: Partial<BidPackage>): Promise<BidPackage> => {
    const response = await apiClient.post<BidPackage>('/portfolio/bid-packages', data);
    return response.data;
  },

  updateBidPackage: async (id: string, data: Partial<BidPackage>): Promise<BidPackage> => {
    const response = await apiClient.put<BidPackage>(`/portfolio/bid-packages/${id}`, data);
    return response.data;
  },

  deleteBidPackage: async (id: string): Promise<void> => {
    await apiClient.delete(`/portfolio/bid-packages/${id}`);
  },

  // ---- Prequalifications ----

  getPrequalifications: async (params?: PrequalificationFilters): Promise<PaginatedResponse<PrequalificationRecord>> => {
    const response = await apiClient.get<PaginatedResponse<PrequalificationRecord>>('/portfolio/prequalifications', { params });
    return response.data;
  },

  getPrequalificationById: async (id: string): Promise<PrequalificationRecord> => {
    const response = await apiClient.get<PrequalificationRecord>(`/portfolio/prequalifications/${id}`);
    return response.data;
  },

  createPrequalification: async (data: Partial<PrequalificationRecord>): Promise<PrequalificationRecord> => {
    const response = await apiClient.post<PrequalificationRecord>('/portfolio/prequalifications', data);
    return response.data;
  },

  updatePrequalification: async (id: string, data: Partial<PrequalificationRecord>): Promise<PrequalificationRecord> => {
    const response = await apiClient.put<PrequalificationRecord>(`/portfolio/prequalifications/${id}`, data);
    return response.data;
  },

  deletePrequalification: async (id: string): Promise<void> => {
    await apiClient.delete(`/portfolio/prequalifications/${id}`);
  },

  // ---- Tender Submissions ----

  getTenderSubmissions: async (params: TenderSubmissionFilters): Promise<PaginatedResponse<TenderSubmission>> => {
    const response = await apiClient.get<PaginatedResponse<TenderSubmission>>('/portfolio/tender-submissions', { params });
    return response.data;
  },

  getTenderSubmissionById: async (id: string): Promise<TenderSubmission> => {
    const response = await apiClient.get<TenderSubmission>(`/portfolio/tender-submissions/${id}`);
    return response.data;
  },

  createTenderSubmission: async (data: Partial<TenderSubmission>): Promise<TenderSubmission> => {
    const response = await apiClient.post<TenderSubmission>('/portfolio/tender-submissions', data);
    return response.data;
  },

  deleteTenderSubmission: async (id: string): Promise<void> => {
    await apiClient.delete(`/portfolio/tender-submissions/${id}`);
  },
};
