export type PortalRole = 'client' | 'contractor' | 'subcontractor' | 'consultant';
export type PortalAccessLevel = 'VIEW' | 'COMMENT' | 'UPLOAD' | 'FULL';
export type PortalUserStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DEACTIVATED';
export type PortalMessageStatus = 'SENT' | 'READ' | 'ARCHIVED';

export interface PortalUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  companyName: string;
  role: PortalRole;
  status: PortalUserStatus;
  accessLevel: PortalAccessLevel;
  lastLoginAt?: string;
  createdAt: string;
}

export interface PortalProject {
  id: string;
  code: string;
  name: string;
  status: string;
  progress: number;
  managerName: string;
  customerName: string;
  plannedEndDate: string;
  budget: number;
  spentAmount: number;
  documentCount: number;
  openRfiCount: number;
  openIssueCount: number;
  lastActivityAt: string;
}

export interface PortalMessage {
  id: string;
  subject: string;
  content: string;
  senderName: string;
  senderId: string;
  recipientName: string;
  recipientId: string;
  projectId?: string;
  projectName?: string;
  status: PortalMessageStatus;
  hasAttachments: boolean;
  createdAt: string;
  readAt?: string;
}

export interface PortalDocument {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  category: string;
  projectId: string;
  projectName: string;
  uploadedByName: string;
  version: number;
  downloadUrl: string;
  sharedAt: string;
  expiresAt?: string;
  createdAt: string;
}

export interface PortalAccess {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  companyName: string;
  projectId: string;
  projectName: string;
  accessLevel: PortalAccessLevel;
  grantedByName: string;
  grantedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface CreatePortalUserRequest {
  fullName: string;
  email: string;
  phone?: string;
  companyName: string;
  role: PortalRole;
  accessLevel: PortalAccessLevel;
  projectIds: string[];
}

export interface SendPortalMessageRequest {
  subject: string;
  content: string;
  recipientId: string;
  projectId?: string;
}

// Portal KS-2 Drafts
export type PortalKs2DraftStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CONVERTED';

export interface PortalKs2Draft {
  id: string;
  projectId: string;
  projectName: string;
  draftNumber?: string;
  status: PortalKs2DraftStatus;
  reportingPeriodStart?: string;
  reportingPeriodEnd?: string;
  totalAmount?: number;
  workDescription?: string;
  reviewComment?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePortalKs2DraftRequest {
  projectId: string;
  draftNumber?: string;
  reportingPeriodStart?: string;
  reportingPeriodEnd?: string;
  totalAmount?: number;
  workDescription?: string;
}

// Portal Tasks
export type PortalTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type PortalTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface PortalTask {
  id: string;
  portalUserId: string;
  portalUserName: string;
  projectId?: string;
  projectName?: string;
  title: string;
  description?: string;
  status: PortalTaskStatus;
  priority: PortalTaskPriority;
  dueDate?: string;
  completionNote?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePortalTaskRequest {
  portalUserId: string;
  projectId?: string;
  title: string;
  description?: string;
  priority: PortalTaskPriority;
  dueDate?: string;
}
