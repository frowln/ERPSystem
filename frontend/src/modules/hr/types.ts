export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'SUSPENDED';

export interface Employee {
  id: string;
  employeeNumber: string;
  fullName: string;
  position: string;
  departmentId?: string;
  departmentName?: string;
  status: EmployeeStatus;
  hireDate: string;
  terminationDate?: string;
  phone?: string;
  email?: string;
  certificateCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  id: string;
  employeeId: string;
  name: string;
  number: string;
  issuedDate: string;
  expiryDate: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  issuingAuthority?: string;
  notes?: string;
}

export interface ProjectAssignment {
  id: string;
  employeeId: string;
  projectId: string;
  projectName: string;
  role: string;
  startDate: string;
  endDate?: string;
}

export type CrewStatus = 'ACTIVE' | 'IDLE' | 'ON_LEAVE' | 'DISBANDED';

export interface Crew {
  id: string;
  name: string;
  foreman: string;
  foremanId?: string;
  foremanPhone?: string;
  workersCount: number;
  currentProjectId?: string;
  currentProject?: string;
  status: CrewStatus;
  specialization: string;
  performance: number;
  activeOrders: number;
  createdAt: string;
  updatedAt: string;
}

export type TimesheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface Timesheet {
  id: string;
  employeeName: string;
  projectName: string;
  workDate: string;
  hoursWorked: number;
  overtimeHours: number;
  status: TimesheetStatus;
}

export interface TimesheetDetail {
  id: string;
  number: string;
  status: TimesheetStatus;
  employeeId: string;
  employeeName: string;
  employeePosition: string;
  department: string;
  projectName: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  totalOvertime: number;
  workDays: number;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DayEntry {
  date: string;
  dayOfWeek: string;
  hours: number;
  overtime: number;
  isWeekend: boolean;
}

export interface CreateEmployeeRequest {
  fullName: string;
  position: string;
  departmentId?: string;
  hireDate: string;
  phone?: string;
  email?: string;
}

export interface AssignCrewRequest {
  crewId: string;
  projectId: string;
  startDate: string;
  comment?: string;
}

// Crew Time Tracking

export type CrewTimeSheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface CrewTimeEntry {
  id: string;
  crewTimeSheetId: string;
  crewId: string;
  crewName: string;
  workDate: string;
  hoursWorked: number;
  overtimeHours: number;
  workersCount: number;
  workDescription: string;
  location?: string;
  weatherConditions?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrewTimeSheet {
  id: string;
  number: string;
  crewId: string;
  crewName: string;
  foremanName: string;
  projectId: string;
  projectName: string;
  periodStart: string;
  periodEnd: string;
  status: CrewTimeSheetStatus;
  totalHours: number;
  totalOvertimeHours: number;
  totalWorkerDays: number;
  entryCount: number;
  submittedById?: string;
  submittedByName?: string;
  submittedAt?: string;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Staffing Schedule
// ---------------------------------------------------------------------------

export interface StaffingPosition {
  id: string;
  department: string;
  position: string;
  grade: string;
  salaryMin: number;
  salaryMax: number;
  filled: number;
  total: number;
  vacancies: {
    id: string;
    status: 'open' | 'in_progress' | 'closed';
  }[];
}

export interface CreateVacancyRequest {
  department: string;
  position: string;
  grade: string;
  salaryMin: number;
  salaryMax: number;
}

// ---------------------------------------------------------------------------
// Timesheet T-13 (Goskomstat form)
// ---------------------------------------------------------------------------

export interface TimesheetT13Cell {
  employeeId: string;
  employeeName: string;
  day: number;
  code: string;
  dayHours: number;
  nightHours: number;
}

export interface TimesheetT13Row {
  employeeId: string;
  employeeName: string;
  position: string;
  cells: TimesheetT13Cell[];
  totalDays: number;
  totalHours: number;
  totalNightHours: number;
}

export interface UpdateTimesheetCellRequest {
  employeeId: string;
  day: number;
  code: string;
  dayHours: number;
  nightHours: number;
}

// ---------------------------------------------------------------------------
// Work Orders (Наряды)
// ---------------------------------------------------------------------------

export type HrWorkOrderType = 'task_order' | 'access_order';
export type HrWorkOrderStatus = 'draft' | 'issued' | 'in_progress' | 'completed' | 'cancelled';

export interface HrWorkOrder {
  id: string;
  number: string;
  type: HrWorkOrderType;
  projectId: string;
  projectName: string;
  crewName: string;
  workDescription: string;
  date: string;
  endDate?: string;
  safetyRequirements?: string;
  hazardousConditions?: string;
  requiredPermits?: string[];
  status: HrWorkOrderStatus;
}

export interface CreateWorkOrderRequest {
  type: HrWorkOrderType;
  projectId: string;
  crewName: string;
  workDescription: string;
  date: string;
  endDate?: string;
  safetyRequirements?: string;
  hazardousConditions?: string;
  requiredPermits?: string[];
}

// ---------------------------------------------------------------------------
// Qualifications & Permits
// ---------------------------------------------------------------------------

export type QualificationStatus = 'valid' | 'expiring' | 'expired';

export interface QualificationRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  qualificationType: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
  status: QualificationStatus;
  daysRemaining: number;
}

export interface CreateQualificationRequest {
  employeeId: string;
  qualificationType: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
}

// ---------------------------------------------------------------------------
// Seniority & Leave
// ---------------------------------------------------------------------------

export interface SeniorityRecord {
  employeeId: string;
  employeeName: string;
  hireDate: string;
  seniorityYears: number;
  seniorityMonths: number;
  seniorityDays: number;
  baseLeave: number;
  additionalLeave: number;
  totalLeave: number;
  usedLeave: number;
  remainingLeave: number;
}
