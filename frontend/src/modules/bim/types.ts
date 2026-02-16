// BIM Module Types

export type BimModelStatus = 'ACTIVE' | 'PROCESSING' | 'REVIEW' | 'ARCHIVED' | 'ERROR';

export type BimModelFormat = 'IFC' | 'RVT' | 'NWD' | 'NWC' | 'DWG' | 'DXF' | 'FBX' | 'OBJ';

export interface BimModel {
  id: string;
  name: string;
  format: BimModelFormat | string;
  uploadDate: string;
  fileSize: string;
  status: BimModelStatus;
  projectId?: string;
  projectName: string;
  uploadedBy: string;
  version: string;
  description?: string;
  discipline?: string;
  elementCount?: number;
}

export type DesignPackageStatus = 'DRAFT' | 'ISSUED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';

export type DesignSection = 'AR' | 'KR' | 'OV' | 'VK' | 'ES' | 'SS' | 'GP';

export interface DesignPackage {
  id: string;
  code: string;
  name: string;
  section: DesignSection | string;
  status: DesignPackageStatus;
  projectId?: string;
  projectName: string;
  reviewer: string;
  issueDate: string;
  reviewDate: string | null;
  sheetsCount: number;
  revision: string;
  description?: string;
}

export type ClashStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'APPROVED' | 'IGNORED';

export type ClashSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';

export type ClashPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Clash {
  id: string;
  code: string;
  description: string;
  severity: ClashSeverity;
  status: ClashStatus;
  location: string;
  discipline1: string;
  discipline2: string;
  assignedTo: string;
  detectedDate: string;
  resolvedDate: string | null;
  projectId?: string;
  projectName: string;
  priority?: ClashPriority;
  modelId1?: string;
  modelId2?: string;
}
