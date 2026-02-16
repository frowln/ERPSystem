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
