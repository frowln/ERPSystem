import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type HiddenWorkActStatus = 'DRAFT' | 'PENDING_INSPECTION' | 'INSPECTED' | 'APPROVED' | 'REJECTED';

export type AttachmentType = 'PHOTO' | 'GEODETIC_SURVEY' | 'MATERIAL_CERTIFICATE' | 'DRAWING' | 'EXECUTIVE_SCHEME' | 'OTHER';

export type SignerRole = 'DEVELOPER_REPRESENTATIVE' | 'CONTRACTOR_REPRESENTATIVE' | 'DESIGN_SUPERVISION' | 'TECHNICAL_SUPERVISION' | 'OTHER_INSPECTOR';

export type SignatureStatus = 'PENDING' | 'SIGNED' | 'REJECTED';

export interface HiddenWorkAct {
  id: string;
  projectId: string;
  actNumber: string | null;
  date: string;
  workDescription: string;
  location: string | null;
  inspectorId: string | null;
  contractorId: string | null;
  status: HiddenWorkActStatus;
  statusDisplayName: string;
  photoIds: string | null;
  notes: string | null;
  materialsUsed: string | null;
  geodeticData: string | null;
  drawingReference: string | null;
  sniPReference: string | null;
  constructionMethod: string | null;
  nextWorkPermitted: string | null;
  notificationSentAt: string | null;
  inspectionDate: string | null;
  signedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface HiddenWorkActAttachment {
  id: string;
  actId: string;
  attachmentType: AttachmentType;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  description: string | null;
  createdAt: string;
}

export interface HiddenWorkActSignature {
  id: string;
  actId: string;
  signerUserId: string;
  signerName: string;
  signerRole: SignerRole;
  status: SignatureStatus;
  signedAt: string | null;
  kepSignatureId: string | null;
  rejectionReason: string | null;
  commentText: string | null;
  createdAt: string;
}

export interface CreateHiddenWorkActRequest {
  projectId: string;
  actNumber?: string;
  date: string;
  workDescription: string;
  location?: string;
  inspectorId?: string;
  contractorId?: string;
  photoIds?: string;
  notes?: string;
  materialsUsed?: string;
  geodeticData?: string;
  drawingReference?: string;
  sniPReference?: string;
  constructionMethod?: string;
  nextWorkPermitted?: string;
  inspectionDate?: string;
}

export interface HiddenWorkActFilters extends PaginationParams {
  projectId?: string;
  status?: HiddenWorkActStatus;
}

export const hiddenWorkActApi = {
  getAll: async (params?: HiddenWorkActFilters): Promise<PaginatedResponse<HiddenWorkAct>> => {
    const response = await apiClient.get<{ data: PaginatedResponse<HiddenWorkAct> }>('/hidden-work-acts', { params });
    return response.data.data ?? response.data as unknown as PaginatedResponse<HiddenWorkAct>;
  },

  getById: async (id: string): Promise<HiddenWorkAct> => {
    const response = await apiClient.get<{ data: HiddenWorkAct }>(`/hidden-work-acts/${id}`);
    return response.data.data ?? response.data as unknown as HiddenWorkAct;
  },

  create: async (data: CreateHiddenWorkActRequest): Promise<HiddenWorkAct> => {
    const response = await apiClient.post<{ data: HiddenWorkAct }>('/hidden-work-acts', data);
    return response.data.data ?? response.data as unknown as HiddenWorkAct;
  },

  update: async (id: string, data: CreateHiddenWorkActRequest): Promise<HiddenWorkAct> => {
    const response = await apiClient.put<{ data: HiddenWorkAct }>(`/hidden-work-acts/${id}`, data);
    return response.data.data ?? response.data as unknown as HiddenWorkAct;
  },

  updateStatus: async (id: string, status: HiddenWorkActStatus): Promise<HiddenWorkAct> => {
    const response = await apiClient.patch<{ data: HiddenWorkAct }>(`/hidden-work-acts/${id}/status`, null, { params: { status } });
    return response.data.data ?? response.data as unknown as HiddenWorkAct;
  },

  submitForInspection: async (id: string): Promise<HiddenWorkAct> => {
    const response = await apiClient.post<{ data: HiddenWorkAct }>(`/hidden-work-acts/${id}/submit-for-inspection`);
    return response.data.data ?? response.data as unknown as HiddenWorkAct;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/hidden-work-acts/${id}`);
  },

  // Signatures
  getSignatures: async (actId: string): Promise<HiddenWorkActSignature[]> => {
    const response = await apiClient.get<{ data: HiddenWorkActSignature[] }>(`/hidden-work-acts/${actId}/signatures`);
    return response.data.data ?? response.data as unknown as HiddenWorkActSignature[];
  },

  addSignatureRequest: async (actId: string, signerUserId: string, signerName: string, role: SignerRole): Promise<HiddenWorkActSignature> => {
    const response = await apiClient.post<{ data: HiddenWorkActSignature }>(`/hidden-work-acts/${actId}/signatures`, null, {
      params: { signerUserId, signerName, role },
    });
    return response.data.data ?? response.data as unknown as HiddenWorkActSignature;
  },

  sign: async (actId: string, signerUserId: string, kepSignatureId?: string, comment?: string): Promise<HiddenWorkActSignature> => {
    const response = await apiClient.post<{ data: HiddenWorkActSignature }>(`/hidden-work-acts/${actId}/signatures/sign`, null, {
      params: { signerUserId, kepSignatureId, comment },
    });
    return response.data.data ?? response.data as unknown as HiddenWorkActSignature;
  },

  rejectSignature: async (actId: string, signerUserId: string, reason: string): Promise<HiddenWorkActSignature> => {
    const response = await apiClient.post<{ data: HiddenWorkActSignature }>(`/hidden-work-acts/${actId}/signatures/reject`, null, {
      params: { signerUserId, reason },
    });
    return response.data.data ?? response.data as unknown as HiddenWorkActSignature;
  },

  // Attachments
  getAttachments: async (actId: string): Promise<HiddenWorkActAttachment[]> => {
    const response = await apiClient.get<{ data: HiddenWorkActAttachment[] }>(`/hidden-work-acts/${actId}/attachments`);
    return response.data.data ?? response.data as unknown as HiddenWorkActAttachment[];
  },

  addAttachment: async (actId: string, type: AttachmentType, fileName: string, filePath: string, fileSize?: number, mimeType?: string, description?: string): Promise<HiddenWorkActAttachment> => {
    const response = await apiClient.post<{ data: HiddenWorkActAttachment }>(`/hidden-work-acts/${actId}/attachments`, null, {
      params: { type, fileName, filePath, fileSize, mimeType, description },
    });
    return response.data.data ?? response.data as unknown as HiddenWorkActAttachment;
  },

  removeAttachment: async (attachmentId: string): Promise<void> => {
    await apiClient.delete(`/hidden-work-acts/attachments/${attachmentId}`);
  },
};
