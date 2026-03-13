export type ContractorStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'PENDING';
export type TaxStatus = 'REGISTERED' | 'UNREGISTERED' | 'SUSPENDED' | 'REVOKED';
export type PaymentStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED' | 'RECEIPT_ISSUED';
export type RegistryStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';
export type NpdStatus = 'ACTIVE' | 'INACTIVE' | 'NOT_REGISTERED' | 'UNKNOWN';
export type ContractType = 'GPC' | 'SERVICE' | 'SUBCONTRACT';
export type CompletionActStatus = 'DRAFT' | 'SIGNED' | 'PAID' | 'CANCELLED';

export interface SelfEmployedContractor {
  id: string;
  fullName: string;
  inn: string;
  phone?: string;
  email?: string;
  bankAccount?: string;
  bankName?: string;
  bankBik?: string;
  status: ContractorStatus;
  taxStatus: TaxStatus;
  npdStatus: NpdStatus;
  npdVerifiedAt?: string;
  contractType: ContractType;
  contractNumber?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  hourlyRate?: number;
  registrationDate?: string;
  specialization?: string;
  projectIds?: string[];
  totalPaid?: number;
  totalActsPending?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SelfEmployedPayment {
  id: string;
  contractorId: string;
  contractorName: string;
  contractorInn: string;
  registryId?: string;
  registryName?: string;
  amount: number;
  serviceDescription: string;
  serviceDate: string;
  status: PaymentStatus;
  receiptNumber?: string;
  receiptDate?: string;
  paymentDate?: string;
  projectId?: string;
  projectName?: string;
  createdAt: string;
}

export interface SelfEmployedRegistry {
  id: string;
  name: string;
  projectId?: string;
  projectName?: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  totalPayments: number;
  status: RegistryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CompletionAct {
  id: string;
  workerId: string;
  workerName: string;
  projectId: string;
  projectName: string;
  actNumber: string;
  description: string;
  amount: number;
  period: string;
  status: CompletionActStatus;
  signedAt?: string;
  paidAt?: string;
  createdAt: string;
}
