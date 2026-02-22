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

// Cash Flow Forecast types

export interface CashFlowScenario {
  id: string;
  name: string;
  description?: string;
  baselineDate?: string;
  horizonMonths: number;
  growthRatePercent: number;
  paymentDelayDays: number;
  retentionPercent: number;
  includeVat: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CashFlowForecastBucket {
  id: string;
  scenarioId: string;
  periodStart: string;
  periodEnd: string;
  forecastIncome: number;
  forecastExpense: number;
  forecastNet: number;
  actualIncome: number;
  actualExpense: number;
  variance: number;
  cumulativeForecastNet: number;
}

export interface VarianceSummary {
  scenarioId: string;
  totalForecastNet: number;
  totalActualNet: number;
  totalVariance: number;
  avgMonthlyVariance: number;
}

// Profitability types

export type ProfitabilityRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ProfitabilityForecast {
  id: string;
  projectId: string;
  projectName?: string;
  contractAmount: number;
  estimateAtCompletion: number;
  estimateToComplete: number;
  forecastMargin: number;
  forecastMarginPercent: number;
  profitFadeAmount: number;
  profitFadePercent: number;
  completionPercent: number;
  riskLevel: ProfitabilityRiskLevel;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfitabilityPortfolio {
  totalContractValue: number;
  totalForecastMargin: number;
  avgMarginPercent: number;
  totalProfitFade: number;
  projectsAtRisk: number;
  lossProjects: number;
  byRiskLevel?: Record<string, number>;
}

export interface ProfitabilitySnapshot {
  id: string;
  projectId: string;
  snapshotDate: string;
  eac: number;
  etc: number;
  forecastMargin: number;
  profitFadeAmount: number;
  completionPercent: number;
}
