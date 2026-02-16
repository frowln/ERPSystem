export type CaseType = 'LITIGATION' | 'ARBITRATION' | 'CLAIM' | 'CONSULTATION' | 'CONTRACT_DISPUTE' | 'REGULATORY';
export type CaseStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'RESOLVED' | 'CLOSED' | 'APPEAL';

export interface LegalCase {
  id: string;
  number: string;
  title: string;
  description?: string;
  caseType: CaseType;
  status: CaseStatus;
  projectId?: string;
  projectName?: string;
  contractId?: string;
  contractName?: string;
  claimAmount?: number;
  resolvedAmount?: number;
  opposingParty?: string;
  courtName?: string;
  caseNumber?: string;
  assignedLawyerId?: string;
  assignedLawyerName?: string;
  responsibleId?: string;
  responsibleName?: string;
  filingDate?: string;
  hearingDate?: string;
  resolutionDate?: string;
  decisionCount: number;
  remarkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LegalDecision {
  id: string;
  caseId: string;
  title: string;
  description?: string;
  decisionDate: string;
  decisionType: 'court_ruling' | 'settlement' | 'mediation' | 'arbitration_award' | 'internal';
  isInFavor: boolean;
  amount?: number;
  isAppealable: boolean;
  appealDeadline?: string;
  documentUrl?: string;
  createdAt: string;
}

export interface LegalRemark {
  id: string;
  caseId: string;
  authorName: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface ContractLegalTemplate {
  id: string;
  name: string;
  code: string;
  category: 'CONSTRUCTION' | 'SUPPLY' | 'SERVICE' | 'SUBCONTRACT' | 'LEASE' | 'NDA' | 'OTHER';
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  version: number;
  description?: string;
  clauseCount: number;
  lastUsedDate?: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}
