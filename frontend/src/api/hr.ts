import { apiClient } from './client';
import type {
  Employee,
  Timesheet,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export interface EmployeeFilters extends PaginationParams {
  status?: string;
  search?: string;
}

export const hrApi = {
  getEmployees: async (params?: EmployeeFilters): Promise<PaginatedResponse<Employee>> => {
    const response = await apiClient.get<PaginatedResponse<Employee>>('/employees', { params });
    return response.data;
  },

  getEmployee: async (id: string): Promise<Employee> => {
    const response = await apiClient.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  getTimesheets: async (params?: PaginationParams): Promise<PaginatedResponse<Timesheet>> => {
    const response = await apiClient.get<PaginatedResponse<Timesheet>>('/timesheets', { params });
    return response.data;
  },

  createEmployee: async (data: Partial<Employee>): Promise<Employee> => {
    const response = await apiClient.post<Employee>('/employees', data);
    return response.data;
  },

  getTimesheet: async (id: string): Promise<Timesheet> => {
    const response = await apiClient.get<Timesheet>(`/timesheets/${id}`);
    return response.data;
  },

  getCrews: async (params?: PaginationParams): Promise<PaginatedResponse<any>> => {
    const response = await apiClient.get<PaginatedResponse<any>>('/crews', { params });
    return response.data;
  },
};
