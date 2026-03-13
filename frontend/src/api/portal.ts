import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  PortalUser,
  PortalProject,
  PortalMessage,
  PortalDocument,
  PortalAccess,
  CreatePortalUserRequest,
  SendPortalMessageRequest,
  PortalKs2Draft,
  PortalKs2DraftStatus,
  CreatePortalKs2DraftRequest,
  PortalTask,
  PortalTaskStatus,
  CreatePortalTaskRequest,
  PortalProposal,
  PortalProposalDecisionRequest,
  PortalInvoice,
  PortalInvoiceStatus,
  CreatePortalInvoiceRequest,
  PortalContract,
  PortalContractStatus,
  PortalScheduleItem,
  PortalDailyReport,
  PortalDefect,
  PortalRfi,
  PortalRfiResponse,
  PortalPhotoReport,
  PortalDocumentSignature,
} from '@/modules/portal/types';

export interface PortalFilters extends PaginationParams {
  search?: string;
  projectId?: string;
  status?: string;
  category?: string;
  priority?: string;
}

export const portalApi = {
  // Portal projects
  getProjects: async (params?: PortalFilters): Promise<PaginatedResponse<PortalProject>> => {
    const response = await apiClient.get<PaginatedResponse<PortalProject>>('/portal/projects', { params });
    return response.data;
  },

  getProject: async (id: string): Promise<PortalProject> => {
    const response = await apiClient.get<PortalProject>(`/portal/projects/${id}`);
    return response.data;
  },

  // Portal documents
  getDocuments: async (params?: PortalFilters): Promise<PaginatedResponse<PortalDocument>> => {
    const response = await apiClient.get<PaginatedResponse<PortalDocument>>('/portal/documents', { params });
    return response.data;
  },

  downloadDocument: async (id: string): Promise<Blob> => {
    const response = await apiClient.post(`/portal/documents/${id}/download`, null, { responseType: 'blob' });
    return response.data;
  },

  // Portal messages
  getMessages: async (params?: PortalFilters): Promise<PaginatedResponse<PortalMessage>> => {
    const response = await apiClient.get<PaginatedResponse<PortalMessage>>('/portal/messages', { params });
    return response.data;
  },

  sendMessage: async (data: SendPortalMessageRequest): Promise<PortalMessage> => {
    const response = await apiClient.post<PortalMessage>('/portal/messages', data);
    return response.data;
  },

  markMessageRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/portal/messages/${id}/read`);
  },

  // Portal admin
  getUsers: async (params?: PaginationParams): Promise<PaginatedResponse<PortalUser>> => {
    const response = await apiClient.get<PaginatedResponse<PortalUser>>('/portal/admin/users', { params });
    return response.data;
  },

  createUser: async (data: CreatePortalUserRequest): Promise<PortalUser> => {
    const response = await apiClient.post<PortalUser>('/portal/admin/users', data);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<PortalUser>): Promise<PortalUser> => {
    const response = await apiClient.put<PortalUser>(`/portal/admin/users/${id}`, data);
    return response.data;
  },

  deactivateUser: async (id: string, active = false): Promise<void> => {
    await apiClient.patch(`/portal/admin/users/${id}/status`, { active });
  },

  getAccessList: async (params?: PortalFilters): Promise<PaginatedResponse<PortalAccess>> => {
    const response = await apiClient.get<PaginatedResponse<PortalAccess>>('/portal/admin/access', { params });
    return response.data;
  },

  grantAccess: async (userId: string, projectId: string, accessLevel: string): Promise<PortalAccess> => {
    const response = await apiClient.post<PortalAccess>('/portal/admin/access', { userId, projectId, accessLevel });
    return response.data;
  },

  revokeAccess: async (portalUserId: string, projectId: string): Promise<void> => {
    await apiClient.delete(`/portal/admin/access/${portalUserId}/${projectId}`);
  },

  getDashboardStats: async (): Promise<{
    totalUsers: number;
    activeProjects: number;
    sharedDocuments: number;
    unreadMessages: number;
    recentActivity: { description: string; date: string }[];
  }> => {
    const response = await apiClient.get('/portal/client/dashboard');
    return response.data;
  },

  // Portal KS-2 Drafts
  getKs2Drafts: async (params?: { status?: PortalKs2DraftStatus; size?: number }): Promise<PaginatedResponse<PortalKs2Draft>> => {
    const response = await apiClient.get<PaginatedResponse<PortalKs2Draft>>('/portal/ks2-drafts', { params });
    return response.data;
  },

  createKs2Draft: async (data: CreatePortalKs2DraftRequest): Promise<PortalKs2Draft> => {
    const response = await apiClient.post<PortalKs2Draft>('/portal/ks2-drafts', data);
    return response.data;
  },

  submitKs2Draft: async (id: string): Promise<PortalKs2Draft> => {
    const response = await apiClient.post<PortalKs2Draft>(`/portal/ks2-drafts/${id}/submit`);
    return response.data;
  },

  reviewKs2Draft: async (id: string, data: { approved: boolean; reviewComment?: string }): Promise<PortalKs2Draft> => {
    const response = await apiClient.post<PortalKs2Draft>(`/portal/ks2-drafts/${id}/review`, data);
    return response.data;
  },

  deleteKs2Draft: async (id: string): Promise<void> => {
    await apiClient.delete(`/portal/ks2-drafts/${id}`);
  },

  // Portal Tasks
  getTasks: async (params?: { status?: PortalTaskStatus; size?: number }): Promise<PaginatedResponse<PortalTask>> => {
    const response = await apiClient.get<PaginatedResponse<PortalTask>>('/portal/tasks', { params });
    return response.data;
  },

  createTask: async (data: CreatePortalTaskRequest): Promise<PortalTask> => {
    const response = await apiClient.post<PortalTask>('/portal/tasks', data);
    return response.data;
  },

  updateTaskStatus: async (id: string, status: PortalTaskStatus, note?: string): Promise<PortalTask> => {
    const response = await apiClient.patch<PortalTask>(`/portal/tasks/${id}/status`, { status, completionNote: note });
    return response.data;
  },

  // Portal Proposals (CP Approval)
  getProposal: async (id: string): Promise<PortalProposal> => {
    const response = await apiClient.get<PortalProposal>(`/portal/proposals/${id}`);
    return response.data;
  },

  submitProposalDecision: async (id: string, data: PortalProposalDecisionRequest): Promise<PortalProposal> => {
    const response = await apiClient.post<PortalProposal>(`/portal/proposals/${id}/decision`, data);
    return response.data;
  },

  // Portal Invoices
  getInvoices: async (params?: { status?: PortalInvoiceStatus; size?: number }): Promise<PaginatedResponse<PortalInvoice>> => {
    const response = await apiClient.get<PaginatedResponse<PortalInvoice>>('/portal/invoices', { params });
    return response.data;
  },

  createInvoice: async (data: CreatePortalInvoiceRequest): Promise<PortalInvoice> => {
    const response = await apiClient.post<PortalInvoice>('/portal/invoices', data);
    return response.data;
  },

  submitInvoice: async (id: string): Promise<PortalInvoice> => {
    const response = await apiClient.post<PortalInvoice>(`/portal/invoices/${id}/submit`);
    return response.data;
  },

  deleteInvoice: async (id: string): Promise<void> => {
    await apiClient.delete(`/portal/invoices/${id}`);
  },

  // Portal Contracts
  getContracts: async (params?: { status?: PortalContractStatus; size?: number }): Promise<PaginatedResponse<PortalContract>> => {
    const response = await apiClient.get<PaginatedResponse<PortalContract>>('/portal/contracts', { params });
    return response.data;
  },

  // Portal Schedule
  getSchedule: async (params?: { size?: number }): Promise<PaginatedResponse<PortalScheduleItem>> => {
    const response = await apiClient.get<PaginatedResponse<PortalScheduleItem>>('/portal/schedule', { params });
    return response.data;
  },

  // Portal Daily Reports
  getDailyReports: async (params?: PortalFilters): Promise<PaginatedResponse<PortalDailyReport>> => {
    const response = await apiClient.get<PaginatedResponse<PortalDailyReport>>('/portal/daily-reports', { params });
    return response.data;
  },

  createDailyReport: async (data: Partial<PortalDailyReport>): Promise<PortalDailyReport> => {
    const response = await apiClient.post<PortalDailyReport>('/portal/daily-reports', data);
    return response.data;
  },

  submitDailyReport: async (id: string): Promise<PortalDailyReport> => {
    const response = await apiClient.post<PortalDailyReport>(`/portal/daily-reports/${id}/submit`);
    return response.data;
  },

  deleteDailyReport: async (id: string): Promise<void> => {
    await apiClient.delete(`/portal/daily-reports/${id}`);
  },

  // Portal Defects
  getDefects: async (params?: PortalFilters): Promise<PaginatedResponse<PortalDefect>> => {
    const response = await apiClient.get<PaginatedResponse<PortalDefect>>('/portal/defects', { params });
    return response.data;
  },

  createDefect: async (data: Partial<PortalDefect>): Promise<PortalDefect> => {
    const response = await apiClient.post<PortalDefect>('/portal/defects', data);
    return response.data;
  },

  // Portal RFI
  getRfis: async (params?: PortalFilters): Promise<PaginatedResponse<PortalRfi>> => {
    const response = await apiClient.get<PaginatedResponse<PortalRfi>>('/portal/rfis', { params });
    return response.data;
  },

  createRfi: async (data: Partial<PortalRfi>): Promise<PortalRfi> => {
    const response = await apiClient.post<PortalRfi>('/portal/rfis', data);
    return response.data;
  },

  getRfiResponses: async (rfiId: string): Promise<PortalRfiResponse[]> => {
    const response = await apiClient.get<PortalRfiResponse[]>(`/portal/rfis/${rfiId}/responses`);
    return response.data;
  },

  addRfiResponse: async (rfiId: string, data: { response: string }): Promise<PortalRfiResponse> => {
    const response = await apiClient.post<PortalRfiResponse>(`/portal/rfis/${rfiId}/responses`, data);
    return response.data;
  },

  // Portal Photos
  getPhotos: async (params?: PortalFilters): Promise<PaginatedResponse<PortalPhotoReport>> => {
    const response = await apiClient.get<PaginatedResponse<PortalPhotoReport>>('/portal/photos', { params });
    return response.data;
  },

  uploadPhoto: async (data: FormData | Record<string, unknown>): Promise<PortalPhotoReport> => {
    const response = await apiClient.post<PortalPhotoReport>('/portal/photos', data);
    return response.data;
  },

  deletePhoto: async (id: string): Promise<void> => {
    await apiClient.delete(`/portal/photos/${id}`);
  },

  // Portal Signatures
  getSignatures: async (params?: PortalFilters): Promise<PaginatedResponse<PortalDocumentSignature>> => {
    const response = await apiClient.get<PaginatedResponse<PortalDocumentSignature>>('/portal/signatures', { params });
    return response.data;
  },

  signDocument: async (id: string): Promise<PortalDocumentSignature> => {
    const response = await apiClient.post<PortalDocumentSignature>(`/portal/signatures/${id}/sign`);
    return response.data;
  },

  rejectSignature: async (id: string, reason: string): Promise<PortalDocumentSignature> => {
    const response = await apiClient.post<PortalDocumentSignature>(`/portal/signatures/${id}/reject`, { reason });
    return response.data;
  },
};
