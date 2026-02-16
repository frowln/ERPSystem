export type DocumentCategory =
  | 'CONTRACT'
  | 'ESTIMATE'
  | 'SPECIFICATION'
  | 'DRAWING'
  | 'PERMIT'
  | 'ACT'
  | 'INVOICE'
  | 'PROTOCOL'
  | 'CORRESPONDENCE'
  | 'PHOTO'
  | 'REPORT'
  | 'OTHER';

export type DocumentStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ACTIVE' | 'ARCHIVED' | 'CANCELLED';

export interface Document {
  id: string;
  title: string;
  documentNumber?: string;
  category: DocumentCategory;
  status: DocumentStatus;
  projectId?: string;
  projectName?: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  authorId?: string;
  authorName: string;
  docVersion: number;
  description?: string;
  tags?: string[];
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  fileName: string;
  fileSize: number;
  changeDescription?: string;
  uploadedById: string;
  uploadedByName: string;
  createdAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  projectId?: string;
  documentCount: number;
  children?: Folder[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentApproval {
  id: string;
  documentId: string;
  approverId: string;
  approverName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export interface DocumentShare {
  id: string;
  documentId: string;
  sharedWithId: string;
  sharedWithName: string;
  permission: 'VIEW' | 'edit' | 'admin';
  sharedAt: string;
}

export interface DocumentFilter {
  category?: DocumentCategory;
  status?: DocumentStatus;
  projectId?: string;
  authorId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface UploadDocumentRequest {
  title: string;
  category: DocumentCategory;
  projectId?: string;
  description?: string;
  tags?: string[];
  expiryDate?: string;
  folderId?: string;
}

export interface DocumentSummary {
  totalDocuments: number;
  byCategory: Record<DocumentCategory, number>;
  byStatus: Record<DocumentStatus, number>;
  totalSize: number;
  recentDocuments: Document[];
}
