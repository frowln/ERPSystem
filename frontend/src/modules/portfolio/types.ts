// Portfolio / CRM types

export type OpportunityStage = 'LEAD' | 'QUALIFICATION' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
export type BidStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'AWARDED' | 'REJECTED' | 'WITHDRAWN';
export type PrequalificationStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface Opportunity {
  id: string;
  name: string;
  clientName: string;
  stage: OpportunityStage;
  value: number;
  probability: number;
  weightedValue: number;
  expectedCloseDate: string;
  ownerName: string;
  source?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityActivity {
  id: string;
  opportunityId: string;
  activityType: 'CALL' | 'MEETING' | 'EMAIL' | 'NOTE' | 'TASK';
  description: string;
  performedByName: string;
  performedAt: string;
}

export interface BidPackage {
  id: string;
  bidNumber: string;
  projectName: string;
  clientName: string;
  status: BidStatus;
  amount: number;
  submissionDeadline: string;
  submittedDate?: string;
  evaluationScore?: number;
  responsibleName: string;
  notes?: string;
  createdAt: string;
}

export interface PrequalificationRecord {
  id: string;
  companyName: string;
  projectType: string;
  status: PrequalificationStatus;
  submittedDate: string;
  expiryDate?: string;
  score?: number;
  contactPerson: string;
  contactEmail: string;
  notes?: string;
}

export interface BidComparison {
  id: string;
  bidPackageId: string;
  vendorName: string;
  totalPrice: number;
  technicalScore: number;
  financialScore: number;
  experienceScore: number;
  qualityScore: number;
  timelineScore: number;
  weightedTotal: number;
  rank: number;
  recommendation: 'RECOMMENDED' | 'ACCEPTABLE' | 'NOT_RECOMMENDED';
}
