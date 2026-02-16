export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaxRiskStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED';

export interface TaxRiskAssessment {
  id: string;
  name: string;
  projectId?: string;
  projectName?: string;
  assessmentDate: string;
  riskLevel: RiskLevel;
  overallScore: number;
  status: TaxRiskStatus;
  description?: string;
  assessorName?: string;
  factors: TaxRiskFactor[];
  mitigations: TaxRiskMitigation[];
  createdAt: string;
  updatedAt: string;
}

export interface TaxRiskFactor {
  id: string;
  name: string;
  category: string;
  weight: number;
  score: number;
  weightedScore: number;
  description?: string;
  evidence?: string;
}

export interface TaxRiskMitigation {
  id: string;
  factorId?: string;
  factorName?: string;
  action: string;
  responsible?: string;
  deadline?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  notes?: string;
}
