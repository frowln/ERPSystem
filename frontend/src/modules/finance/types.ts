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
  createdById?: string;
  createdByName?: string;
  approvedById?: string;
  approvedByName?: string;
  createdAt: string;
  updatedAt?: string;
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
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
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
  partnerName: string;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  totalAmount: number;
  vatAmount?: number;
  paidAmount: number;
  remainingAmount: number;
  notes?: string;
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
