export type SpecificationStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'ACTIVE';

export type SpecItemType = 'MATERIAL' | 'EQUIPMENT' | 'WORK';

export interface Specification {
  id: string;
  name: string;
  projectId: string;
  projectName?: string;
  contractId?: string;
  version: number;
  isCurrent: boolean;
  status: SpecificationStatus;
  itemCount: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SupplyStatus = 'FULLY_COVERED' | 'PARTIALLY_COVERED' | 'NOT_COVERED';

export interface SpecItem {
  id: string;
  specificationId: string;
  sequence: number;
  itemType: SpecItemType;
  name: string;
  productCode?: string;
  quantity: number;
  unitOfMeasure: string;
  plannedAmount: number;
  procurementStatus: string;
  estimateStatus: string;
  isCustomerProvided: boolean;
  supplyStatus?: SupplyStatus;
  coveredQuantity?: number;
  bestPrice?: number;
  bestVendorName?: string;
  budgetItemId?: string;
  notes?: string;
}

export interface SpecificationSummary {
  total: number;
  materialCount: number;
  materialAmount: number;
  equipmentCount: number;
  equipmentAmount: number;
  workCount: number;
  workAmount: number;
}

export interface CreateSpecificationRequest {
  name: string;
  projectId: string;
  contractId?: string;
  notes?: string;
  items: Omit<SpecItem, 'id' | 'specificationId'>[];
}

export interface UpdateSpecificationRequest {
  name?: string;
  status?: SpecificationStatus;
  notes?: string;
}

export interface SpecVersionHistory {
  id: string;
  specificationId: string;
  version: number;
  changeDescription: string;
  changedByName: string;
  changedAt: string;
}

// Material Analogs

export type SubstitutionType = 'equivalent' | 'superior' | 'inferior' | 'alternative';
export type QualityRating = 'A' | 'B' | 'C' | 'D' | 'UNRATED';
export type AnalogRequestStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED';

export interface MaterialAnalog {
  id: string;
  originalMaterialName: string;
  originalMaterialCode?: string;
  analogMaterialName: string;
  analogMaterialCode?: string;
  substitutionType: SubstitutionType;
  qualityRating: QualityRating;
  priceOriginal: number;
  priceAnalog: number;
  priceDifference: number;
  priceDifferencePercent: number;
  supplierName: string;
  leadTimeDays?: number;
  isApproved: boolean;
  approvedByName?: string;
  approvedAt?: string;
  technicalJustification?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalogRequest {
  id: string;
  number: string;
  projectId: string;
  projectName: string;
  originalMaterialName: string;
  originalMaterialCode?: string;
  reason: string;
  status: AnalogRequestStatus;
  requestedById: string;
  requestedByName: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  selectedAnalogId?: string;
  selectedAnalogName?: string;
  proposedAnalogCount: number;
  dueDate?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
