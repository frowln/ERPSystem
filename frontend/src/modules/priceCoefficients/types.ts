export type PriceCoefficientType = 'REGIONAL' | 'SEASONAL' | 'MATERIAL' | 'LABOR' | 'EQUIPMENT' | 'OVERHEAD' | 'CUSTOM';
export type PriceCoefficientStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'EXPIRED';

export interface PriceCoefficient {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: PriceCoefficientType;
  value: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: PriceCoefficientStatus;
  contractId?: string;
  contractName?: string;
  projectId?: string;
  projectName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceCoefficientCalculation {
  basePrice: number;
  coefficientIds: string[];
  resultPrice: number;
  appliedCoefficients: {
    id: string;
    name: string;
    value: number;
    effect: number;
  }[];
}
