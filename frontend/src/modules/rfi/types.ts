export type RfiStatus = 'DRAFT' | 'OPEN' | 'ASSIGNED' | 'ANSWERED' | 'CLOSED' | 'VOID';
export type RfiPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface Rfi {
  id: string;
  number: string;
  subject: string;
  question: string;
  answer?: string;
  status: RfiStatus;
  priority: RfiPriority;
  projectId: string;
  projectName?: string;
  assignedToId?: string;
  assignedToName?: string;
  responsibleId?: string;
  createdById?: string;
  createdByName?: string;
  dueDate?: string;
  answeredDate?: string;
  answeredById?: string;
  costImpact?: boolean;
  scheduleImpact?: boolean;
  relatedDrawingId?: string;
  specSection?: string;
  distributionList: string[];
  linkedDocumentIds: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  isOverdue?: boolean;
}

export interface RfiResponse {
  id: string;
  rfiId: string;
  authorId: string;
  authorName?: string;
  content: string;
  isOfficial: boolean;
  createdAt: string;
}

export interface CreateRfiRequest {
  subject: string;
  question: string;
  priority: RfiPriority;
  assignedToId?: string;
  dueDate?: string;
  specSection?: string;
  costImpact?: boolean;
  scheduleImpact?: boolean;
  distributionList?: string[];
  projectId: string;
}
