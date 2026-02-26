// Closing documents module types
// KS-2, KS-3, and related closing document types

export type ClosingDocStatus = 'DRAFT' | 'SUBMITTED' | 'SIGNED' | 'CLOSED';

export interface Ks2Document {
  id: string;
  number: string;
  name: string;
  documentDate: string;
  projectId: string;
  projectName?: string;
  contractId: string;
  contractName?: string;
  status: ClosingDocStatus;
  totalAmount: number;
  totalQuantity: number;
  lineCount: number;
  createdById?: string;
  createdByName?: string;
  signedById?: string;
  signedByName?: string;
  signedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ks2LineItem {
  id: string;
  ks2DocumentId: string;
  sequence: number;
  workName: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  costCode?: string;
}

export interface Ks3Document {
  id: string;
  number: string;
  name: string;
  documentDate: string;
  periodFrom: string;
  periodTo: string;
  projectId: string;
  projectName?: string;
  contractId: string;
  contractName?: string;
  status: ClosingDocStatus;
  totalAmount: number;
  retentionPercent: number;
  retentionAmount: number;
  netAmount: number;
  ks2Count: number;
  ks2DocumentIds?: string[];
  createdById?: string;
  createdByName?: string;
  signedById?: string;
  signedByName?: string;
  signedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKs2Request {
  name: string;
  documentDate: string;
  projectId: string;
  contractId: string;
  lineItems: Omit<Ks2LineItem, 'id' | 'ks2DocumentId'>[];
}

export interface CreateKs3Request {
  name: string;
  documentDate: string;
  periodFrom: string;
  periodTo: string;
  projectId: string;
  contractId: string;
  ks2DocumentIds: string[];
  retentionPercent: number;
}

// ---------------------------------------------------------------------------
// KS-2 Approval Workflow
// ---------------------------------------------------------------------------

export type ApprovalStage = 'contractor' | 'technical' | 'accounting' | 'client';
export type ApprovalStageStatus = 'pending' | 'approved' | 'rejected';

export interface Ks2ApprovalStageEntry {
  stage: ApprovalStage;
  status: ApprovalStageStatus;
  approverName?: string;
  date?: string;
  comment?: string;
}

export interface Ks2Approval {
  id: string;
  actId: string;
  actNumber: string;
  projectName: string;
  amount: number;
  currentStage: ApprovalStage;
  stages: Ks2ApprovalStageEntry[];
  createdAt: string;
}

// ---------------------------------------------------------------------------
// KS-2 Volume Verification
// ---------------------------------------------------------------------------

export type VolumeCheckStatus = 'within_limit' | 'warning' | 'exceeds';

export interface Ks2VolumeCheck {
  workItem: string;
  unit: string;
  estimateQty: number;
  totalSubmitted: number;
  thisActQty: number;
  remaining: number;
  status: VolumeCheckStatus;
}

// ---------------------------------------------------------------------------
// KS-6a Journal
// ---------------------------------------------------------------------------

export interface Ks6aEntry {
  id: string;
  month: string;
  workItem: string;
  unit: string;
  planQty: number;
  cumulativeQty: number;
  thisMonthQty: number;
  progressPercent: number;
}

// ---------------------------------------------------------------------------
// Correction Acts
// ---------------------------------------------------------------------------

export type CorrectionActStatus = 'draft' | 'approved' | 'applied';

export interface CorrectionActItem {
  workItem: string;
  originalQty: number;
  correctionQty: number;
  unit: string;
}

export interface CorrectionAct {
  id: string;
  number: string;
  originalActId: string;
  originalActNumber: string;
  date: string;
  amount: number;
  reason: string;
  status: CorrectionActStatus;
  items: CorrectionActItem[];
}

export interface CreateCorrectionActRequest {
  originalActId: string;
  reason: string;
  items: Omit<CorrectionActItem, 'workItem'>[];
}

// ---------------------------------------------------------------------------
// Cross-cutting: KS-2 Payment Status (links to Finance)
// ---------------------------------------------------------------------------

export interface Ks2PaymentInfo {
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceAmount?: number;
  invoiceStatus?: string;
  paidAmount: number;
  remainingAmount: number;
  paymentPercent: number;
}

// ---------------------------------------------------------------------------
// Cross-cutting: Estimate Items for KS-2 Import
// ---------------------------------------------------------------------------

export interface EstimateItemForImport {
  id: string;
  estimateItemId: string;
  name: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;
  alreadySubmitted: number;
  remaining: number;
}

// ---------------------------------------------------------------------------
// KS-2 / KS-3 Print Forms
// ---------------------------------------------------------------------------

export interface Ks2PrintDataItem {
  number: number;
  workName: string;
  unit: string;
  qty: number;
  price: number;
  amount: number;
}

export interface Ks2PrintData {
  actNumber: string;
  date: string;
  contractor: string;
  client: string;
  object: string;
  items: Ks2PrintDataItem[];
  total: number;
}

export interface Ks3PrintData {
  certificateNumber: string;
  date: string;
  contractor: string;
  client: string;
  contractNumber: string;
  contractDate: string;
  periodFrom: string;
  periodTo: string;
  completedFromStart: number;
  completedThisPeriod: number;
  completedFromStartTotal: number;
}
