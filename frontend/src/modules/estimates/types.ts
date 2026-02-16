// Estimates module types
// Budget estimates, line items, and import wizards

export type EstimateStatus = 'DRAFT' | 'IN_WORK' | 'APPROVED' | 'ACTIVE';

export interface Estimate {
  id: string;
  name: string;
  projectId: string;
  projectName?: string;
  specificationId: string;
  specificationName?: string;
  status: EstimateStatus;
  totalAmount: number;
  orderedAmount: number;
  invoicedAmount: number;
  totalSpent: number;
  balance: number;
  variancePercent: number;
  createdById?: string;
  createdByName?: string;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EstimateItem {
  id: string;
  estimateId: string;
  specItemId?: string;
  name: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  unitPriceCustomer?: number;
  amount: number;
  amountCustomer?: number;
  orderedAmount: number;
  invoicedAmount: number;
  deliveredAmount: number;
}

export interface CreateEstimateRequest {
  name: string;
  projectId: string;
  specificationId: string;
}

export interface CreateEstimateItemRequest {
  estimateId: string;
  specItemId?: string;
  name: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  unitPriceCustomer?: number;
}

export interface UpdateEstimateItemRequest extends Partial<CreateEstimateItemRequest> {
  id: string;
}

export interface EstimateImportRow {
  name: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  unitPriceCustomer?: number;
}

export interface EstimateImportRequest {
  estimateId: string;
  rows: EstimateImportRow[];
  replaceExisting: boolean;
}

export interface EstimateImportResult {
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errors: EstimateImportError[];
}

export interface EstimateImportError {
  row: number;
  field: string;
  message: string;
}

export type EstimateImportStep = 'UPLOAD' | 'mapping' | 'preview' | 'confirm';
