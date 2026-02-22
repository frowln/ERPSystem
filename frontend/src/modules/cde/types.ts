// CDE (Common Data Environment) types

export type LifecycleState = 'WIP' | 'SHARED' | 'PUBLISHED' | 'ARCHIVED';
export type Classification = 'PROJECT' | 'DESIGN' | 'CONSTRUCTION' | 'OPERATIONS' | 'SAFETY' | 'QUALITY' | 'FINANCIAL';
export type Discipline = 'ARCHITECTURE' | 'STRUCTURAL' | 'MEP' | 'CIVIL' | 'ELECTRICAL' | 'PLUMBING' | 'FIRE_PROTECTION' | 'GENERAL';
export type TransmittalStatus = 'DRAFT' | 'ISSUED' | 'ACKNOWLEDGED' | 'RESPONDED' | 'CLOSED';
export type TransmittalPurpose = 'FOR_INFORMATION' | 'FOR_REVIEW' | 'FOR_APPROVAL' | 'FOR_CONSTRUCTION' | 'AS_BUILT';

export interface DocumentContainer {
  id: string;
  documentNumber: string;
  title: string;
  classification: Classification;
  lifecycleState: LifecycleState;
  discipline: Discipline;
  currentRevision: string;
  revisionCount: number;
  projectId: string;
  projectName?: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  fileSize?: number;
  fileType?: string;
}

export interface DocumentRevision {
  id: string;
  documentContainerId: string;
  revisionCode: string;
  description: string;
  authorName: string;
  lifecycleState: LifecycleState;
  createdAt: string;
  fileUrl?: string;
  fileSize?: number;
}

export interface Transmittal {
  id: string;
  number: string;
  subject: string;
  purpose: TransmittalPurpose;
  status: TransmittalStatus;
  fromOrgName: string;
  toOrgName: string;
  issuedDate: string;
  dueDate?: string;
  respondedDate?: string;
  itemCount: number;
  notes?: string;
  createdAt: string;
}

export interface TransmittalItem {
  id: string;
  transmittalId: string;
  documentNumber: string;
  documentTitle: string;
  revision: string;
  responseStatus?: string;
  responseComment?: string;
}

export interface ArchivePolicy {
  id: string;
  name: string;
  description?: string;
  classification?: Classification;
  retentionDays: number;
  autoArchive: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface RevisionSet {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  projectName?: string;
  issuedDate?: string;
  issuedByName?: string;
  revisionIds: string[];
  revisionCount: number;
  createdAt: string;
  updatedAt?: string;
}
