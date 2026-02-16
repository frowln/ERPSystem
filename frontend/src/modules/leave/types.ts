export type LeaveRequestStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REFUSED' | 'CANCELLED';

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  color: string;
  requiresApproval: boolean;
  maxDaysPerYear?: number;
  isPaid: boolean;
  isActive: boolean;
  employeeCount: number;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  number: string;
  employeeId: string;
  employeeName: string;
  departmentName?: string;
  leaveTypeId: string;
  leaveTypeName: string;
  status: LeaveRequestStatus;
  dateFrom: string;
  dateTo: string;
  durationDays: number;
  reason?: string;
  approverId?: string;
  approverName?: string;
  approvedDate?: string;
  refusalReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveAllocation {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName?: string;
  leaveTypeId: string;
  leaveTypeName: string;
  year: number;
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
  status: 'DRAFT' | 'APPROVED' | 'EXPIRED';
  createdAt: string;
}
