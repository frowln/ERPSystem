export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
export type IssueType = 'DESIGN' | 'CONSTRUCTION' | 'COORDINATION' | 'SAFETY' | 'QUALITY' | 'OTHER';
export type IssuePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface Issue {
  id: string;
  projectId: string;
  number: string;
  title: string;
  description?: string;
  issueType?: IssueType;
  issueTypeDisplayName?: string;
  status: IssueStatus;
  statusDisplayName?: string;
  priority: IssuePriority;
  priorityDisplayName?: string;
  assignedToId?: string;
  reportedById?: string;
  dueDate?: string;
  resolvedDate?: string;
  resolvedById?: string;
  location?: string;
  linkedRfiId?: string;
  linkedSubmittalId?: string;
  linkedDocumentIds?: string;
  rootCause?: string;
  resolution?: string;
  tags?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface IssueComment {
  id: string;
  issueId: string;
  authorId: string;
  commentText: string;
  attachmentIds?: string;
  postedAt?: string;
  createdAt: string;
  createdBy?: string;
}
