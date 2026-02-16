import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type ContractType = 'PERMANENT' | 'FIXED_TERM' | 'PART_TIME' | 'CIVIL';
export type ContractStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'TERMINATED' | 'EXPIRED';
export type PersonnelOrderType = 'HIRE' | 'TRANSFER' | 'DISMISSAL' | 'VACATION' | 'BONUS' | 'DISCIPLINARY' | 'BUSINESS_TRIP';
export type PersonnelOrderStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTED' | 'CANCELLED';

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

export interface StaffingTableEntry {
  id: string;
  department: string;
  position: string;
  category: string;
  headcount: number;
  filledCount: number;
  vacantCount: number;
  salaryMin: number;
  salaryMax: number;
  allowances?: number;
  effectiveDate: string;
}

export interface TimeSheet {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  month: string;
  year: number;
  workDays: number;
  workHours: number;
  sickDays: number;
  vacationDays: number;
  absentDays: number;
  overtimeHours: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
}

export interface PersonnelOrder {
  id: string;
  number: string;
  type: PersonnelOrderType;
  status: PersonnelOrderStatus;
  employeeName: string;
  description: string;
  effectiveDate: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface EmploymentContractFilters extends PaginationParams {
  contractType?: ContractType;
  status?: ContractStatus;
  department?: string;
  search?: string;
}

export interface StaffingTableFilters extends PaginationParams {
  department?: string;
  search?: string;
}

export interface TimeSheetFilters extends PaginationParams {
  department?: string;
  month?: string;
  year?: number;
  status?: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
  search?: string;
}

export interface PersonnelOrderFilters extends PaginationParams {
  type?: PersonnelOrderType;
  status?: PersonnelOrderStatus;
  search?: string;
}

export const hrRussianApi = {
  // Employment Contracts
  getContracts: async (params?: EmploymentContractFilters): Promise<PaginatedResponse<EmploymentContract>> => {
    const response = await apiClient.get<PaginatedResponse<EmploymentContract>>('/hr-russian/contracts', { params });
    return response.data;
  },

  getContract: async (id: string): Promise<EmploymentContract> => {
    const response = await apiClient.get<EmploymentContract>(`/hr-russian/contracts/${id}`);
    return response.data;
  },

  createContract: async (data: Partial<EmploymentContract>): Promise<EmploymentContract> => {
    const response = await apiClient.post<EmploymentContract>('/hr-russian/contracts', data);
    return response.data;
  },

  updateContract: async (id: string, data: Partial<EmploymentContract>): Promise<EmploymentContract> => {
    const response = await apiClient.put<EmploymentContract>(`/hr-russian/contracts/${id}`, data);
    return response.data;
  },

  terminateContract: async (id: string, reason: string, terminationDate: string): Promise<EmploymentContract> => {
    const response = await apiClient.post<EmploymentContract>(`/hr-russian/contracts/${id}/terminate`, { reason, terminationDate });
    return response.data;
  },

  // Staffing Table
  getStaffingTable: async (params?: StaffingTableFilters): Promise<PaginatedResponse<StaffingTableEntry>> => {
    const response = await apiClient.get<PaginatedResponse<StaffingTableEntry>>('/hr-russian/staffing', { params });
    return response.data;
  },

  getStaffingEntry: async (id: string): Promise<StaffingTableEntry> => {
    const response = await apiClient.get<StaffingTableEntry>(`/hr-russian/staffing/${id}`);
    return response.data;
  },

  createStaffingEntry: async (data: Partial<StaffingTableEntry>): Promise<StaffingTableEntry> => {
    const response = await apiClient.post<StaffingTableEntry>('/hr-russian/staffing', data);
    return response.data;
  },

  updateStaffingEntry: async (id: string, data: Partial<StaffingTableEntry>): Promise<StaffingTableEntry> => {
    const response = await apiClient.put<StaffingTableEntry>(`/hr-russian/staffing/${id}`, data);
    return response.data;
  },

  deleteStaffingEntry: async (id: string): Promise<void> => {
    await apiClient.delete(`/hr-russian/staffing/${id}`);
  },

  // Time Sheets
  getTimeSheets: async (params?: TimeSheetFilters): Promise<PaginatedResponse<TimeSheet>> => {
    const response = await apiClient.get<PaginatedResponse<TimeSheet>>('/hr-russian/timesheets', { params });
    return response.data;
  },

  getTimeSheet: async (id: string): Promise<TimeSheet> => {
    const response = await apiClient.get<TimeSheet>(`/hr-russian/timesheets/${id}`);
    return response.data;
  },

  createTimeSheet: async (data: Partial<TimeSheet>): Promise<TimeSheet> => {
    const response = await apiClient.post<TimeSheet>('/hr-russian/timesheets', data);
    return response.data;
  },

  updateTimeSheet: async (id: string, data: Partial<TimeSheet>): Promise<TimeSheet> => {
    const response = await apiClient.put<TimeSheet>(`/hr-russian/timesheets/${id}`, data);
    return response.data;
  },

  submitTimeSheet: async (id: string): Promise<TimeSheet> => {
    const response = await apiClient.post<TimeSheet>(`/hr-russian/timesheets/${id}/submit`);
    return response.data;
  },

  approveTimeSheet: async (id: string): Promise<TimeSheet> => {
    const response = await apiClient.post<TimeSheet>(`/hr-russian/timesheets/${id}/approve`);
    return response.data;
  },

  // Personnel Orders
  getOrders: async (params?: PersonnelOrderFilters): Promise<PaginatedResponse<PersonnelOrder>> => {
    const response = await apiClient.get<PaginatedResponse<PersonnelOrder>>('/hr-russian/orders', { params });
    return response.data;
  },

  getOrder: async (id: string): Promise<PersonnelOrder> => {
    const response = await apiClient.get<PersonnelOrder>(`/hr-russian/orders/${id}`);
    return response.data;
  },

  createOrder: async (data: Partial<PersonnelOrder>): Promise<PersonnelOrder> => {
    const response = await apiClient.post<PersonnelOrder>('/hr-russian/orders', data);
    return response.data;
  },

  updateOrder: async (id: string, data: Partial<PersonnelOrder>): Promise<PersonnelOrder> => {
    const response = await apiClient.put<PersonnelOrder>(`/hr-russian/orders/${id}`, data);
    return response.data;
  },

  approveOrder: async (id: string): Promise<PersonnelOrder> => {
    const response = await apiClient.post<PersonnelOrder>(`/hr-russian/orders/${id}/approve`);
    return response.data;
  },

  cancelOrder: async (id: string, reason: string): Promise<PersonnelOrder> => {
    const response = await apiClient.post<PersonnelOrder>(`/hr-russian/orders/${id}/cancel`, { reason });
    return response.data;
  },
};
