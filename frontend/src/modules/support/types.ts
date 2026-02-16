export type TicketStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_RESPONSE'
  | 'RESOLVED'
  | 'CLOSED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SupportTicket {
  id: string;
  number: string;
  subject: string;
  description: string;
  category?: string;
  status: TicketStatus;
  statusDisplayName?: string;
  priority: TicketPriority;
  priorityDisplayName?: string;
  requesterId?: string;
  requesterName?: string;
  assignedToId?: string;
  assignedToName?: string;
  dueDate?: string;
  resolvedDate?: string;
  satisfactionRating?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId?: string;
  authorName?: string;
  content: string;
  isInternal: boolean;
  attachmentUrls?: string;
  createdAt: string;
}

export interface SupportTicketCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  defaultAssigneeId?: string;
  slaHours?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketRequest {
  subject: string;
  description: string;
  category?: string;
  priority?: TicketPriority;
  reporterId?: string;
  dueDate?: string;
}

export interface UpdateTicketRequest {
  subject?: string;
  description?: string;
  category?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  assigneeId?: string;
  dueDate?: string;
  satisfactionRating?: number;
}

export interface AddTicketCommentRequest {
  authorId?: string;
  content: string;
  isInternal?: boolean;
  attachmentUrls?: string;
}

export interface TicketDashboardStats {
  totalTickets: number;
  openTickets: number;
  statusCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
}
