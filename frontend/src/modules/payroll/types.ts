export type PayrollTemplateType = 'SALARY' | 'HOURLY' | 'PIECE_RATE' | 'MIXED';
export type PayrollCalculationStatus = 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PAID';

export interface PayrollTemplate {
  id: string;
  name: string;
  code: string;
  type: PayrollTemplateType;
  baseSalary: number;
  hourlyRate: number;
  overtimeMultiplier: number;
  nightShiftMultiplier: number;
  holidayMultiplier: number;
  regionalCoefficient: number;
  northernAllowance: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollDeduction {
  name: string;
  type: 'TAX' | 'INSURANCE' | 'PENSION' | 'OTHER';
  rate: number;
  amount: number;
}

export interface PayrollCalculation {
  id: string;
  templateId: string;
  templateName: string;
  employeeId: string;
  employeeName: string;
  periodStart: string;
  periodEnd: string;
  workDays: number;
  workHours: number;
  overtimeHours: number;
  grossAmount: number;
  deductions: PayrollDeduction[];
  totalDeductions: number;
  netAmount: number;
  status: PayrollCalculationStatus;
  calculatedAt?: string;
  createdAt: string;
}
