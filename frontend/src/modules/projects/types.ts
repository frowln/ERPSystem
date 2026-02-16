export type ProjectStatus =
  | 'DRAFT'
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED';

export type ProjectType =
  | 'RESIDENTIAL'
  | 'COMMERCIAL'
  | 'INDUSTRIAL'
  | 'INFRASTRUCTURE'
  | 'RENOVATION';

export type ProjectPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  type: ProjectType;
  priority: ProjectPriority;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  budget: number;
  contractAmount?: number;
  spentAmount: number;
  managerId: string;
  managerName: string;
  customerName: string;
  customerId?: string;
  progress: number;
  membersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  joinedAt: string;
}

export interface ProjectContractSnapshot {
  id: string;
  number: string;
  name: string;
  projectId: string;
  partnerName: string;
  status: 'ACTIVE' | 'SIGNED' | 'ON_APPROVAL' | 'CLOSED';
  totalWithVat: number;
  totalInvoiced: number;
  totalPaid: number;
  plannedEndDate: string;
}

export interface ProjectCashOperation {
  id: string;
  date: string;
  category: string;
  counterparty: string;
  direction: 'INCOMING' | 'OUTGOING';
  amount: number;
  documentNo: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  plannedDate: string;
  actualDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  progress: number;
  createdAt: string;
}

export interface ProjectBudgetSummary {
  budget: number;
  contractAmount: number;
  spentAmount: number;
  remainingAmount: number;
  budgetPercent: number;
  marginValue: number;
  marginPercent: number;
}

export interface ProjectFinanceSummary {
  contractsTotal: number;
  contractsInvoiced: number;
  contractsPaid: number;
  receivable: number;
  toInvoice: number;
  incomingTotal: number;
  outgoingTotal: number;
  netCash: number;
}

export interface CreateProjectRequest {
  code: string;
  name: string;
  description?: string;
  type: ProjectType;
  priority: ProjectPriority;
  plannedStartDate: string;
  plannedEndDate: string;
  budget: number;
  contractAmount?: number;
  customerName: string;
  customerId?: string;
  managerId?: string;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: ProjectStatus;
}
