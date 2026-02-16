import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  AddTicketCommentRequest,
  CreateTicketRequest,
  SupportTicket,
  SupportTicketCategory,
  TicketComment,
  TicketDashboardStats,
  TicketPriority,
  TicketStatus,
  UpdateTicketRequest,
} from '@/modules/support/types';

interface BackendSupportTicketResponse {
  id: string;
  code: string;
  subject: string;
  description: string;
  category?: string | null;
  priority: TicketPriority;
  priorityDisplayName?: string | null;
  status: TicketStatus;
  statusDisplayName?: string | null;
  reporterId?: string | null;
  assigneeId?: string | null;
  dueDate?: string | null;
  resolvedAt?: string | null;
  satisfactionRating?: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
}

interface BackendTicketCommentResponse {
  id: string;
  ticketId: string;
  authorId?: string | null;
  content: string;
  isInternal: boolean;
  attachmentUrls?: string | null;
  createdAt: string;
}

interface BackendSupportTicketCategoryResponse {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  defaultAssigneeId?: string | null;
  slaHours?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketFilters extends PaginationParams {
  status?: TicketStatus;
  search?: string;
}

function shortUserLabel(userId?: string | null): string | undefined {
  if (!userId) return undefined;
  return `Пользователь ${userId.slice(0, 8)}`;
}

function mapTicket(ticket: BackendSupportTicketResponse): SupportTicket {
  const requesterName = ticket.createdBy?.trim() || shortUserLabel(ticket.reporterId);
  const assigneeName = shortUserLabel(ticket.assigneeId);

  return {
    id: String(ticket.id),
    number: ticket.code,
    subject: ticket.subject,
    description: ticket.description,
    category: ticket.category ?? undefined,
    status: ticket.status,
    statusDisplayName: ticket.statusDisplayName ?? undefined,
    priority: ticket.priority,
    priorityDisplayName: ticket.priorityDisplayName ?? undefined,
    requesterId: ticket.reporterId ?? undefined,
    requesterName,
    assignedToId: ticket.assigneeId ?? undefined,
    assignedToName: assigneeName,
    dueDate: ticket.dueDate ?? undefined,
    resolvedDate: ticket.resolvedAt ?? undefined,
    satisfactionRating: ticket.satisfactionRating ?? undefined,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    createdBy: ticket.createdBy ?? undefined,
  };
}

function mapComment(comment: BackendTicketCommentResponse): TicketComment {
  return {
    id: String(comment.id),
    ticketId: String(comment.ticketId),
    authorId: comment.authorId ?? undefined,
    authorName: shortUserLabel(comment.authorId),
    content: comment.content,
    isInternal: comment.isInternal,
    attachmentUrls: comment.attachmentUrls ?? undefined,
    createdAt: comment.createdAt,
  };
}

function mapCategory(category: BackendSupportTicketCategoryResponse): SupportTicketCategory {
  return {
    id: String(category.id),
    code: category.code,
    name: category.name,
    description: category.description ?? undefined,
    defaultAssigneeId: category.defaultAssigneeId ?? undefined,
    slaHours: category.slaHours ?? undefined,
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

async function mapTicketPage(
  request: Promise<{ data: PaginatedResponse<BackendSupportTicketResponse> }>,
): Promise<PaginatedResponse<SupportTicket>> {
  const response = await request;
  return {
    ...response.data,
    content: response.data.content.map(mapTicket),
  };
}

export const supportApi = {
  getTickets: async (params?: TicketFilters): Promise<PaginatedResponse<SupportTicket>> =>
    mapTicketPage(apiClient.get<PaginatedResponse<BackendSupportTicketResponse>>('/support/tickets', { params })),

  getMyTickets: async (
    reporterId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<SupportTicket>> =>
    mapTicketPage(
      apiClient.get<PaginatedResponse<BackendSupportTicketResponse>>('/support/tickets/my', {
        params: { reporterId, ...params },
      }),
    ),

  getAssignedTickets: async (
    assigneeId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<SupportTicket>> =>
    mapTicketPage(
      apiClient.get<PaginatedResponse<BackendSupportTicketResponse>>('/support/tickets/assigned', {
        params: { assigneeId, ...params },
      }),
    ),

  getTicket: async (id: string): Promise<SupportTicket> => {
    const response = await apiClient.get<BackendSupportTicketResponse>(`/support/tickets/${id}`);
    return mapTicket(response.data);
  },

  createTicket: async (data: CreateTicketRequest): Promise<SupportTicket> => {
    const response = await apiClient.post<BackendSupportTicketResponse>('/support/tickets', data);
    return mapTicket(response.data);
  },

  updateTicket: async (id: string, data: UpdateTicketRequest): Promise<SupportTicket> => {
    const response = await apiClient.put<BackendSupportTicketResponse>(`/support/tickets/${id}`, data);
    return mapTicket(response.data);
  },

  assignTicket: async (id: string, assigneeId: string): Promise<SupportTicket> => {
    const response = await apiClient.patch<BackendSupportTicketResponse>(`/support/tickets/${id}/assign`, null, {
      params: { assigneeId },
    });
    return mapTicket(response.data);
  },

  changeTicketStatus: async (
    id: string,
    status: TicketStatus,
    options?: { assigneeId?: string },
  ): Promise<SupportTicket> => {
    if (status === 'ASSIGNED') {
      if (!options?.assigneeId) {
        throw new Error('Для статуса ASSIGNED требуется assigneeId');
      }
      return supportApi.assignTicket(id, options.assigneeId);
    }

    if (status === 'IN_PROGRESS') {
      const response = await apiClient.patch<BackendSupportTicketResponse>(`/support/tickets/${id}/start`);
      return mapTicket(response.data);
    }

    if (status === 'RESOLVED') {
      const response = await apiClient.patch<BackendSupportTicketResponse>(`/support/tickets/${id}/resolve`);
      return mapTicket(response.data);
    }

    if (status === 'CLOSED') {
      const response = await apiClient.patch<BackendSupportTicketResponse>(`/support/tickets/${id}/close`);
      return mapTicket(response.data);
    }

    return supportApi.updateTicket(id, {
      status,
      assigneeId: options?.assigneeId,
    });
  },

  deleteTicket: async (id: string): Promise<void> => {
    await apiClient.delete(`/support/tickets/${id}`);
  },

  getTicketComments: async (id: string): Promise<TicketComment[]> => {
    const response = await apiClient.get<BackendTicketCommentResponse[]>(`/support/tickets/${id}/comments`);
    return response.data.map(mapComment);
  },

  addTicketComment: async (id: string, data: AddTicketCommentRequest): Promise<TicketComment> => {
    const response = await apiClient.post<BackendTicketCommentResponse>(`/support/tickets/${id}/comments`, {
      authorId: data.authorId,
      content: data.content,
      isInternal: data.isInternal ?? false,
      attachmentUrls: data.attachmentUrls,
    });
    return mapComment(response.data);
  },

  getDashboardStats: async (): Promise<TicketDashboardStats> => {
    const response = await apiClient.get<TicketDashboardStats>('/support/tickets/dashboard');
    return response.data;
  },

  getCategories: async (): Promise<SupportTicketCategory[]> => {
    const response = await apiClient.get<BackendSupportTicketCategoryResponse[]>('/support/kb/categories');
    return response.data.map(mapCategory);
  },
};
