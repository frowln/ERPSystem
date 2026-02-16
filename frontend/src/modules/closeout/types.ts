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
