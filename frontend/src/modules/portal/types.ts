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
