export type ChangeEventStatus = 'IDENTIFIED' | 'EVALUATING' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'VOID';
export type ChangeEventSource = 'RFI' | 'ISSUE' | 'DESIGN_CHANGE' | 'OWNER_REQUEST' | 'FIELD_CONDITION' | 'REGULATORY' | 'OTHER';

export interface ChangeEvent {
  id: string;
  number: string;
  title: string;
  description?: string;
  source: ChangeEventSource;
  status: ChangeEventStatus;
  projectId: string;
  projectName?: string;
  costImpact: number;
  scheduleImpactDays: number;
  linkedRfiId?: string;
  linkedIssueId?: string;
  requestedById: string;
  requestedByName: string;
  approvedById?: string;
  approvedByName?: string;
  approvedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type ChangeOrderStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'EXECUTED' | 'REJECTED' | 'VOID';
export type ChangeOrderType = 'ADDITION' | 'DEDUCTION' | 'NO_COST' | 'TIME_EXTENSION';

export interface ChangeOrder {
  id: string;
  number: string;
  title: string;
  description?: string;
  type: ChangeOrderType;
  status: ChangeOrderStatus;
  projectId: string;
  projectName?: string;
  contractId?: string;
  contractName?: string;
  amount: number;
  originalContractAmount: number;
  revisedContractAmount: number;
  scheduleImpactDays: number;
  changeEventIds: string[];
  submittedById: string;
  submittedByName: string;
  approvedById?: string;
  approvedByName?: string;
  approvedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeOrderLineItem {
  id: string;
  changeOrderId: string;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  amount: number;
  costCode?: string;
}

export interface AffectedWbsNode {
  wbsNodeId: string;
  wbsCode: string;
  wbsName: string;
  impactDays: number;
}

export interface ChangeOrderImpactItem {
  changeOrderId: string;
  number: string;
  title: string;
  scheduleImpactDays: number;
  affectsCriticalPath: boolean;
}

export interface ChangeOrderScheduleImpact {
  totalScheduleImpactDays: number;
  criticalPathImpactDays: number;
  changeOrdersOnCriticalPath: number;
  totalChangeOrders: number;
  affectedNodes: AffectedWbsNode[];
  changeOrderImpacts: ChangeOrderImpactItem[];
}

export interface BudgetImpactByType {
  type: string;
  amount: number;
  count: number;
}

export interface BudgetImpactMonthly {
  month: string;
  additions: number;
  deductions: number;
  cumulativeChange: number;
  amount: number;
  count: number;
}

export interface MonthlyTrendPoint {
  month: string;
  events: number;
  orders: number;
  cumulativeCost: number;
}

export interface SourceBreakdown {
  source: string;
  count: number;
  totalCostImpact: number;
}

export interface TypeBreakdown {
  type: string;
  count: number;
  totalAmount: number;
}
