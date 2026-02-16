// Contracts module types
// Contracts, approvals, amendments, and sign workflows

export type ContractStatus =
  | 'DRAFT'
  | 'ON_APPROVAL'
  | 'LAWYER_APPROVED'
  | 'MANAGEMENT_APPROVED'
  | 'FINANCE_APPROVED'
  | 'APPROVED'
  | 'SIGNED'
  | 'ACTIVE'
  | 'CLOSED'
  | 'REJECTED'
  | 'CANCELLED';

export type ContractApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Contract {
  id: string;
  name: string;
  number: string;
  contractDate: string;
  partnerId: string;
  partnerName: string;
  projectId: string;
  projectName?: string;
  typeId: string;
  typeName?: string;
  status: ContractStatus;
  amount: number;
  vatRate: number;
  vatAmount: number;
  totalWithVat: number;
  paymentTerms?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  responsibleId?: string;
  responsibleName?: string;
  retentionPercent: number;
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
  version: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractApproval {
  id: string;
  contractId: string;
  stage: string;
  approverId: string;
  approverName: string;
  status: ContractApprovalStatus;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  comment?: string;
}

export interface ContractType {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface ContractDocument {
  id: string;
  contractId: string;
  docType: string;
  number: string;
  date: string;
  status: string;
  fileUrl?: string;
}

export interface CreateContractRequest {
  name: string;
  number: string;
  contractDate: string;
  partnerId: string;
  projectId: string;
  typeId: string;
  amount: number;
  vatRate: number;
  paymentTerms?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  responsibleId?: string;
  retentionPercent?: number;
  notes?: string;
}

export interface UpdateContractRequest extends Partial<CreateContractRequest> {
  id: string;
}

export interface ContractSignRequest {
  contractId: string;
  signDate: string;
  signedById: string;
  digitalSignature?: string;
  comment?: string;
}

export interface ChangeContractStatusRequest {
  contractId: string;
  status: ContractStatus;
  comment?: string;
}
