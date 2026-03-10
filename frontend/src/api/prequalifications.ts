import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Types — aligned with backend DTOs
// ---------------------------------------------------------------------------

/** Maps to backend PrequalificationResponse */
export interface Prequalification {
  id: string;
  companyName: string;
  inn: string;
  contactPerson: string;
  workType: string;
  annualRevenue: number;
  yearsInBusiness: number;
  hasSroMembership: boolean;
  sroNumber: string;
  totalScore: number;
  financialScore: number;
  experienceScore: number;
  safetyScore: number;
  qualificationResult: string;
  status: string;
  createdAt: string;
  // Extra fields kept for frontend convenience (may come from enriched responses)
  contactPhone?: string;
  contactEmail?: string;
  employeeCount?: number;
  notes?: string;
  updatedAt?: string;
}

/** Maps to backend CreatePrequalificationRequest */
export interface CreatePrequalificationRequest {
  companyName: string;
  inn?: string;
  counterpartyId?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  workType?: string;
  annualRevenue?: number;
  yearsInBusiness?: number;
  hasNoDebts?: boolean;
  hasCreditLine?: boolean;
  similarProjectsCount?: number;
  maxProjectValue?: number;
  hasReferences?: boolean;
  hasSroMembership?: boolean;
  sroNumber?: string;
  hasIsoCertification?: boolean;
  hasSafetyCertification?: boolean;
  ltir?: number;
  hasSafetyPlan?: boolean;
  noFatalIncidents3y?: boolean;
  hasLiabilityInsurance?: boolean;
  insuranceCoverage?: number;
  canProvideBankGuarantee?: boolean;
  employeeCount?: number;
  hasOwnEquipment?: boolean;
  hasOwnTransport?: boolean;
  notes?: string;
}

export type UpdatePrequalificationRequest = CreatePrequalificationRequest;

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const prequalificationsApi = {
  /** Get list of all prequalifications */
  getList: async (): Promise<Prequalification[]> => {
    const response = await apiClient.get<any>('/prequalifications');
    const d = response.data;
    return Array.isArray(d) ? d : d?.content ?? [];
  },

  /** Get a single prequalification by ID */
  getById: async (id: string): Promise<Prequalification> => {
    const response = await apiClient.get<Prequalification>(`/prequalifications/${id}`);
    return response.data;
  },

  /** Create a new prequalification questionnaire */
  create: async (data: CreatePrequalificationRequest): Promise<Prequalification> => {
    const response = await apiClient.post<Prequalification>('/prequalifications', data);
    return response.data;
  },

  /** Update an existing prequalification questionnaire */
  update: async (id: string, data: UpdatePrequalificationRequest): Promise<Prequalification> => {
    const response = await apiClient.put<Prequalification>(`/prequalifications/${id}`, data);
    return response.data;
  },
};
