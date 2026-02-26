export type PermitStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'REVOKED'
  | 'REJECTED';

export type PermitType =
  | 'BUILDING_PERMIT'
  | 'DEMOLITION_PERMIT'
  | 'EXCAVATION_PERMIT'
  | 'ENVIRONMENTAL_PERMIT'
  | 'FIRE_SAFETY'
  | 'SANITARY'
  | 'ROSTECHNADZOR'
  | 'OTHER';

export type LicenseStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED';

export type LicenseType = 'SRO_CONSTRUCTION' | 'SRO_DESIGN' | 'SRO_ENGINEERING' | 'SPECIAL_PERMIT' | 'OTHER';

export type InspectionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'RESCHEDULED' | 'CANCELLED';

export type InspectionType =
  | 'ROSTECHNADZOR'
  | 'FIRE_INSPECTION'
  | 'SANITARY'
  | 'ENVIRONMENTAL'
  | 'LABOR_INSPECTION'
  | 'INTERNAL_AUDIT'
  | 'CUSTOMER_INSPECTION'
  | 'OTHER';

export type ComplianceCheckResult = 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'PENDING';

export interface RegulatoryPermit {
  id: string;
  number: string;
  name: string;
  permitType: PermitType;
  status: PermitStatus;
  projectId: string;
  projectName?: string;
  issuedBy: string;
  issuedDate?: string;
  validFrom?: string;
  validUntil?: string;
  responsibleId: string;
  responsibleName: string;
  documentUrl?: string;
  conditions?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface License {
  id: string;
  number: string;
  name: string;
  licenseType: LicenseType;
  status: LicenseStatus;
  organizationName: string;
  issuedBy: string;
  issuedDate: string;
  validUntil: string;
  sroName?: string;
  compensationFund?: number;
  maxContractAmount?: number;
  responsibleId: string;
  responsibleName: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Inspection {
  id: string;
  number: string;
  name: string;
  inspectionType: InspectionType;
  status: InspectionStatus;
  projectId: string;
  projectName?: string;
  scheduledDate: string;
  actualDate?: string;
  inspectorName: string;
  inspectorOrganization: string;
  responsibleId: string;
  responsibleName: string;
  result?: ComplianceCheckResult;
  findings?: string;
  correctiveActions?: string;
  correctiveDeadline?: string;
  documentUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceCheck {
  id: string;
  name: string;
  projectId: string;
  projectName?: string;
  checkDate: string;
  result: ComplianceCheckResult;
  regulationReference: string;
  checkedById: string;
  checkedByName: string;
  findings: string;
  correctiveActions?: string;
  dueDate?: string;
  resolvedDate?: string;
  notes?: string;
  createdAt: string;
}

export interface CreatePermitRequest {
  name: string;
  permitType: PermitType;
  projectId: string;
  issuedBy: string;
  validFrom?: string;
  validUntil?: string;
  responsibleId: string;
  conditions?: string;
  notes?: string;
}

export interface CreateInspectionRequest {
  name: string;
  inspectionType: InspectionType;
  projectId: string;
  scheduledDate: string;
  inspectorName: string;
  inspectorOrganization: string;
  responsibleId: string;
  notes?: string;
}

// Reporting Calendar

export type DeadlineStatus = 'UPCOMING' | 'DUE_TODAY' | 'OVERDUE' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
export type ReportingFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'ONE_TIME';
export type SubmissionStatus = 'DRAFT' | 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'REVISION_REQUIRED';
export type SubmissionChannel = 'portal' | 'EMAIL' | 'paper' | 'EDO' | 'api';

export interface ReportingDeadline {
  id: string;
  name: string;
  description: string;
  regulatoryBody: string;
  frequency: ReportingFrequency;
  dueDate: string;
  status: DeadlineStatus;
  projectId?: string;
  projectName?: string;
  responsibleId: string;
  responsibleName: string;
  submissionChannel: SubmissionChannel;
  reportType: string;
  penalty?: number;
  lastSubmissionDate?: string;
  nextDueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Prescriptions
export type PrescriptionStatus =
  | 'RECEIVED'
  | 'UNDER_REVIEW'
  | 'IN_PROGRESS'
  | 'RESPONSE_SUBMITTED'
  | 'COMPLETED'
  | 'APPEALED'
  | 'OVERDUE'
  | 'CLOSED';

export type RegulatoryBodyType =
  | 'GIT'
  | 'ROSTEKHNADZOR'
  | 'STROYNADZOR'
  | 'MCHS'
  | 'ROSPOTREBNADZOR'
  | 'ENVIRONMENTAL'
  | 'OTHER';

export interface Prescription {
  id: string;
  number: string;
  description: string;
  regulatoryBodyType?: RegulatoryBodyType;
  regulatoryBodyTypeDisplayName?: string;
  status: PrescriptionStatus;
  projectId?: string;
  projectName?: string;
  responsibleName?: string;
  receivedDate?: string;
  deadline?: string;
  appealDeadline?: string;
  fineAmount?: number;
  correctiveActionCost?: number;
  violationCount: number;
  regulatoryReference?: string;
  notes?: string;
  evidenceUrl?: string;
  responseLetterUrl?: string;
  overdue?: boolean;
  daysUntilDeadline?: number;
  appealWindowOpen?: boolean;
  appealFiled?: boolean;
  appealDate?: string;
  responseSubmittedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReportingSubmission {
  id: string;
  deadlineId: string;
  deadlineName: string;
  regulatoryBody: string;
  submissionDate: string;
  status: SubmissionStatus;
  channel: SubmissionChannel;
  submittedById: string;
  submittedByName: string;
  documentUrl?: string;
  confirmationNumber?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Prescription Responses
// =============================================================================

export type PrescriptionResponseStatus = 'draft' | 'sent' | 'accepted';

export interface PrescriptionResponse {
  id: string;
  prescriptionId: string;
  prescriptionNumber: string;
  templateName: string;
  responseText: string;
  createdAt: string;
  status: PrescriptionResponseStatus;
}

export interface ResponseTemplate {
  id: string;
  name: string;
  category: string;
  templateText: string;
}

// =============================================================================
// SRO & Licenses Registry
// =============================================================================

export type SroLicenseStatus = 'active' | 'expiring' | 'expired';

export interface SroLicense {
  id: string;
  organizationName: string;
  sroType: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
  status: SroLicenseStatus;
  notifyEnabled: boolean;
}

// =============================================================================
// Inspection Preparation
// =============================================================================

export type InspectionPrepItemStatus = 'ready' | 'pending' | 'missing';

export interface InspectionPrepItem {
  id: string;
  documentName: string;
  category: string;
  status: InspectionPrepItemStatus;
  responsibleName: string;
  notes?: string;
}

// =============================================================================
// Inspection History
// =============================================================================

export type InspectionRecordType = 'planned' | 'unplanned';
export type InspectionRecordResult = 'passed' | 'violations_found' | 'pending';
export type InspectionRecordStatus = 'completed' | 'in_progress' | 'appealed';

export interface InspectionRecord {
  id: string;
  checkDate: string;
  authority: string;
  inspectionType: InspectionRecordType;
  result: InspectionRecordResult;
  fineAmount: number;
  status: InspectionRecordStatus;
  findings: string[];
}

// =============================================================================
// Corrective Actions for Prescription Responses
// =============================================================================

export interface CorrectiveAction {
  id: string;
  description: string;
  responsibleName: string;
  dueDate?: string;
  completed: boolean;
}

export interface SubmitResponseRequest {
  prescriptionId: string;
  responseText: string;
  correctiveActions: Omit<CorrectiveAction, 'id'>[];
  evidenceFileIds?: string[];
}

// =============================================================================
// Inspection History Stats
// =============================================================================

export interface InspectionHistoryStats {
  totalInspections: number;
  violationsRate: number;
  totalPenalties: number;
  passedCount: number;
  violationsCount: number;
}

// =============================================================================
// SRO License Types (full enum)
// =============================================================================

export type SroLicenseTypeEnum =
  | 'SRO_CONSTRUCTION'
  | 'SRO_DESIGN'
  | 'SRO_SURVEY'
  | 'LICENSE_HAZARDOUS'
  | 'LICENSE_FIRE'
  | 'LICENSE_NUCLEAR';
