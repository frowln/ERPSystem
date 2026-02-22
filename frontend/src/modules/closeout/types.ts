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
