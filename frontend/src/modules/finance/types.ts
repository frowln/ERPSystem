// Finance module types
// Budgets, payments, invoices, and cash flow

// Budget types
export type BudgetStatus = 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'FROZEN' | 'CLOSED';
export type BudgetCategory = 'MATERIALS' | 'LABOR' | 'EQUIPMENT' | 'SUBCONTRACT' | 'OVERHEAD' | 'OTHER';

export interface Budget {
  id: string;
  name: string;
  projectId: string;
  projectName?: string;
  status: BudgetStatus;
  plannedRevenue: number;
  plannedCost: number;
  plannedMargin: number;
  actualRevenue: number;
  actualCost: number;
  actualMargin: number;
  revenueVariancePercent: number;
  costVariancePercent: number;
  contingencyPercent?: number;
  overheadPercent?: number;
  tempStructuresPercent?: number;
  createdById?: string;
  createdByName?: string;
  approvedById?: string;
  approvedByName?: string;
  createdAt: string;
  updatedAt?: string;
}

// ROI & Scenario types
export interface RoiResult {
  totalCost: number;
  totalRevenue: number;
  margin: number;
  marginPercent: number;
  roi: number;
}

export interface MarginScenario {
  currentRevenue: number;
  targetRevenue: number;
  revenueDelta: number;
  targetMargin: number;
  targetMarginPercent: number;
  totalCost: number;
}

// Procurement Schedule types
export interface ProcurementScheduleItem {
  id: string;
  projectId: string;
  specItemId?: string;
  budgetItemId?: string;
  itemName: string;
  unit?: string;
  quantity?: number;
  requiredByDate?: string;
  leadTimeDays: number;
  orderByDate?: string;
  status: 'PENDING' | 'ORDERED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  purchaseOrderId?: string;
  notes?: string;
}

// Mobilization Schedule types
export interface MobilizationSchedule {
  id: string;
  projectId: string;
  name?: string;
  phase: string;
  startDate?: string;
  endDate?: string;
  totalPersonnelCost: number;
  totalEquipmentCost: number;
}

export interface MobilizationLine {
  id: string;
  scheduleId: string;
  resourceType: 'PERSONNEL' | 'EQUIPMENT';
  resourceName: string;
  quantity: number;
  rate?: number;
  rateUnit: string;
  startDate?: string;
  endDate?: string;
  totalCost?: number;
  notes?: string;
}

// Go/No-Go Checklist types
export interface GoNoGoChecklist {
  resourceAvailability: boolean;
  competencyMatch: boolean;
  teamCapacity: boolean;
  riskAcceptable: boolean;
  marginTargetMet: boolean;
  regionExperience: boolean;
  clientHistory: boolean;
  equipmentAvailable: boolean;
}

export interface AnalogAssessment {
  analogCount: number;
  avgEstimatedValue?: number;
  avgWinProbability?: number;
  recommendation: 'GO' | 'NO_GO' | 'NO_DATA';
}

export interface BudgetItem {
  id: string;
  budgetId: string;
  category: BudgetCategory;
  name: string;
  plannedAmount: number;
  actualAmount: number;
  committedAmount: number;
  remainingAmount: number;
}

export interface CreateBudgetRequest {
  name: string;
  projectId: string;
  plannedRevenue: number;
  plannedCost: number;
  items?: Omit<BudgetItem, 'id' | 'budgetId'>[];
}

// Payment types
export type PaymentStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
export type PaymentType = 'INCOMING' | 'OUTGOING';

