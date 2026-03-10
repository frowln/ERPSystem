import { apiClient } from './client';
import type { PaginatedResponse } from '@/types';

export interface EmailMessage {
  id: string;
  messageUid: string;
  folder: string;
  fromAddress: string;
  fromName?: string;
  toAddresses: string[];
  ccAddresses?: string[];
  subject?: string;
  bodyText?: string;
  bodyHtml?: string;
  receivedAt: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachments?: EmailAttachment[];
  linkedProjectIds?: string[];
  createdAt: string;
}

export interface EmailAttachment {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface SendEmailRequest {
  to: string[];
  cc?: string[];
  subject: string;
  bodyHtml: string;
}

export interface ReplyEmailRequest {
  bodyHtml: string;
  replyAll?: boolean;
}

export interface ForwardEmailRequest {
  to: string[];
  cc?: string[];
  bodyHtml?: string;
}

export interface EmailListParams {
  folder?: string;
  page?: number;
  size?: number;
  search?: string;
}

export const emailApi = {
  getMessages: async (params?: EmailListParams): Promise<PaginatedResponse<EmailMessage>> => {
    const response = await apiClient.get<PaginatedResponse<EmailMessage>>('/v1/email/messages', { params });
    return response.data;
  },

  getMessage: async (id: string): Promise<EmailMessage> => {
    const response = await apiClient.get<EmailMessage>(`/v1/email/messages/${id}`);
    return response.data;
  },

  markRead: async (id: string): Promise<void> => {
    await apiClient.post(`/v1/email/messages/${id}/read`);
  },

  markUnread: async (id: string): Promise<void> => {
    await apiClient.post(`/v1/email/messages/${id}/unread`);
  },

  star: async (id: string): Promise<void> => {
    await apiClient.post(`/v1/email/messages/${id}/star`);
  },

  unstar: async (id: string): Promise<void> => {
    await apiClient.post(`/v1/email/messages/${id}/unstar`);
  },

  deleteMessage: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/email/messages/${id}`);
  },

  send: async (data: SendEmailRequest): Promise<EmailMessage> => {
    const response = await apiClient.post<EmailMessage>('/v1/email/send', data);
    return response.data;
  },

  reply: async (id: string, data: ReplyEmailRequest): Promise<EmailMessage> => {
    const response = await apiClient.post<EmailMessage>(`/v1/email/reply/${id}`, data);
    return response.data;
  },

  forward: async (id: string, data: ForwardEmailRequest): Promise<EmailMessage> => {
    const response = await apiClient.post<EmailMessage>(`/v1/email/forward/${id}`, data);
    return response.data;
  },

  downloadAttachmentUrl: (emailId: string, attachmentId: string): string =>
    `/api/v1/email/messages/${emailId}/attachments/${attachmentId}/download`,

  linkProject: async (emailId: string, projectId: string): Promise<void> => {
    await apiClient.post(`/v1/email/messages/${emailId}/link-project`, { projectId });
  },

  unlinkProject: async (emailId: string, projectId: string): Promise<void> => {
    await apiClient.delete(`/v1/email/messages/${emailId}/unlink-project/${projectId}`);
  },

  getProjectMessages: async (projectId: string): Promise<EmailMessage[]> => {
    const response = await apiClient.get<EmailMessage[]>(`/v1/email/projects/${projectId}/messages`);
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{ count: number }>('/v1/email/unread-count');
    return response.data.count;
  },

  sync: async (): Promise<{ status: string }> => {
    const response = await apiClient.post<{ status: string }>('/v1/email/sync');
    return response.data;
  },
};
