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

export type BimLinkedEntityType = 'ISSUE' | 'RFI' | 'CHANGE_ORDER' | 'DEFECT';

export interface BimLinkedItem {
  id: string;
  clashId: string;
  entityType: BimLinkedEntityType;
  entityId: string;
  entityTitle: string;
  entityStatus: string;
  linkedAt: string;
  linkedBy?: string;
}

// ---------------------------------------------------------------------------
// Clash Detection Results
// ---------------------------------------------------------------------------
export interface ClashResult {
  id: string;
  clashNumber: string;
  elementA: { id: string; name: string; type: string };
  elementB: { id: string; name: string; type: string };
  clashType: 'hard' | 'soft' | 'clearance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'active' | 'resolved' | 'ignored';
  location: { x: number; y: number; z: number };
  detectedDate: string;
}

// ---------------------------------------------------------------------------
// Defect Heatmap
// ---------------------------------------------------------------------------
export interface DefectHeatmapZone {
  id: string;
  zoneName: string;
  floor: string;
  defectCount: number;
  criticalCount: number;
  density: number;
  defects: { id: string; type: string; severity: string; description: string }[];
}

// ---------------------------------------------------------------------------
// Construction Progress 4D
// ---------------------------------------------------------------------------
export interface ConstructionProgress4D {
  id: string;
  elementName: string;
  elementType: string;
  plannedPercent: number;
  actualPercent: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
}

// ---------------------------------------------------------------------------
// Property Sets
// ---------------------------------------------------------------------------
export interface BimPropertySet {
  elementId: string;
  elementName: string;
  elementType: string;
  category: string;
  properties: { name: string; value: string; unit?: string }[];
}

// ---------------------------------------------------------------------------
// BCF Topics
// ---------------------------------------------------------------------------
export interface BcfTopic {
  id: string;
  topicNumber: string;
  title: string;
  topicType: 'issue' | 'request' | 'comment' | 'solution';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'critical';
  assignedTo: string;
  description: string;
  createdDate: string;
  dueDate?: string;
  comments: { id: string; author: string; date: string; text: string }[];
}
