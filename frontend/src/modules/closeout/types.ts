// Closeout types

export type ChecklistStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ON_HOLD';
export type HandoverStatus = 'DRAFT' | 'PREPARED' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
export type WarrantyClaimStatus = 'OPEN' | 'IN_REVIEW' | 'APPROVED' | 'IN_REPAIR' | 'RESOLVED' | 'REJECTED' | 'CLOSED';
export type DefectType = 'STRUCTURAL' | 'MECHANICAL' | 'ELECTRICAL' | 'PLUMBING' | 'FINISHING' | 'WATERPROOFING' | 'OTHER';

export interface CommissioningChecklist {
  id: string;
  checklistNumber: string;
  systemName: string;
  subsystem?: string;
  status: ChecklistStatus;
  inspectorName: string;
  inspectionDate: string;
  totalItems: number;
  completedItems: number;
  passedItems: number;
  failedItems: number;
  projectName: string;
  notes?: string;
  createdAt: string;
}

export interface HandoverPackage {
  id: string;
  packageNumber: string;
  title: string;
  status: HandoverStatus;
  recipientName: string;
  recipientOrg: string;
  handoverDate: string;
  documentCount: number;
  projectName: string;
  description?: string;
  acceptedDate?: string;
  acceptedByName?: string;
  createdAt: string;
}

export interface WarrantyClaim {
  id: string;
  claimNumber: string;
  title: string;
  status: WarrantyClaimStatus;
  defectType: DefectType;
  reportedDate: string;
  warrantyExpiryDate: string;
  reportedByName: string;
  assignedToName?: string;
  description: string;
  projectName: string;
  location?: string;
  estimatedCost?: number;
  actualCost?: number;
  resolvedDate?: string;
  createdAt: string;
}

// As-built tracker
export interface AsBuiltWbsProgress {
  wbsCode: string;
  wbsName: string;
  totalRequired: number;
  submitted: number;
  accepted: number;
  completionPercent: number;
  qualityGatePassed: boolean;
}

// Commissioning templates
export interface CommissioningChecklistTemplate {
  id: string;
  name: string;
  system?: string;
  description?: string;
  checkItemDefinitions?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt?: string;
}

// Warranty obligations
export type WarrantyObligationStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'VOIDED';

export interface WarrantyObligation {
  id: string;
  title: string;
  projectId: string;
  projectName?: string;
  system?: string;
  warrantyStartDate: string;
  warrantyEndDate: string;
  contractorName?: string;
  coverageTerms?: string;
  exclusions?: string;
  notes?: string;
  status: WarrantyObligationStatus;
  daysRemaining: number;
  claimCount: number;
  createdAt: string;
}

// ZOS documents (conclusion on compliance)
export type ZosStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface ZosDocument {
  id: string;
  projectId: string;
  projectName?: string;
  documentNumber: string;
  title: string;
  system?: string;
  status: ZosStatus;
  issuedDate?: string;
  issuedByName?: string;
  issuedByOrganization?: string;
  conclusionText?: string;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

// Commissioning readiness checklist item
export type CommissioningItemStatus = 'completed' | 'in_progress' | 'not_started' | 'n_a';

export interface CommissioningItem {
  id: string;
  section: string;
  itemName: string;
  requirement?: string;
  status: CommissioningItemStatus;
  responsibleName: string;
  notes?: string;
  completedDate?: string;
}

// Stroy-nadzor document package
export type StroyNadzorDocStatus = 'attached' | 'pending' | 'missing' | 'expired';

export interface StroyNadzorDocument {
  id: string;
  documentName: string;
  category: string;
  required: boolean;
  status: StroyNadzorDocStatus;
  fileName?: string;
  fileSize?: number;
  uploadDate?: string;
  expiryDate?: string;
  notes?: string;
}

// Warranty tracking record
export type WarrantyRecordStatus = 'active' | 'expiring' | 'expired' | 'claims_pending';

export interface WarrantyRecord {
  id: string;
  projectId: string;
  projectName: string;
  system?: string;
  warrantyStart: string;
  warrantyEnd: string;
  defectPeriodDays: number;
  status: WarrantyRecordStatus;
  defectsCount: number;
  defectsResolved: number;
  contractorName: string;
  warrantyTerms: string;
}

// Warranty defect report
export interface WarrantyDefectReport {
  system: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  photoUrls?: string[];
}

// Warranty claim timeline entry
export interface WarrantyClaimTimelineEntry {
  id: string;
  warrantyRecordId: string;
  date: string;
  event: string;
  description?: string;
  user?: string;
}

// Executive schemas
export type ExecutiveSchemaStatus = 'draft' | 'review' | 'approved' | 'issued' | 'archived';
export type ExecutiveSchemaType = 'PLAN' | 'SECTION' | 'DETAIL' | 'FACADE';

export interface ExecutiveSchema {
  id: string;
  schemaName: string;
  schemaType?: ExecutiveSchemaType;
  workType: string;
  system?: string;
  floorLevel?: string;
  version: number;
  createdDate: string;
  linkedBimElementId?: string;
  linkedBimElementName?: string;
  status: ExecutiveSchemaStatus;
  fileUrl?: string;
}

// Executive schema version history entry
export interface ExecutiveSchemaVersion {
  id: string;
  schemaId: string;
  version: number;
  status: ExecutiveSchemaStatus;
  changedByName?: string;
  changedAt: string;
  comment?: string;
}

// ZOS extended form data (for form generation)
export interface ZosFormData {
  projectId: string;
  documentNumber: string;
  title: string;
  objectName?: string;
  objectAddress?: string;
  permitNumber?: string;
  permitDate?: string;
  designDocReferences?: string;
  system?: string;
  issuedDate?: string;
  issuedByName?: string;
  issuedByOrganization?: string;
  conclusionText?: string;
  complianceSections?: ZosComplianceSection[];
  remarks?: string;
  signatures?: ZosSignature[];
}

export interface ZosComplianceSection {
  id: string;
  sectionName: string;
  compliant: boolean;
  notes?: string;
}

export interface ZosSignature {
  id: string;
  role: string;
  fullName: string;
  organization?: string;
  signed: boolean;
  signedDate?: string;
}
