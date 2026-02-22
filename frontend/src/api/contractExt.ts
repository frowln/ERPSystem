import { apiClient } from './client';
import type { PaginatedResponse } from '@/types';

export type GuaranteeStatus = 'ACTIVE' | 'EXPIRED' | 'RELEASED';
export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
export type InsuranceStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface ContractGuarantee {
  id: string;
  contractId: string;
  guaranteeType: string;
  amount: number;
  currency: string;
  issuedBy?: string;
  issuedAt?: string;
  expiresAt?: string;
  status: GuaranteeStatus;
  documentUrl?: string;
}

export interface ContractMilestone {
  id: string;
  contractId: string;
  name: string;
  description?: string;
  dueDate: string;
  completionCriteria?: string;
  amount?: number;
  status: MilestoneStatus;
  completedAt?: string;
  evidenceUrl?: string;
}

export interface ContractInsurance {
  id: string;
  contractId: string;
  policyNumber: string;
  insuranceType: string;
  insurer: string;
  coveredAmount: number;
  premiumAmount?: number;
  startDate: string;
  endDate: string;
  status: InsuranceStatus;
  policyUrl?: string;
}

export interface CreateGuaranteePayload {
  guaranteeType: string;
  amount: number;
  currency?: string;
  issuedBy?: string;
  issuedAt?: string;
  expiresAt?: string;
  documentUrl?: string;
}

export interface CreateMilestonePayload {
  name: string;
  description?: string;
  dueDate: string;
  completionCriteria?: string;
  amount?: number;
}

export interface CreateInsurancePayload {
  policyNumber: string;
  insuranceType: string;
  insurer: string;
  coveredAmount: number;
  premiumAmount?: number;
  startDate: string;
  endDate: string;
  policyUrl?: string;
}

// ─── Supplement types ─────────────────────────────────────────────────────────

export type SupplementStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'SIGNED' | 'REJECTED';

export interface ContractSupplement {
  id: string;
  contractId: string;
  number: string;
  supplementDate: string;
  reason?: string;
  description?: string;
  amountChange?: number;
  newTotalAmount?: number;
  deadlineChange?: number;
  newDeadline?: string;
  status: SupplementStatus;
  statusDisplayName: string;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CreateSupplementPayload {
  contractId: string;
  number: string;
  supplementDate: string;
  reason?: string;
  description?: string;
  amountChange?: number;
  newTotalAmount?: number;
  deadlineChange?: number;
  newDeadline?: string;
}

// ─── Claim types ──────────────────────────────────────────────────────────────

export type ClaimStatus = 'FILED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'RESOLVED' | 'WITHDRAWN';
export type ClaimType = 'DELAY' | 'QUALITY_DEFECT' | 'PAYMENT_DEFAULT' | 'SCOPE_CHANGE' | 'OTHER';

export interface ContractClaim {
  id: string;
  contractId: string;
  code: string;
  claimType: ClaimType;
  claimTypeDisplayName: string;
  subject: string;
  description?: string;
  amount?: number;
  filedAt?: string;
  respondedAt?: string;
  responseText?: string;
  status: ClaimStatus;
  statusDisplayName: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CreateClaimPayload {
  contractId: string;
  claimType: ClaimType;
  subject: string;
  description?: string;
  amount?: number;
}

export const contractExtApi = {
  listGuarantees: async (contractId: string): Promise<ContractGuarantee[]> => {
    const response = await apiClient.get<PaginatedResponse<ContractGuarantee>>(
      `/contracts/${contractId}/guarantees`,
      { params: { size: 100, sort: 'createdAt,desc' } },
    );
    return response.data.content ?? [];
  },

  createGuarantee: async (contractId: string, data: CreateGuaranteePayload): Promise<ContractGuarantee> => {
    const response = await apiClient.post<ContractGuarantee>(
      `/contracts/${contractId}/guarantees`,
      data,
    );
    return response.data;
  },

  listMilestones: async (contractId: string): Promise<ContractMilestone[]> => {
    const response = await apiClient.get<PaginatedResponse<ContractMilestone>>(
      `/contracts/${contractId}/milestones`,
      { params: { size: 100, sort: 'dueDate,asc' } },
    );
    return response.data.content ?? [];
  },

  createMilestone: async (contractId: string, data: CreateMilestonePayload): Promise<ContractMilestone> => {
    const response = await apiClient.post<ContractMilestone>(
      `/contracts/${contractId}/milestones`,
      data,
    );
    return response.data;
  },

  completeMilestone: async (contractId: string, milestoneId: string, evidenceUrl?: string): Promise<ContractMilestone> => {
    const response = await apiClient.post<ContractMilestone>(
      `/contracts/${contractId}/milestones/${milestoneId}/complete`,
      {},
      { params: evidenceUrl ? { evidenceUrl } : undefined },
    );
    return response.data;
  },

  listInsurances: async (contractId: string): Promise<ContractInsurance[]> => {
    const response = await apiClient.get<PaginatedResponse<ContractInsurance>>(
      `/contracts/${contractId}/insurances`,
      { params: { size: 100, sort: 'createdAt,desc' } },
    );
    return response.data.content ?? [];
  },

  createInsurance: async (contractId: string, data: CreateInsurancePayload): Promise<ContractInsurance> => {
    const response = await apiClient.post<ContractInsurance>(
      `/contracts/${contractId}/insurances`,
      data,
    );
    return response.data;
  },

  // ─── Supplements ───────────────────────────────────────────────────────────

  listSupplements: async (contractId: string): Promise<ContractSupplement[]> => {
    const response = await apiClient.get<PaginatedResponse<ContractSupplement>>(
      '/contract-supplements',
      { params: { contractId, size: 100, sort: 'supplementDate,desc' } },
    );
    return response.data.content ?? [];
  },

  getSupplement: async (id: string): Promise<ContractSupplement> => {
    const response = await apiClient.get<ContractSupplement>(`/contract-supplements/${id}`);
    return response.data;
  },

  createSupplement: async (data: CreateSupplementPayload): Promise<ContractSupplement> => {
    const response = await apiClient.post<ContractSupplement>('/contract-supplements', data);
    return response.data;
  },

  approveSupplement: async (id: string): Promise<ContractSupplement> => {
    const response = await apiClient.post<ContractSupplement>(`/contract-supplements/${id}/approve`);
    return response.data;
  },

  signSupplement: async (id: string): Promise<ContractSupplement> => {
    const response = await apiClient.post<ContractSupplement>(`/contract-supplements/${id}/sign`);
    return response.data;
  },

  // ─── Claims ────────────────────────────────────────────────────────────────

  listClaims: async (contractId: string): Promise<ContractClaim[]> => {
    const response = await apiClient.get<PaginatedResponse<ContractClaim>>(
      '/contract-claims',
      { params: { contractId, size: 100, sort: 'filedAt,desc' } },
    );
    return response.data.content ?? [];
  },

  createClaim: async (data: CreateClaimPayload): Promise<ContractClaim> => {
    const response = await apiClient.post<ContractClaim>('/contract-claims', data);
    return response.data;
  },

  updateClaimStatus: async (id: string, status: ClaimStatus, notes?: string): Promise<ContractClaim> => {
    const response = await apiClient.post<ContractClaim>(`/contract-claims/${id}/update-status`, { status, notes });
    return response.data;
  },
};
