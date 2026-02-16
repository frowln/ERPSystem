export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'RESOLVED' | 'CLOSED';
export type IssueType = 'DEFECT' | 'SAFETY' | 'DESIGN' | 'COORDINATION' | 'SCHEDULE' | 'OTHER';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Issue {
  id: string;
  number: string;
  title: string;
  description?: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  projectId: string;
  projectName?: string;
  assignedToId?: string;
  assignedToName?: string;
  reportedById: string;
  reportedByName: string;
  dueDate?: string;
  resolvedDate?: string;
  resolution?: string;
  linkedRfiId?: string;
  linkedSubmittalId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IssueComment {
  id: string;
  issueId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}
