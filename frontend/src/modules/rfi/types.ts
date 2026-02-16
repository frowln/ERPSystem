export type RfiStatus = 'DRAFT' | 'OPEN' | 'ANSWERED' | 'CLOSED' | 'OVERDUE' | 'VOID';
export type RfiPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

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
  createdById: string;
  createdByName: string;
  dueDate?: string;
  answeredDate?: string;
  specSection?: string;
  distributionList: string[];
  linkedDocumentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RfiResponse {
  id: string;
  rfiId: string;
  authorId: string;
  authorName: string;
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
  distributionList: string[];
  projectId: string;
}
