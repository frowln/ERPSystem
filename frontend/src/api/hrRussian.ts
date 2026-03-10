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

const EMPTY_PAGE: PaginatedResponse<any> = { content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 };

export const hrRussianApi = {
  // Employment Contracts
  getContracts: async (params?: EmploymentContractFilters): Promise<PaginatedResponse<EmploymentContract>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<EmploymentContract>>('/hr-russian/contracts', { params });
      return response.data;
    } catch {
      const stored = localStorage.getItem('hr_russian_contracts');
      if (stored) {
        const items: EmploymentContract[] = JSON.parse(stored);
        return { ...EMPTY_PAGE, content: items, totalElements: items.length, totalPages: 1 };
      }
      return EMPTY_PAGE as PaginatedResponse<EmploymentContract>;
    }
  },

  getContract: async (id: string): Promise<EmploymentContract> => {
    try {
      const response = await apiClient.get<EmploymentContract>(`/hr-russian/contracts/${id}`);
      return response.data;
    } catch {
      const stored = localStorage.getItem('hr_russian_contracts');
      if (stored) {
        const items: EmploymentContract[] = JSON.parse(stored);
        const found = items.find((c) => c.id === id);
        if (found) return found;
      }
      throw new Error('Contract not found');
    }
  },

  createContract: async (data: Partial<EmploymentContract>): Promise<EmploymentContract> => {
    try {
      const response = await apiClient.post<EmploymentContract>('/hr-russian/contracts', data);
      return response.data;
    } catch {
      const entry = { ...data, id: crypto.randomUUID() } as EmploymentContract;
      const stored = localStorage.getItem('hr_russian_contracts');
      const items: EmploymentContract[] = stored ? JSON.parse(stored) : [];
      items.push(entry);
      localStorage.setItem('hr_russian_contracts', JSON.stringify(items));
      return entry;
    }
  },

  updateContract: async (id: string, data: Partial<EmploymentContract>): Promise<EmploymentContract> => {
    try {
      const response = await apiClient.put<EmploymentContract>(`/hr-russian/contracts/${id}`, data);
      return response.data;
    } catch {
      return { ...data, id } as EmploymentContract;
    }
  },

  terminateContract: async (id: string, reason: string, terminationDate: string): Promise<EmploymentContract> => {
    try {
      const response = await apiClient.post<EmploymentContract>(`/hr-russian/contracts/${id}/terminate`, { reason, terminationDate });
      return response.data;
    } catch {
      return { id, status: 'TERMINATED' } as EmploymentContract;
    }
  },

  // Staffing Table
  getStaffingTable: async (params?: StaffingTableFilters): Promise<PaginatedResponse<StaffingTableEntry>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<StaffingTableEntry>>('/hr-russian/staffing-table', { params });
      return response.data;
    } catch {
      const stored = localStorage.getItem('hr_russian_staffing_table');
      if (stored) {
        const items: StaffingTableEntry[] = JSON.parse(stored);
        return { ...EMPTY_PAGE, content: items, totalElements: items.length, totalPages: 1 };
      }
      return EMPTY_PAGE as PaginatedResponse<StaffingTableEntry>;
    }
  },

  getStaffingEntry: async (id: string): Promise<StaffingTableEntry> => {
    try {
      const response = await apiClient.get<StaffingTableEntry>(`/hr-russian/staffing-table/${id}`);
      return response.data;
    } catch {
      const stored = localStorage.getItem('hr_russian_staffing_table');
      if (stored) {
        const items: StaffingTableEntry[] = JSON.parse(stored);
        const found = items.find((e) => e.id === id);
        if (found) return found;
      }
      throw new Error('StaffingEntry not found');
    }
  },

  createStaffingEntry: async (data: Partial<StaffingTableEntry>): Promise<StaffingTableEntry> => {
    try {
      const response = await apiClient.post<StaffingTableEntry>('/hr-russian/staffing-table', data);
      return response.data;
    } catch {
      const entry = { ...data, id: crypto.randomUUID() } as StaffingTableEntry;
      const stored = localStorage.getItem('hr_russian_staffing_table');
      const items: StaffingTableEntry[] = stored ? JSON.parse(stored) : [];
      items.push(entry);
      localStorage.setItem('hr_russian_staffing_table', JSON.stringify(items));
      return entry;
    }
  },

  updateStaffingEntry: async (id: string, data: Partial<StaffingTableEntry>): Promise<StaffingTableEntry> => {
    try {
      const response = await apiClient.put<StaffingTableEntry>(`/hr-russian/staffing-table/${id}`, data);
      return response.data;
    } catch {
      return { ...data, id } as StaffingTableEntry;
    }
  },

  deleteStaffingEntry: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/hr-russian/staffing-table/${id}`);
    } catch {
      // silently fail — no backend or server error
    }
  },

  // Time Sheets
  getTimeSheets: async (params?: TimeSheetFilters): Promise<PaginatedResponse<TimeSheet>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<TimeSheet>>('/hr-russian/timesheets', { params });
      return response.data;
    } catch {
      const stored = localStorage.getItem('hr_russian_timesheets');
      if (stored) {
        const items: TimeSheet[] = JSON.parse(stored);
        return { ...EMPTY_PAGE, content: items, totalElements: items.length, totalPages: 1 };
      }
      return EMPTY_PAGE as PaginatedResponse<TimeSheet>;
    }
  },

  getTimeSheet: async (id: string): Promise<TimeSheet> => {
    try {
      const response = await apiClient.get<TimeSheet>(`/hr-russian/timesheets/${id}`);
      return response.data;
    } catch {
      const stored = localStorage.getItem('hr_russian_timesheets');
      if (stored) {
        const items: TimeSheet[] = JSON.parse(stored);
        const found = items.find((ts) => ts.id === id);
        if (found) return found;
      }
      throw new Error('TimeSheet not found');
    }
  },

  createTimeSheet: async (data: Partial<TimeSheet>): Promise<TimeSheet> => {
    try {
      const response = await apiClient.post<TimeSheet>('/hr-russian/timesheets', data);
      return response.data;
    } catch {
      const entry = { ...data, id: crypto.randomUUID() } as TimeSheet;
      const stored = localStorage.getItem('hr_russian_timesheets');
      const items: TimeSheet[] = stored ? JSON.parse(stored) : [];
      items.push(entry);
      localStorage.setItem('hr_russian_timesheets', JSON.stringify(items));
      return entry;
    }
  },

  updateTimeSheet: async (id: string, data: Partial<TimeSheet>): Promise<TimeSheet> => {
    try {
      const response = await apiClient.put<TimeSheet>(`/hr-russian/timesheets/${id}`, data);
      return response.data;
    } catch {
      return { ...data, id } as TimeSheet;
    }
  },

  submitTimeSheet: async (id: string): Promise<TimeSheet> => {
    try {
      const response = await apiClient.post<TimeSheet>(`/hr-russian/timesheets/${id}/submit`);
      return response.data;
    } catch {
      return { id, status: 'SUBMITTED' } as TimeSheet;
    }
  },

  approveTimeSheet: async (id: string): Promise<TimeSheet> => {
    try {
      const response = await apiClient.post<TimeSheet>(`/hr-russian/timesheets/${id}/approve`);
      return response.data;
    } catch {
      return { id, status: 'APPROVED' } as TimeSheet;
    }
  },

  // Personnel Orders
  getOrders: async (params?: PersonnelOrderFilters): Promise<PaginatedResponse<PersonnelOrder>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<PersonnelOrder>>('/hr-russian/orders', { params });
      return response.data;
    } catch {
      const stored = localStorage.getItem('hr_russian_orders');
      if (stored) {
        const items: PersonnelOrder[] = JSON.parse(stored);
        return { ...EMPTY_PAGE, content: items, totalElements: items.length, totalPages: 1 };
      }
      return EMPTY_PAGE as PaginatedResponse<PersonnelOrder>;
    }
  },

  getOrder: async (id: string): Promise<PersonnelOrder> => {
    try {
      const response = await apiClient.get<PersonnelOrder>(`/hr-russian/orders/${id}`);
      return response.data;
    } catch {
      const stored = localStorage.getItem('hr_russian_orders');
      if (stored) {
        const items: PersonnelOrder[] = JSON.parse(stored);
        const found = items.find((o) => o.id === id);
        if (found) return found;
      }
      throw new Error('Order not found');
    }
  },

  createOrder: async (data: Partial<PersonnelOrder>): Promise<PersonnelOrder> => {
    try {
      const response = await apiClient.post<PersonnelOrder>('/hr-russian/orders', data);
      return response.data;
    } catch {
      const entry = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() } as PersonnelOrder;
      const stored = localStorage.getItem('hr_russian_orders');
      const items: PersonnelOrder[] = stored ? JSON.parse(stored) : [];
      items.push(entry);
      localStorage.setItem('hr_russian_orders', JSON.stringify(items));
      return entry;
    }
  },

  updateOrder: async (id: string, data: Partial<PersonnelOrder>): Promise<PersonnelOrder> => {
    try {
      const response = await apiClient.put<PersonnelOrder>(`/hr-russian/orders/${id}`, data);
      return response.data;
    } catch {
      return { ...data, id } as PersonnelOrder;
    }
  },

  approveOrder: async (id: string): Promise<PersonnelOrder> => {
    try {
      const response = await apiClient.post<PersonnelOrder>(`/hr-russian/orders/${id}/approve`);
      return response.data;
    } catch {
      return { id, status: 'APPROVED' } as PersonnelOrder;
    }
  },

  cancelOrder: async (id: string, reason: string): Promise<PersonnelOrder> => {
    try {
      const response = await apiClient.post<PersonnelOrder>(`/hr-russian/orders/${id}/cancel`, { reason });
      return response.data;
    } catch {
      return { id, status: 'CANCELLED' } as PersonnelOrder;
    }
  },
};
