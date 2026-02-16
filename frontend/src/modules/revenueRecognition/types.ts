// Revenue Recognition types

export type RecognitionMethod = 'PERCENTAGE_OF_COMPLETION' | 'COMPLETED_CONTRACT' | 'INPUT_METHOD' | 'OUTPUT_METHOD';
export type AccountingStandard = 'IFRS_15' | 'ASC_606' | 'RAS';
export type RevenueContractStatus = 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' | 'TERMINATED';

export interface RevenueContract {
  id: string;
  contractName: string;
  contractNumber: string;
  clientName: string;
  method: RecognitionMethod;
  standard: AccountingStandard;
  status: RevenueContractStatus;
  totalRevenue: number;
  recognizedRevenue: number;
  totalCost: number;
  incurredCost: number;
  percentComplete: number;
  grossMargin: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface RevenuePeriod {
  id: string;
  contractId: string;
  period: string;
  periodLabel: string;
  cumulativeCostIncurred: number;
  periodCostIncurred: number;
  percentComplete: number;
  cumulativeRevenueRecognized: number;
  periodRevenueRecognized: number;
  cumulativeGrossProfit: number;
  periodGrossProfit: number;
  adjustments: number;
}
