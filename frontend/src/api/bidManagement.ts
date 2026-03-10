import { apiClient } from './client';

export interface BidPackage {
  id: string;
  projectId: string;
  organizationId: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'OPEN' | 'EVALUATION' | 'AWARDED' | 'CLOSED';
  bidDueDate?: string;
  scopeOfWork?: string;
  specSections?: string;
  invitationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BidInvitation {
  id: string;
  bidPackageId: string;
  vendorId?: string;
  vendorName: string;
  vendorEmail?: string;
  status: 'INVITED' | 'VIEWED' | 'SUBMITTED' | 'DECLINED' | 'DISQUALIFIED';
  invitedAt?: string;
  respondedAt?: string;
  bidAmount?: number;
  bidNotes?: string;
  attachmentsCount?: number;
  createdAt: string;
}

export interface BidEvaluation {
  id: string;
  bidPackageId: string;
  invitationId: string;
  criteriaName: string;
  score?: number;
  maxScore: number;
  weight: number;
  notes?: string;
  evaluatorName?: string;
  createdAt: string;
}

export interface LevelingMatrix {
  invitations: BidInvitation[];
  criteria: string[];
  scores: Record<string, Record<string, { score: number; maxScore: number; weight: number }>>;
  totals: Record<string, number>;
}

export const bidManagementApi = {
  // Packages
  getPackages: async (projectId?: string): Promise<BidPackage[]> => {
    const params = projectId ? { projectId } : {};
    const { data } = await apiClient.get('/bid-packages', { params });
    return data.data;
  },
  getPackage: async (id: string): Promise<BidPackage> => {
    const { data } = await apiClient.get(`/bid-packages/${id}`);
    return data.data;
  },
  createPackage: async (payload: Partial<BidPackage>): Promise<BidPackage> => {
    const { data } = await apiClient.post('/bid-packages', payload);
    return data.data;
  },
  updatePackage: async (id: string, payload: Partial<BidPackage>): Promise<BidPackage> => {
    const { data } = await apiClient.put(`/bid-packages/${id}`, payload);
    return data.data;
  },
  deletePackage: async (id: string): Promise<void> => {
    await apiClient.delete(`/bid-packages/${id}`);
  },

  // Invitations
  getInvitations: async (packageId: string): Promise<BidInvitation[]> => {
    const { data } = await apiClient.get(`/bid-packages/${packageId}/invitations`);
    return data.data;
  },
  createInvitation: async (packageId: string, payload: Partial<BidInvitation>): Promise<BidInvitation> => {
    const { data } = await apiClient.post(`/bid-packages/${packageId}/invitations`, payload);
    return data.data;
  },
  updateInvitation: async (packageId: string, invId: string, payload: Partial<BidInvitation>): Promise<BidInvitation> => {
    const { data } = await apiClient.put(`/bid-packages/${packageId}/invitations/${invId}`, payload);
    return data.data;
  },
  deleteInvitation: async (packageId: string, invId: string): Promise<void> => {
    await apiClient.delete(`/bid-packages/${packageId}/invitations/${invId}`);
  },

  // Evaluations
  getEvaluations: async (packageId: string): Promise<BidEvaluation[]> => {
    const { data } = await apiClient.get(`/bid-packages/${packageId}/evaluations`);
    return data.data;
  },
  createEvaluation: async (packageId: string, payload: Partial<BidEvaluation>): Promise<BidEvaluation> => {
    const { data } = await apiClient.post(`/bid-packages/${packageId}/evaluations`, payload);
    return data.data;
  },

  // Leveling
  getLevelingMatrix: async (packageId: string): Promise<LevelingMatrix> => {
    const { data } = await apiClient.get(`/bid-packages/${packageId}/leveling-matrix`);
    return data.data;
  },
};
