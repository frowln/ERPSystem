import { apiClient } from './client';
import type {
  Ks2Document,
  Ks2Line,
  Ks3Document,
  ClosingDocStatus,
  PaginatedResponse,
  PaginationParams,
} from '@/types';
import type {
  Ks2Approval,
  Ks2VolumeCheck,
  Ks6aEntry,
  CorrectionAct,
  CreateCorrectionActRequest,
  Ks2PrintData,
  Ks3PrintData,
  Ks2PaymentInfo,
  EstimateItemForImport,
} from '@/modules/closing/types';

export interface ClosingDocFilters extends PaginationParams {
  status?: ClosingDocStatus;
  projectId?: string;
  contractId?: string;
  search?: string;
}

export interface Ks2DetailWithLines extends Ks2Document {
  lines: Ks2Line[];
}

export interface CreateKs2Request {
  number: string;
  name: string;
  documentDate: string;
  projectId: string;
  contractId: string;
  notes?: string;
}

export interface CreateKs2LineRequest {
  name: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  notes?: string;
}

export interface CreateKs3Request {
  number: string;
  name: string;
  documentDate: string;
  periodFrom: string;
  periodTo: string;
  projectId: string;
  contractId: string;
  retentionPercent: number;
  notes?: string;
}

export const closingApi = {
  getKs2Documents: async (params?: ClosingDocFilters): Promise<PaginatedResponse<Ks2Document>> => {
    const response = await apiClient.get<PaginatedResponse<Ks2Document>>('/ks2', { params });
    return response.data;
  },

  getKs2: async (id: string): Promise<Ks2Document> => {
    const response = await apiClient.get<Ks2Document>(`/ks2/${id}`);
    return response.data;
  },

  getKs2WithLines: async (id: string): Promise<Ks2DetailWithLines> => {
    const response = await apiClient.get<Ks2DetailWithLines>(`/ks2/${id}`);
    return response.data;
  },

  createKs2: async (data: CreateKs2Request) => {
    const response = await apiClient.post<{ id: string }>('/ks2', data);
    return response;
  },

  updateKs2: async (id: string, data: Partial<CreateKs2Request>) => {
    const response = await apiClient.put(`/ks2/${id}`, data);
    return response.data;
  },

  submitKs2: async (id: string) => {
    const response = await apiClient.post(`/ks2/${id}/submit`);
    return response.data;
  },

  signKs2: async (id: string) => {
    const response = await apiClient.post(`/ks2/${id}/sign`);
    return response.data;
  },

  closeKs2: async (id: string) => {
    const response = await apiClient.post(`/ks2/${id}/close`);
    return response.data;
  },

  addKs2Line: async (ks2Id: string, data: CreateKs2LineRequest) => {
    const response = await apiClient.post(`/ks2/${ks2Id}/lines`, data);
    return response.data;
  },

  removeKs2Line: async (lineId: string) => {
    const response = await apiClient.delete(`/ks2/lines/${lineId}`);
    return response.data;
  },

  getKs3Documents: async (params?: ClosingDocFilters): Promise<PaginatedResponse<Ks3Document>> => {
    const response = await apiClient.get<PaginatedResponse<Ks3Document>>('/ks3', { params });
    return response.data;
  },

  getKs3: async (id: string): Promise<Ks3Document> => {
    const response = await apiClient.get<Ks3Document>(`/ks3/${id}`);
    return response.data;
  },

  createKs3: async (data: CreateKs3Request) => {
    const response = await apiClient.post<{ id: string }>('/ks3', data);
    return response;
  },

  updateKs3: async (id: string, data: Partial<CreateKs3Request>) => {
    const response = await apiClient.put(`/ks3/${id}`, data);
    return response.data;
  },

  submitKs3: async (id: string) => {
    const response = await apiClient.post(`/ks3/${id}/submit`);
    return response.data;
  },

  signKs3: async (id: string) => {
    const response = await apiClient.post(`/ks3/${id}/sign`);
    return response.data;
  },

  closeKs3: async (id: string) => {
    const response = await apiClient.post(`/ks3/${id}/close`);
    return response.data;
  },

  linkKs2ToKs3: async (ks3Id: string, ks2Id: string) => {
    const response = await apiClient.post(`/ks3/${ks3Id}/link-ks2`, { ks2Id });
    return response.data;
  },

  unlinkKs2FromKs3: async (ks3Id: string, ks2Id: string) => {
    const response = await apiClient.delete(`/ks3/${ks3Id}/link-ks2/${ks2Id}`);
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // KS-2 Approval Workflow
  // ---------------------------------------------------------------------------

  getKs2Approvals: async (): Promise<Ks2Approval[]> => {
    const response = await apiClient.get<Ks2Approval[]>('/ks2/approvals');
    return response.data;
  },

  approveKs2: async (approvalId: string, comment?: string): Promise<void> => {
    await apiClient.post(`/approvals/steps/${approvalId}/approve`, { comment });
  },

  rejectKs2: async (approvalId: string, comment: string): Promise<void> => {
    await apiClient.post(`/approvals/steps/${approvalId}/reject`, { comment });
  },

  // ---------------------------------------------------------------------------
  // KS-2 Volume Verification
  // ---------------------------------------------------------------------------

  checkKs2Volumes: async (actId: string): Promise<Ks2VolumeCheck[]> => {
    const response = await apiClient.get<Ks2VolumeCheck[]>(`/ks2/${actId}/volume-check`);
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // KS-6a Journal
  // ---------------------------------------------------------------------------

  getKs6aEntries: async (projectId: string, year: number): Promise<Ks6aEntry[]> => {
    const response = await apiClient.get<Ks6aEntry[]>('/ks6a', {
      params: { projectId, year },
    });
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Correction Acts
  // ---------------------------------------------------------------------------

  getCorrectionActs: async (): Promise<CorrectionAct[]> => {
    const response = await apiClient.get<CorrectionAct[]>('/correction-acts');
    return response.data;
  },

  createCorrectionAct: async (data: CreateCorrectionActRequest): Promise<{ id: string }> => {
    const response = await apiClient.post<{ id: string }>('/correction-acts', data);
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // KS-2 / KS-3 Print Forms
  // ---------------------------------------------------------------------------

  getKs2PrintData: async (actId: string): Promise<Ks2PrintData> => {
    const response = await apiClient.get<Ks2PrintData>(`/ks2/${actId}/print`);
    return response.data;
  },

  getKs3PrintData: async (actId: string): Promise<Ks3PrintData> => {
    const response = await apiClient.get<Ks3PrintData>(`/ks3/${actId}/print`);
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Cross-cutting: KS-2 ↔ Estimate ↔ Invoice ↔ Payment
  // ---------------------------------------------------------------------------

  getKs2PaymentStatus: async (ks2Id: string): Promise<Ks2PaymentInfo> => {
    const response = await apiClient.get<Ks2PaymentInfo>(`/ks2/${ks2Id}/payment-status`);
    return response.data;
  },

  getEstimateItemsForKs2: async (estimateId: string, ks2Id?: string): Promise<EstimateItemForImport[]> => {
    const response = await apiClient.get<EstimateItemForImport[]>(`/estimates/${estimateId}/items-for-ks2`, {
      params: ks2Id ? { ks2Id } : undefined,
    });
    return response.data;
  },

  createInvoiceFromKs2: async (ks2Id: string): Promise<{ invoiceId: string }> => {
    const response = await apiClient.post<{ invoiceId: string }>(`/ks2/${ks2Id}/create-invoice`);
    return response.data;
  },

  generateKs2FromEstimate: async (data: {
    estimateId: string;
    projectId?: string;
    contractId?: string;
    documentDate?: string;
    periodFrom?: string;
    periodTo?: string;
    completionPercent?: number;
  }): Promise<{ id: string }> => {
    const response = await apiClient.post<{ id: string }>('/ks2/from-estimate', data);
    return response.data;
  },
};
