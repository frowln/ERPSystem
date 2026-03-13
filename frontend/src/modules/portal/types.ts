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

// Portal CP (Commercial Proposal) Approval
export type PortalCpStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';

export interface PortalProposalItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  total: number;
}

export interface PortalProposal {
  id: string;
  name: string;
  projectId?: string;
  projectName?: string;
  status: PortalCpStatus;
  totalAmount: number;
  customerComment?: string;
  items: PortalProposalItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface PortalProposalDecisionRequest {
  decision: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  comment?: string;
}

// Portal Invoices
export type PortalInvoiceStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PAID' | 'REJECTED' | 'PARTIALLY_PAID';

export interface PortalInvoice {
  id: string;
  invoiceNumber: string;
  contractId: string;
  contractNumber: string;
  projectId: string;
  projectName: string;
  status: PortalInvoiceStatus;
  amount: number;
  periodStart: string;
  periodEnd: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePortalInvoiceRequest {
  contractId: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  description?: string;
}

// Portal Contracts
export type PortalContractStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' | 'TERMINATED';

export interface PortalContract {
  id: string;
  contractNumber: string;
  title: string;
  projectId: string;
  projectName: string;
  status: PortalContractStatus;
  totalAmount: number;
  paidAmount: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt?: string;
}

// Portal Daily Reports
export type DailyReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type WeatherCondition = 'SUNNY' | 'CLOUDY' | 'RAINY' | 'SNOWY' | 'WINDY' | 'FOGGY';

export interface PortalDailyReport {
  id: string;
  projectId: string;
  projectName: string;
  reportDate: string;
  status: DailyReportStatus;
  weather?: WeatherCondition;
  temperatureMin?: number;
  temperatureMax?: number;
  workersOnSite?: number;
  workersCount?: number;
  equipmentCount?: number;
  workDescription: string;
  workPerformed?: string;
  materialsUsed?: string;
  reviewComment?: string;
  issues?: string;
  safetyNotes?: string;
  photos?: string[];
  submittedByName?: string;
  createdAt: string;
  updatedAt?: string;
}

// Portal Defects
export type DefectStatus = 'OPEN' | 'IN_PROGRESS' | 'FIXED' | 'VERIFIED' | 'CLOSED' | 'REJECTED';
export type DefectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DefectCategory = 'STRUCTURAL' | 'MECHANICAL' | 'ELECTRICAL' | 'PLUMBING' | 'FINISHING' | 'SAFETY' | 'OTHER';

export interface PortalDefect {
  id: string;
  defectNumber: string;
  claimNumber?: string;
  projectId: string;
  projectName: string;
  title: string;
  description?: string;
  category: DefectCategory;
  categoryDisplayName?: string;
  status: DefectStatus;
  statusDisplayName?: string;
  priority: DefectPriority;
  priorityDisplayName?: string;
  location?: string;
  locationDescription?: string;
  floor?: string;
  assigneeName?: string;
  reportedByName?: string;
  reportedByPortalUserId?: string;
  dueDate?: string;
  slaDeadline?: string;
  slaBreached?: boolean;
  resolvedAt?: string;
  photos?: string[];
  createdAt: string;
  updatedAt?: string;
}

// Portal RFI
export type PortalRfiPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
export type PortalRfiStatus = 'OPEN' | 'ASSIGNED' | 'ANSWERED' | 'CLOSED';

export interface PortalRfiResponse {
  id: string;
  rfiId: string;
  respondentName: string;
  authorName?: string;
  response: string;
  content?: string;
  isOfficial?: boolean;
  attachments?: string[];
  createdAt: string;
}

export interface PortalRfi {
  id: string;
  rfiNumber: string;
  number?: string;
  projectId: string;
  projectName: string;
  subject: string;
  question: string;
  answer?: string;
  priority: PortalRfiPriority;
  status: PortalRfiStatus;
  requestedByName: string;
  createdByName?: string;
  createdById?: string;
  assignedToName?: string;
  specSection?: string;
  costImpact?: number | boolean;
  scheduleImpact?: string | boolean;
  responseCount?: number;
  dueDate?: string;
  answeredAt?: string;
  answeredDate?: string;
  responses?: PortalRfiResponse[];
  createdAt: string;
  updatedAt?: string;
}

// Portal Photo Reports
export type PhotoCategory = 'PROGRESS' | 'QUALITY' | 'SAFETY' | 'DEFECT' | 'GENERAL' | 'MATERIAL';

export interface PortalPhotoReport {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description?: string;
  category: PhotoCategory;
  photoUrl: string;
  thumbnailUrl?: string;
  uploadedByName: string;
  uploadedById?: string;
  location?: string;
  takenAt?: string;
  createdAt: string;
}

// Portal Signatures
export type SignatureStatus = 'PENDING' | 'SIGNED' | 'REJECTED' | 'EXPIRED';

export interface PortalDocumentSignature {
  id: string;
  documentId: string;
  documentTitle: string;
  documentType?: string;
  projectId: string;
  projectName: string;
  signerName: string;
  signerRole?: string;
  status: SignatureStatus;
  requestedAt: string;
  signedAt?: string;
  rejectedAt?: string;
  expiresAt?: string;
  rejectionReason?: string;
  signatureUrl?: string;
  createdAt: string;
}

// Portal Schedule
export interface PortalScheduleItem {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  milestoneName?: string;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
  assignedTeam?: string;
}