export interface Payment {
  id: string;
  number: string;
  paymentDate: string;
  projectId: string;
  projectName?: string;
  contractId?: string;
  contractName?: string;
  partnerName?: string;
  paymentType: PaymentType;
  status: PaymentStatus;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  purpose: string;
  bankAccount?: string;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePaymentRequest {
  paymentDate: string;
  projectId: string;
  contractId?: string;
  partnerName?: string;
  paymentType: PaymentType;
  amount: number;
  vatAmount: number;
  purpose: string;
  bankAccount?: string;
}

export interface ApprovePaymentRequest {
  paymentId: string;
  comment?: string;
}

// Invoice types
export type InvoiceStatus =
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'LINKED_TO_POSITION'
  | 'ON_APPROVAL'
  | 'APPROVED'
  | 'PAID'
  | 'CLOSED'
  | 'REJECTED'
  | 'DRAFT'
  | 'SENT'
  | 'PARTIALLY_PAID'
  | 'OVERDUE'
  | 'CANCELLED';
export type InvoiceType = 'ISSUED' | 'RECEIVED';

export interface Invoice {
  id: string;
  number: string;
  invoiceDate: string;
  dueDate?: string;
  projectId: string;
  projectName?: string;
  contractId?: string;
  contractName?: string;
  partnerId?: string;
  partnerName: string;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  statusDisplayName?: string;
  invoiceTypeDisplayName?: string;
  totalAmount: number;
  subtotal?: number;
  vatRate?: number;
  vatAmount?: number;
  paidAmount: number;
  remainingAmount: number;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitOfMeasure?: string;
  unitPrice: number;
  amount: number;
  vatRate?: number;
  vatAmount?: number;
}

export interface CreateInvoiceRequest {
  invoiceDate: string;
  dueDate?: string;
  projectId: string;
  contractId?: string;
  partnerName: string;
  invoiceType: InvoiceType;
  lineItems: Omit<InvoiceLineItem, 'id' | 'invoiceId'>[];
  notes?: string;
}

// Cash flow types
export interface CashFlowEntry {
  id: string;
  month: string;
  incoming: number;
  outgoing: number;
  net: number;
}

export interface CashFlowForecastItem {
  id: string;
  month: string;
  projectId?: string;
  projectName?: string;
  category: string;
  forecastIncoming: number;
  forecastOutgoing: number;
  forecastNet: number;
}

export interface CashFlowForecastRequest {
  projectId?: string;
  monthsAhead: number;
}

// Payment calendar types
export interface PaymentCalendarEntry {
  id: string;
  date: string;
  paymentId: string;
  paymentNumber: string;
  partnerName: string;
  paymentType: PaymentType;
  amount: number;
  status: PaymentStatus;
}

// Bank Statement Matching types
export interface BankTransaction {
  id: string;
  date: string;
  counterparty: string;
  amount: number;
  purpose: string;
  matchedInvoiceId?: string;
  matchedInvoiceNumber?: string;
  matchConfidence?: number;
  status: 'matched' | 'unmatched' | 'confirmed' | 'rejected';
}

// Factoring Calculator types
export interface FactoringCalcResult {
  invoiceId: string;
  invoiceNumber: string;
  faceValue: number;
  daysUntilPayment: number;
  factoringRate: number;
  commission: number;
  discount: number;
  netProceeds: number;
}

// Treasury Calendar types
export interface TreasuryPayment {
  id: string;
  date: string;
  counterparty: string;
  amount: number;
  type: 'income' | 'expense';
  priority: number;
  status: 'planned' | 'approved' | 'executed' | 'overdue';
  invoiceNumber?: string;
}

// Tax Calendar types
export interface TaxDeadline {
  id: string;
  taxType: string;
  deadline: string;
  amount: number;
  status: 'upcoming' | 'overdue' | 'paid';
  notifyEnabled: boolean;
  description: string;
}

// Bank Export types
export interface BankExportRecord {
  id: string;
  fileName: string;
  format: 'direct_bank' | 'csv' | 'standard';
  exportDate: string;
  paymentsCount: number;
  totalAmount: number;
}

// ---------------------------------------------------------------------------
// Cross-cutting: Execution Chain (Estimate → Budget → KS-2 → Invoice → Payment)
// ---------------------------------------------------------------------------

export type ExecutionStage = 'estimate' | 'budget' | 'ks2' | 'invoice' | 'payment';

export interface ExecutionChainEntry {
  id: string;
  name: string;
  unit: string;
  estimateQty: number;
  estimateAmount: number;
  budgetAmount: number;
  ks2Qty: number;
  ks2Amount: number;
  invoicedAmount: number;
  paidAmount: number;
  executionPercent: number;
}

export interface ExecutionChainSummary {
  projectId: string;
  projectName: string;
  totalEstimate: number;
  totalBudget: number;
  totalKs2: number;
  totalInvoiced: number;
  totalPaid: number;
  items: ExecutionChainEntry[];
}
