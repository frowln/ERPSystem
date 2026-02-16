export type DesignVersionStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'SUPERSEDED' | 'REJECTED' | 'ARCHIVED';

export interface DesignVersion {
  id: string;
  number: string;
  title: string;
  description?: string;
  sectionId: string;
  sectionName: string;
  version: string;
  status: DesignVersionStatus;
  authorId: string;
  authorName: string;
  projectId: string;
  projectName: string;
  fileUrl?: string;
  fileSize?: number;
  reviewCount: number;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type DesignReviewStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';

export interface DesignReview {
  id: string;
  number: string;
  versionId: string;
  versionTitle: string;
  versionNumber: string;
  status: DesignReviewStatus;
  reviewerId: string;
  reviewerName: string;
  projectId: string;
  projectName: string;
  comments?: string;
  dueDate?: string;
  completedAt?: string;
  markupCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DesignSection {
  id: string;
  code: string;
  name: string;
  description?: string;
  projectId: string;
  projectName: string;
  leadDesignerId?: string;
  leadDesignerName?: string;
  versionCount: number;
  latestVersion?: string;
  latestVersionStatus?: DesignVersionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDesignVersionRequest {
  title: string;
  sectionId: string;
  version: string;
  description?: string;
  projectId: string;
}

export interface CreateDesignReviewRequest {
  versionId: string;
  reviewerId: string;
  dueDate?: string;
  comments?: string;
}
