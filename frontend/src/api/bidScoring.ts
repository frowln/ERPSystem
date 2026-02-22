import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type BidComparisonStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';
export type BidCriteriaType = 'PRICE' | 'QUALITY' | 'DELIVERY' | 'EXPERIENCE' | 'FINANCIAL' | 'TECHNICAL' | 'CUSTOM';

export interface BidComparison {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: BidComparisonStatus;
  statusDisplayName?: string;
  rfqNumber?: string;
  category?: string;
  createdById?: string;
  approvedById?: string;
  approvedAt?: string;
  winnerVendorId?: string;
  winnerJustification?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface BidCriteria {
  id: string;
  bidComparisonId: string;
  criteriaType?: BidCriteriaType;
  criteriaTypeDisplayName?: string;
  name: string;
  description?: string;
  weight: number;
  maxScore: number;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BidScore {
  id: string;
  bidComparisonId: string;
  criteriaId: string;
  vendorId: string;
  vendorName?: string;
  score: number;
  weightedScore: number;
  comments?: string;
  scoredById?: string;
  scoredAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VendorRanking {
  vendorId: string;
  vendorName: string;
  totalWeightedScore: number;
}

export interface BidComparisonFilters extends PaginationParams {
  status?: BidComparisonStatus;
  projectId?: string;
}

export interface CreateBidComparisonPayload {
  projectId: string;
  title: string;
  description?: string;
  rfqNumber?: string;
  category?: string;
  createdById?: string;
}

export interface UpdateBidComparisonPayload {
  title?: string;
  description?: string;
  rfqNumber?: string;
  category?: string;
  winnerVendorId?: string;
  winnerJustification?: string;
}

export interface CreateBidCriteriaPayload {
  bidComparisonId: string;
  criteriaType?: BidCriteriaType;
  name: string;
  description?: string;
  weight: number;
  maxScore?: number;
  sortOrder?: number;
}

export interface UpdateBidCriteriaPayload {
  criteriaType?: BidCriteriaType;
  name?: string;
  description?: string;
  weight?: number;
  maxScore?: number;
  sortOrder?: number;
}

export interface CreateBidScorePayload {
  bidComparisonId: string;
  criteriaId: string;
  vendorId: string;
  vendorName?: string;
  score: number;
  comments?: string;
  scoredById?: string;
}

export interface UpdateBidScorePayload {
  score: number;
  comments?: string;
  vendorName?: string;
  scoredById?: string;
}

export const bidScoringApi = {
  // Bid comparisons
  getComparisons: async (params?: BidComparisonFilters): Promise<PaginatedResponse<BidComparison>> => {
    const response = await apiClient.get<PaginatedResponse<BidComparison>>('/bid-scoring/comparisons', { params });
    return response.data;
  },

  getComparison: async (id: string): Promise<BidComparison> => {
    const response = await apiClient.get<BidComparison>(`/bid-scoring/comparisons/${id}`);
    return response.data;
  },

  createComparison: async (data: CreateBidComparisonPayload): Promise<BidComparison> => {
    const response = await apiClient.post<BidComparison>('/bid-scoring/comparisons', data);
    return response.data;
  },

  updateComparison: async (id: string, data: UpdateBidComparisonPayload): Promise<BidComparison> => {
    const response = await apiClient.put<BidComparison>(`/bid-scoring/comparisons/${id}`, data);
    return response.data;
  },

  startComparison: async (id: string): Promise<BidComparison> => {
    const response = await apiClient.post<BidComparison>(`/bid-scoring/comparisons/${id}/start`);
    return response.data;
  },

  completeComparison: async (id: string): Promise<BidComparison> => {
    const response = await apiClient.post<BidComparison>(`/bid-scoring/comparisons/${id}/complete`);
    return response.data;
  },

  approveComparison: async (id: string, approvedById?: string): Promise<BidComparison> => {
    const response = await apiClient.post<BidComparison>(`/bid-scoring/comparisons/${id}/approve`, null, {
      params: approvedById ? { approvedById } : undefined,
    });
    return response.data;
  },

  deleteComparison: async (id: string): Promise<void> => {
    await apiClient.delete(`/bid-scoring/comparisons/${id}`);
  },

  // Criteria
  getCriteria: async (comparisonId: string): Promise<BidCriteria[]> => {
    const response = await apiClient.get<BidCriteria[]>(`/bid-scoring/comparisons/${comparisonId}/criteria`);
    return response.data;
  },

  createCriteria: async (data: CreateBidCriteriaPayload): Promise<BidCriteria> => {
    const response = await apiClient.post<BidCriteria>('/bid-scoring/criteria', data);
    return response.data;
  },

  updateCriteria: async (criteriaId: string, data: UpdateBidCriteriaPayload): Promise<BidCriteria> => {
    const response = await apiClient.put<BidCriteria>(`/bid-scoring/criteria/${criteriaId}`, data);
    return response.data;
  },

  deleteCriteria: async (criteriaId: string): Promise<void> => {
    await apiClient.delete(`/bid-scoring/criteria/${criteriaId}`);
  },

  // Scores
  getScores: async (comparisonId: string): Promise<BidScore[]> => {
    const response = await apiClient.get<BidScore[]>(`/bid-scoring/comparisons/${comparisonId}/scores`);
    return response.data;
  },

  getVendorScores: async (comparisonId: string, vendorId: string): Promise<BidScore[]> => {
    const response = await apiClient.get<BidScore[]>(`/bid-scoring/comparisons/${comparisonId}/scores/vendor/${vendorId}`);
    return response.data;
  },

  createScore: async (data: CreateBidScorePayload): Promise<BidScore> => {
    const response = await apiClient.post<BidScore>('/bid-scoring/scores', data);
    return response.data;
  },

  updateScore: async (scoreId: string, data: UpdateBidScorePayload): Promise<BidScore> => {
    const response = await apiClient.put<BidScore>(`/bid-scoring/scores/${scoreId}`, data);
    return response.data;
  },

  deleteScore: async (scoreId: string): Promise<void> => {
    await apiClient.delete(`/bid-scoring/scores/${scoreId}`);
  },

  // Ranking
  getRanking: async (comparisonId: string): Promise<VendorRanking[]> => {
    const response = await apiClient.get<VendorRanking[]>(`/bid-scoring/comparisons/${comparisonId}/ranking`);
    return response.data;
  },

  getWinner: async (comparisonId: string): Promise<VendorRanking> => {
    const response = await apiClient.get<VendorRanking>(`/bid-scoring/comparisons/${comparisonId}/winner`);
    return response.data;
  },

  upsertScoresBatch: async (data: { scores: CreateBidScorePayload[] }): Promise<BidScore[]> => {
    const response = await apiClient.put<BidScore[]>('/bid-scoring/scores/batch', data.scores);
    return response.data;
  },
};
