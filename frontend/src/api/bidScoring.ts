import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type BidComparisonStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type BidCriteriaType = 'PRICE' | 'TECHNICAL' | 'EXPERIENCE' | 'TIMELINE' | 'QUALITY' | 'SAFETY' | 'CUSTOM';

export interface BidComparison {
  id: string;
  number: string;
  title: string;
  description: string;
  status: BidComparisonStatus;
  projectId: string;
  projectName: string;
  purchaseRequestId?: string;
  bidderCount: number;
  criteriaCount: number;
  winnerName?: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

export interface BidCriteria {
  id: string;
  comparisonId: string;
  name: string;
  type: BidCriteriaType;
  weight: number;
  description?: string;
  minScore: number;
  maxScore: number;
  sortOrder: number;
}

export interface BidScore {
  id: string;
  comparisonId: string;
  criteriaId: string;
  bidderName: string;
  bidderOrganization: string;
  score: number;
  normalizedScore: number;
  comment?: string;
  evaluatedBy: string;
  evaluatedAt: string;
}

export interface BidderSummary {
  bidderName: string;
  bidderOrganization: string;
  totalWeightedScore: number;
  rank: number;
  scores: BidScore[];
}

export interface BidComparisonFilters extends PaginationParams {
  status?: BidComparisonStatus;
  projectId?: string;
  search?: string;
}

export const bidScoringApi = {
  // Bid Comparisons
  getComparisons: async (params?: BidComparisonFilters): Promise<PaginatedResponse<BidComparison>> => {
    const response = await apiClient.get<PaginatedResponse<BidComparison>>('/bid-scoring/comparisons', { params });
    return response.data;
  },

  getComparison: async (id: string): Promise<BidComparison> => {
    const response = await apiClient.get<BidComparison>(`/bid-scoring/comparisons/${id}`);
    return response.data;
  },

  createComparison: async (data: Partial<BidComparison>): Promise<BidComparison> => {
    const response = await apiClient.post<BidComparison>('/bid-scoring/comparisons', data);
    return response.data;
  },

  updateComparison: async (id: string, data: Partial<BidComparison>): Promise<BidComparison> => {
    const response = await apiClient.put<BidComparison>(`/bid-scoring/comparisons/${id}`, data);
    return response.data;
  },

  deleteComparison: async (id: string): Promise<void> => {
    await apiClient.delete(`/bid-scoring/comparisons/${id}`);
  },

  completeComparison: async (id: string, winnerId: string): Promise<BidComparison> => {
    const response = await apiClient.post<BidComparison>(`/bid-scoring/comparisons/${id}/complete`, { winnerId });
    return response.data;
  },

  // Bid Criteria
  getCriteria: async (comparisonId: string): Promise<BidCriteria[]> => {
    const response = await apiClient.get<BidCriteria[]>(`/bid-scoring/comparisons/${comparisonId}/criteria`);
    return response.data;
  },

  createCriteria: async (comparisonId: string, data: Partial<BidCriteria>): Promise<BidCriteria> => {
    const response = await apiClient.post<BidCriteria>(`/bid-scoring/comparisons/${comparisonId}/criteria`, data);
    return response.data;
  },

  updateCriteria: async (comparisonId: string, criteriaId: string, data: Partial<BidCriteria>): Promise<BidCriteria> => {
    const response = await apiClient.put<BidCriteria>(`/bid-scoring/comparisons/${comparisonId}/criteria/${criteriaId}`, data);
    return response.data;
  },

  deleteCriteria: async (comparisonId: string, criteriaId: string): Promise<void> => {
    await apiClient.delete(`/bid-scoring/comparisons/${comparisonId}/criteria/${criteriaId}`);
  },

  // Bid Scores
  getScores: async (comparisonId: string): Promise<BidScore[]> => {
    const response = await apiClient.get<BidScore[]>(`/bid-scoring/comparisons/${comparisonId}/scores`);
    return response.data;
  },

  submitScore: async (comparisonId: string, data: Partial<BidScore>): Promise<BidScore> => {
    const response = await apiClient.post<BidScore>(`/bid-scoring/comparisons/${comparisonId}/scores`, data);
    return response.data;
  },

  updateScore: async (comparisonId: string, scoreId: string, data: Partial<BidScore>): Promise<BidScore> => {
    const response = await apiClient.put<BidScore>(`/bid-scoring/comparisons/${comparisonId}/scores/${scoreId}`, data);
    return response.data;
  },

  getBidderSummaries: async (comparisonId: string): Promise<BidderSummary[]> => {
    const response = await apiClient.get<BidderSummary[]>(`/bid-scoring/comparisons/${comparisonId}/summary`);
    return response.data;
  },
};
