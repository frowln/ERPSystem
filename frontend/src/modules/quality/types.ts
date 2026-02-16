export type QualityCheckStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type QualityCheckResult = 'PENDING' | 'PASSED' | 'FAILED' | 'CONDITIONAL' | 'CONDITIONALLY_PASSED';

export type QualityCheckType = 'INCOMING' | 'IN_PROCESS' | 'PROCESS' | 'FINAL' | 'ACCEPTANCE' | 'AUDIT' | 'HIDDEN_WORKS' | 'LABORATORY';

export interface QualityCheck {
  id: string;
  number: string;
  name: string;
  type: QualityCheckType;
  status: QualityCheckStatus;
  result: QualityCheckResult | string;
  projectId: string;
  projectName: string;
  inspectorId?: string;
  inspectorName: string;
  location?: string;
  scheduledDate: string;
  completedDate?: string;
  description: string;
  nonConformanceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface QualityCheckDetail extends QualityCheck {
  findings: string[];
  correctiveActions: string[];
  linkedIssueIds: string[];
  photoCount: number;
}

export interface NonConformance {
  id: string;
  number: string;
  qualityCheckId: string;
  description: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedToId?: string;
  assignedToName?: string;
  dueDate?: string;
  resolvedDate?: string;
  correctiveAction?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualityInspectionTemplate {
  id: string;
  name: string;
  type: QualityCheckType;
  checklistItems: ChecklistItem[];
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  description: string;
  isRequired: boolean;
  acceptanceCriteria?: string;
}

export interface CreateQualityCheckRequest {
  name: string;
  type: QualityCheckType;
  projectId: string;
  inspectorId: string;
  scheduledDate: string;
  description: string;
  location?: string;
  templateId?: string;
}

export interface QualityStatusAction {
  label: string;
  target: string;
}

// Material Certificates

export type CertificateType = 'QUALITY' | 'CONFORMITY' | 'ORIGIN' | 'FIRE_SAFETY' | 'SANITARY' | 'TEST_REPORT' | 'PASSPORT' | 'OTHER';

export type CertificateStatus = 'DRAFT' | 'VALID' | 'EXPIRED' | 'REVOKED' | 'PENDING_VERIFICATION';

export interface MaterialCertificate {
  id: string;
  number: string;
  name: string;
  certificateType: CertificateType;
  status: CertificateStatus;
  materialName: string;
  materialCode?: string;
  supplierId?: string;
  supplierName: string;
  issuedBy: string;
  issuedDate: string;
  validUntil?: string;
  projectId?: string;
  projectName?: string;
  documentUrl?: string;
  lineCount: number;
  notes?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateLine {
  id: string;
  certificateId: string;
  parameterName: string;
  normativeValue: string;
  actualValue: string;
  unitOfMeasure: string;
  isCompliant: boolean;
  testMethod?: string;
  notes?: string;
}

// --- Tolerance ---

export type ToleranceCategory =
  | 'GEOMETRIC'
  | 'STRUCTURAL'
  | 'THERMAL'
  | 'ACOUSTIC'
  | 'WATERPROOFING'
  | 'FIRE_RESISTANCE'
  | 'SURFACE_FINISH'
  | 'ALIGNMENT'
  | 'OTHER';

export interface ToleranceRule {
  id: string;
  code: string;
  name: string;
  category: ToleranceCategory;
  parameter: string;
  nominalValue: number;
  tolerancePlus: number;
  toleranceMinus: number;
  unitOfMeasure: string;
  normativeDocument?: string;
  description?: string;
  isActive: boolean;
  projectId?: string;
  projectName?: string;
  createdAt: string;
  updatedAt: string;
}

export type ToleranceCheckStatus = 'PLANNED' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'DEVIATION_ACCEPTED';

export interface ToleranceCheck {
  id: string;
  number: string;
  toleranceRuleId: string;
  toleranceRuleName: string;
  toleranceRuleCode: string;
  status: ToleranceCheckStatus;
  measuredValue: number;
  nominalValue: number;
  deviation: number;
  tolerancePlus: number;
  toleranceMinus: number;
  unitOfMeasure: string;
  location?: string;
  inspectorId?: string;
  inspectorName: string;
  projectId: string;
  projectName: string;
  checkDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
