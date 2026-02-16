export type FieldReportStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED';
export type SyncStatus = 'SYNCED' | 'PENDING' | 'ERROR' | 'OFFLINE';
export type MobileTaskStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface FieldReport {
  id: string;
  number: string;
  title: string;
  description: string;
  status: FieldReportStatus;
  projectId: string;
  projectName?: string;
  authorId: string;
  authorName: string;
  location?: string;
  weatherCondition?: string;
  temperature?: number;
  workersOnSite?: number;
  photos: PhotoCapture[];
  syncStatus: SyncStatus;
  reportDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoCapture {
  id: string;
  fieldReportId?: string;
  fileName: string;
  fileUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  takenById: string;
  takenByName: string;
  takenAt: string;
  syncStatus: SyncStatus;
}

export interface OfflineSyncStatus {
  pendingReports: number;
  pendingPhotos: number;
  lastSyncAt?: string;
  isOnline: boolean;
  syncInProgress: boolean;
  failedItems: number;
}

export interface MobileTask {
  id: string;
  title: string;
  description?: string;
  status: MobileTaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  projectId: string;
  projectName?: string;
  assignedToId: string;
  assignedToName: string;
  dueDate?: string;
  completedAt?: string;
  location?: string;
  createdAt: string;
}

export interface CreateFieldReportRequest {
  title: string;
  description: string;
  projectId: string;
  location?: string;
  weatherCondition?: string;
  temperature?: number;
  workersOnSite?: number;
  reportDate: string;
}
