export type PunchItemStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'READY_FOR_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLOSED';

export type PunchItemPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type PunchCategory =
  | 'STRUCTURAL'
  | 'ARCHITECTURAL'
  | 'MECHANICAL'
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'FINISHING'
  | 'FIRE_SAFETY'
  | 'LANDSCAPING'
  | 'OTHER';

export type PunchListStatus = 'DRAFT' | 'ACTIVE' | 'IN_REVIEW' | 'COMPLETED' | 'CLOSED';

export interface PunchItem {
  id: string;
  number: string;
  title: string;
  description: string;
  punchListId: string;
  punchListName?: string;
  status: PunchItemStatus;
  priority: PunchItemPriority;
  category: PunchCategory;
  projectId: string;
  projectName?: string;
  location: string;
  floor?: string;
  room?: string;
  assignedToId: string;
  assignedToName: string;
  createdById: string;
  createdByName: string;
  dueDate?: string;
  completedDate?: string;
  approvedDate?: string;
  approvedByName?: string;
  photoUrls: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PunchList {
  id: string;
  number: string;
  name: string;
  description?: string;
  status: PunchListStatus;
  projectId: string;
  projectName?: string;
  contractId?: string;
  contractName?: string;
  createdById: string;
  createdByName: string;
  responsibleId: string;
  responsibleName: string;
  totalItems: number;
  openItems: number;
  closedItems: number;
  completionPercent: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePunchItemRequest {
  title: string;
  description: string;
  punchListId: string;
  priority: PunchItemPriority;
  category: PunchCategory;
  projectId: string;
  location: string;
  floor?: string;
  room?: string;
  assignedToId: string;
  dueDate?: string;
  notes?: string;
}

export interface CreatePunchListRequest {
  name: string;
  description?: string;
  projectId: string;
  contractId?: string;
  responsibleId: string;
  dueDate?: string;
}
