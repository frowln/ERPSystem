import { apiClient } from './client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EdoSendResult {
  sbisDocumentId: string;
  status: string;
  message: string;
}

export interface EdoStatusResult {
  status: string;
  deliveredAt?: string;
  signedAt?: string;
  message: string;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const edoExportApi = {
  sendKs2ToEdo: async (ks2Id: string): Promise<EdoSendResult> => {
    const response = await apiClient.post<EdoSendResult>(
      `/integrations/edo-export/ks2/${ks2Id}/send`,
    );
    return response.data;
  },

  sendKs3ToEdo: async (ks3Id: string): Promise<EdoSendResult> => {
    const response = await apiClient.post<EdoSendResult>(
      `/integrations/edo-export/ks3/${ks3Id}/send`,
    );
    return response.data;
  },

  checkEdoStatus: async (sbisDocId: string): Promise<EdoStatusResult> => {
    const response = await apiClient.get<EdoStatusResult>(
      `/integrations/edo-export/status/${sbisDocId}`,
    );
    return response.data;
  },
};
