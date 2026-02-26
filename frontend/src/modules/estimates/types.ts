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

// ---------------------------------------------------------------------------
// Advanced Estimates types
// ---------------------------------------------------------------------------

export type ImportFormat = 'arps' | 'xml' | 'gsfx';
export type ImportStatus = 'success' | 'partial' | 'failed';

export interface ImportHistory {
  id: string;
  fileName: string;
  format: ImportFormat;
  importDate: string;
  status: ImportStatus;
  itemsImported: number;
  errors?: string[];
}

export interface ExportValidation {
  valid: boolean;
  errors: { field: string; message: string }[];
  warnings: { field: string; message: string }[];
}

export interface ExportConfig {
  includeSummary: boolean;
  includeDetails: boolean;
  formatVersion: string;
}

export interface ExportHistory {
  id: string;
  estimateId: string;
  estimateName: string;
  exportDate: string;
  format: string;
  status: 'success' | 'failed';
}

export type VolumeWorkType = 'earthwork' | 'concrete' | 'masonry' | 'roofing' | 'finishing';

export interface VolumeCalculation {
  id: string;
  workType: VolumeWorkType;
  params: Record<string, number>;
  result: number;
  unit: string;
  linkedEstimateItemId?: string;
}

export interface ComparisonItem {
  name: string;
  unit: string;
  planQty: number;
  planPrice: number;
  planTotal: number;
  factQty: number;
  factPrice: number;
  factTotal: number;
  variance: number;
  variancePercent: number;
}

export interface ComparisonSection {
  name: string;
  items: ComparisonItem[];
}

export interface EstimateComparison {
  sections: ComparisonSection[];
  totalPlan: number;
  totalFact: number;
  totalVariance: number;
}

export interface MinstroyIndex {
  region: string;
  quarter: number;
  year: number;
  indexType: string;
  value: number;
}

export interface MinstroyApplyResult {
  estimateId: string;
  appliedIndices: number;
  items: { name: string; oldPrice: number; newPrice: number; indexApplied: number }[];
}

export interface SummaryChapterItem {
  name: string;
  estimateNumber: string;
  amount: number;
}

export interface SummaryChapter {
  number: number;
  name: string;
  items: SummaryChapterItem[];
  subtotal: number;
}

export interface SummaryEstimate {
  projectId: string;
  projectName: string;
  chapters: SummaryChapter[];
  totalDirect: number;
  overhead: number;
  profit: number;
  grandTotal: number;
}
