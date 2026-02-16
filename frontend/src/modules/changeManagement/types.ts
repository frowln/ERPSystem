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
