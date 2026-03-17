import { apiClient } from './client';
import type {
  Employee,
  Timesheet,
  PaginatedResponse,
  PaginationParams,
} from '@/types';
import type {
  StaffingPosition,
  CreateVacancyRequest,
  TimesheetT13Row,
  UpdateTimesheetCellRequest,
  HrWorkOrder,
  CreateWorkOrderRequest,
  QualificationRecord,
  CreateQualificationRequest,
  SeniorityRecord,
} from '@/modules/hr/types';

export interface EmployeeFilters extends PaginationParams {
  status?: string;
  search?: string;
  jobTitle?: string;
}

export interface Certificate {
  id: string;
  employeeId: string;
  employeeName: string;
  name: string;
  certificateType: string;
  issueDate: string;
  expiryDate: string;
  status: 'VALID' | 'EXPIRING' | 'EXPIRED';
  issuedBy?: string;
  number?: string;
  expired?: boolean;
  expiring?: boolean;
}

export interface CertificationTypeBreakdown {
  certType: string;
  displayName?: string;
  total: number;
  valid: number;
  expiring: number;
  expired: number;
}

export interface CertificationDashboard {
  totalCertificates: number;
  validCount: number;
  expiringCount: number;
  expiredCount: number;
  compliancePercent?: number;
  expiringCertificates: Certificate[];
  expiredCertificates: Certificate[];
  byType: Record<string, CertificationTypeBreakdown>;
}

export interface Department {
  id: string;
  name: string;
}

const EMPTY_PAGE: PaginatedResponse<any> = { content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 };

export const hrApi = {
  getDepartments: async (): Promise<Department[]> => {
    try {
      const response = await apiClient.get<Department[]>('/admin/departments');
      return response.data;
    } catch {
      const stored = localStorage.getItem('hr_departments');
      return stored ? JSON.parse(stored) : [];
    }
  },

  getEmployees: async (params?: EmployeeFilters): Promise<PaginatedResponse<Employee>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<Employee>>('/employees', { params });
      return response.data;
    } catch {
      return EMPTY_PAGE as PaginatedResponse<Employee>;
    }
  },

  getEmployee: async (id: string): Promise<Employee> => {
    const response = await apiClient.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  getTimesheets: async (params?: PaginationParams): Promise<PaginatedResponse<Timesheet>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<Timesheet>>('/timesheets', { params });
      return response.data;
    } catch {
      const stored = localStorage.getItem('hr_timesheets');
      if (stored) {
        const items: Timesheet[] = JSON.parse(stored);
        return { ...EMPTY_PAGE, content: items, totalElements: items.length, totalPages: 1 };
      }
      return EMPTY_PAGE as PaginatedResponse<Timesheet>;
    }
  },

  createEmployee: async (data: Partial<Employee>): Promise<Employee> => {
    const response = await apiClient.post<Employee>('/employees', data);
    return response.data;
  },

  getTimesheet: async (id: string): Promise<Timesheet> => {
    try {
      const response = await apiClient.get<Timesheet>(`/timesheets/${id}`);
      return response.data;
    } catch {
      const stored = localStorage.getItem('hr_timesheets');
      if (stored) {
        const items: Timesheet[] = JSON.parse(stored);
        const found = items.find((ts) => ts.id === id);
        if (found) return found;
      }
      throw new Error('Timesheet not found');
    }
  },

  getCrews: async (params?: PaginationParams): Promise<PaginatedResponse<any>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<any>>('/crew', { params });
      return response.data;
    } catch {
      const stored = localStorage.getItem('hr_crews');
      if (stored) {
        const items = JSON.parse(stored);
        return { ...EMPTY_PAGE, content: items, totalElements: items.length, totalPages: 1 };
      }
      return EMPTY_PAGE;
    }
  },

  getCertificationDashboard: async (params?: { status?: string; certType?: string; search?: string }): Promise<CertificationDashboard> => {
    try {
      const response = await apiClient.get<CertificationDashboard>('/certifications/dashboard', { params });
      return response.data;
    } catch {
      return {
        totalCertificates: 0,
        validCount: 0,
        expiringCount: 0,
        expiredCount: 0,
        expiringCertificates: [],
        expiredCertificates: [],
        byType: {},
      };
    }
  },

  // ---------------------------------------------------------------------------
  // Staffing Schedule
  // ---------------------------------------------------------------------------

  getStaffingSchedule: async (params?: { department?: string; vacancyStatus?: string }): Promise<StaffingPosition[]> => {
    const response = await apiClient.get<StaffingPosition[]>('/hr/staffing-schedule', { params });
    return response.data;
  },

  createVacancy: async (data: CreateVacancyRequest): Promise<StaffingPosition> => {
    const response = await apiClient.post<StaffingPosition>('/hr/staffing-schedule/vacancies', data);
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Timesheet T-13
  // ---------------------------------------------------------------------------

  getTimesheetT13: async (projectId: string, month: number, year: number): Promise<TimesheetT13Row[]> => {
    const response = await apiClient.get<TimesheetT13Row[]>('/hr/timesheet-t13', {
      params: { projectId, month, year },
    });
    return response.data;
  },

  updateTimesheetCell: async (projectId: string, month: number, year: number, data: UpdateTimesheetCellRequest): Promise<void> => {
    await apiClient.put('/hr/timesheet-t13/cell', data, {
      params: { projectId, month, year },
    });
  },

  // ---------------------------------------------------------------------------
  // Work Orders
  // ---------------------------------------------------------------------------

  getWorkOrders: async (params?: { type?: string; status?: string }): Promise<HrWorkOrder[]> => {
    const response = await apiClient.get<HrWorkOrder[]>('/hr/work-orders', { params });
    return response.data;
  },

  createWorkOrder: async (data: CreateWorkOrderRequest): Promise<HrWorkOrder> => {
    const response = await apiClient.post<HrWorkOrder>('/hr/work-orders', data);
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Qualifications & Permits
  // ---------------------------------------------------------------------------

  getQualifications: async (params?: { qualificationType?: string; status?: string }): Promise<QualificationRecord[]> => {
    const response = await apiClient.get<QualificationRecord[]>('/hr/qualifications', { params });
    return response.data;
  },

  createQualification: async (data: CreateQualificationRequest): Promise<QualificationRecord> => {
    const response = await apiClient.post<QualificationRecord>('/hr/qualifications', data);
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Seniority & Leave
  // ---------------------------------------------------------------------------

  getSeniorityReport: async (): Promise<SeniorityRecord[]> => {
    const response = await apiClient.get<SeniorityRecord[]>('/hr/seniority-report');
    return response.data;
  },
};
