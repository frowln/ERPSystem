import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SroVerificationResult {
  id: string;
  inn: string;
  companyName: string;
  isMember: boolean;
  sroName: string;
  sroNumber: string;
  certificateNumber: string;
  memberSince: string;
  expiresAt: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXCLUDED' | 'NOT_FOUND';
  allowedWorkTypes: string[];
  compensationFund: number;
  competencyLevel: number;
  verifiedAt: string;
  source: string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const sroApi = {
  /** Verify contractor SRO membership by INN (uses 24h cache) */
  verifySro: async (inn: string): Promise<SroVerificationResult> => {
    const response = await apiClient.get<SroVerificationResult>(`/sro/verify/${inn}`);
    return response.data;
  },

  /** Force refresh SRO verification bypassing cache */
  refreshSro: async (inn: string): Promise<SroVerificationResult> => {
    const response = await apiClient.post<SroVerificationResult>(`/sro/verify/${inn}/refresh`);
    return response.data;
  },

  /** Get all SRO verification history (audit) */
  getSroHistory: async (): Promise<SroVerificationResult[]> => {
    const response = await apiClient.get<SroVerificationResult[]>('/sro/history');
    return response.data;
  },

  /** Get SRO verification history for a specific INN */
  getSroHistoryByInn: async (inn: string): Promise<SroVerificationResult[]> => {
    const response = await apiClient.get<SroVerificationResult[]>(`/sro/history/${inn}`);
    return response.data;
  },
};
