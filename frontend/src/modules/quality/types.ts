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

// --- Material Inspection ---

export type MaterialInspectionResult = 'accepted' | 'rejected' | 'conditional';

export interface MaterialInspectionTestResult {
  parameter: string;
  value: string;
  standard: string;
  passed: boolean;
}

export interface MaterialInspection {
  id: string;
  materialName: string;
  supplier: string;
  batchNumber: string;
  inspectionDate: string;
  inspectorName: string;
  result: MaterialInspectionResult;
  testProtocolNumber: string;
  testResults: MaterialInspectionTestResult[];
  notes?: string;
  projectId: string;
  projectName: string;
}

export interface CreateMaterialInspectionRequest {
  materialName: string;
  supplier: string;
  batchNumber: string;
  inspectorName: string;
  inspectionDate: string;
  testResults: MaterialInspectionTestResult[];
  result: MaterialInspectionResult;
  testProtocolNumber: string;
  notes?: string;
  projectId: string;
}

// --- Checklist Templates ---

export type ChecklistWorkType = 'concreting' | 'steel_installation' | 'welding' | 'waterproofing' | 'finishing' | 'other';

export interface ChecklistTemplateItem {
  id: string;
  order: number;
  description: string;
  required: boolean;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  workType: ChecklistWorkType;
  items: ChecklistTemplateItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateChecklistTemplateRequest {
  name: string;
  workType: ChecklistWorkType;
  items: Omit<ChecklistTemplateItem, 'id'>[];
}

export interface UpdateChecklistTemplateRequest {
  name?: string;
  workType?: ChecklistWorkType;
  items?: Omit<ChecklistTemplateItem, 'id'>[];
}

// --- Defect Register ---

export type DefectSeverity = 'minor' | 'major' | 'critical';
export type DefectStatus = 'open' | 'in_progress' | 'fixed' | 'closed';

export interface DefectRegisterEntry {
  id: string;
  number: string;
  location: string;
  defectType: string;
  severity: DefectSeverity;
  detectedDate: string;
  deadline: string;
  responsibleName: string;
  status: DefectStatus;
  projectId: string;
  projectName: string;
}

// --- Defect Statistics ---

export interface DefectStatistics {
  byType: { type: string; count: number; percentage: number }[];
  bySeverity: { severity: string; count: number }[];
  total: number;
}

// --- Author Supervision Journal ---

export type ComplianceStatus = 'compliant' | 'non_compliant' | 'partial';

export interface SupervisionEntry {
  id: string;
  number: string;
  date: string;
  inspectorName: string;
  workType: string;
  remarks: string;
  directives: string;
  complianceStatus: ComplianceStatus;
  projectId: string;
  projectName: string;
}

export interface CreateSupervisionEntryRequest {
  date: string;
  inspectorName: string;
  workType: string;
  remarks: string;
  directives: string;
  projectId: string;
}

// --- Checklist Execution ---

export type ChecklistExecutionStatusType = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DRAFT';

export type ChecklistItemResultType = 'PASS' | 'FAIL' | 'NA' | 'PENDING';

export interface QualityChecklistEntry {
  id: string;
  code?: string;
  name: string;
  templateId?: string;
  projectId: string;
  projectName: string;
  status: ChecklistExecutionStatusType;
  inspectorName: string;
  scheduledDate: string;
  completedDate?: string;
  itemCount: number;
  passedCount: number;
  failedCount: number;
  totalItems?: number;
  passedItems?: number;
  failedItems?: number;
  naItems?: number;
  workType?: string;
  workTypeDisplayName?: string;
  wbsStage?: string;
  location?: string;
  notes?: string;
  photoUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistExecutionItem {
  id: string;
  checklistId: string;
  order: number;
  description: string;
  required: boolean;
  result: ChecklistItemResultType;
  category?: string;
  photoRequired?: boolean;
  notes?: string;
  photoUrls?: string[];
}

// --- Floor Plans (Pin-on-plan) ---

export interface FloorPlan {
  id: string;
  projectId: string;
  name: string;
  code?: string;
  floor?: string;
  imageUrl: string;
  defectCount: number;
  createdAt: string;
  updatedAt: string;
}

export type DefectOnPlanSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';
export type DefectOnPlanStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

export interface DefectOnPlanEntry {
  id: string;
  number: number;
  planId: string;
  title: string;
  description?: string;
  severity: DefectOnPlanSeverity;
  status: DefectOnPlanStatus;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  x: number;
  y: number;
  photoUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDefectOnPlanRequest {
  title: string;
  description?: string;
  severity: DefectOnPlanSeverity;
  assigneeId?: string;
  dueDate?: string;
  x: number;
  y: number;
}
