export type CommitmentStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'COMMITTED' | 'CLOSED' | 'VOID';
export type CommitmentType = 'SUBCONTRACT' | 'PURCHASE_ORDER' | 'SERVICE_AGREEMENT' | 'RENTAL';

export interface Commitment {
  id: string;
  number: string;
  title: string;
  type: CommitmentType;
  status: CommitmentStatus;
  projectId: string;
  projectName?: string;
  vendorName: string;
  originalAmount: number;
  revisedAmount: number;
  invoicedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  costCode?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostCode {
  id: string;
  code: string;
  name: string;
  budgetAmount: number;
  committedAmount: number;
  actualAmount: number;
  forecastAmount: number;
  varianceAmount: number;
  variancePercent: number;
}

export interface BudgetSummary {
  originalBudget: number;
  approvedChanges: number;
  revisedBudget: number;
  committed: number;
  actualCost: number;
  forecastAtCompletion: number;
  varianceAtCompletion: number;
}

export interface EvmData {
  date: string;
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
}

export interface CashFlowEntry {
  month: string;
  planned: number;
  actual: number;
  forecast: number;
  cumPlanned: number;
  cumActual: number;
  cumForecast: number;
}

export interface CostDashboard {
  budgetSummary: BudgetSummary;
  evmData: EvmData[];
  costCodes: CostCode[];
  commitmentSummary: {
    totalCommitments: number;
    openCommitments: number;
    totalCommittedAmount: number;
    totalInvoicedAmount: number;
  };
  cashFlow: CashFlowEntry[];
  cpi: number;
  spi: number;
}
