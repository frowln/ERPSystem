export type ContractType = 'PERMANENT' | 'FIXED_TERM' | 'PART_TIME' | 'CIVIL';
export type ContractStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'TERMINATED' | 'EXPIRED';

export interface EmploymentContract {
  id: string;
  number: string;
  employeeName: string;
  position: string;
  department: string;
  contractType: ContractType;
  status: ContractStatus;
  startDate: string;
  endDate: string | null;
  salary: number;
  trialPeriod: string | null;
}

export type StaffingEntryStatus = 'ACTIVE' | 'VACANT' | 'RESERVED' | 'ELIMINATED';

export interface StaffingEntry {
  id: string;
  department: string;
  position: string;
  grade?: string;
  salaryMin: number;
  salaryMax: number;
  headcount: number;
  filledCount: number;
  vacantCount: number;
  status: StaffingEntryStatus;
  effectiveDate: string;
}

export type TimeSheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type DayType = 'WORK' | 'WEEKEND' | 'HOLIDAY' | 'VACATION' | 'SICK' | 'BUSINESS_TRIP' | 'ABSENCE';

export interface TimeSheetEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  month: string; // YYYY-MM
  status: TimeSheetStatus;
  workDays: number;
  vacationDays: number;
  sickDays: number;
  businessTripDays: number;
  absenceDays: number;
  totalHours: number;
  overtimeHours: number;
}

export type PersonnelOrderType = 'HIRE' | 'TRANSFER' | 'DISMISSAL' | 'VACATION' | 'BUSINESS_TRIP' | 'BONUS' | 'DISCIPLINE' | 'SALARY_CHANGE';
export type PersonnelOrderStatus = 'DRAFT' | 'ON_APPROVAL' | 'APPROVED' | 'EXECUTED' | 'CANCELLED';

export interface PersonnelOrder {
  id: string;
  number: string;
  orderType: PersonnelOrderType;
  status: PersonnelOrderStatus;
  employeeName: string;
  department: string;
  subject: string;
  orderDate: string;
  effectiveDate: string;
  approvedById?: string;
  approvedByName?: string;
  createdAt: string;
}
