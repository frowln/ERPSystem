import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { EmploymentContract, PersonnelOrder, StaffingEntry, PersonnelOrderType } from './types';

export interface EmploymentOrderFilters extends PaginationParams {
  orderType?: PersonnelOrderType;
}

export const hrRussianApi = {
  // ---- Employment Contracts ----

  getContractsByEmployee: async (employeeId: string): Promise<EmploymentContract[]> => {
    const response = await apiClient.get<EmploymentContract[]>(`/hr-russian/contracts/employee/${employeeId}`);
    return response.data;
  },

  getContractById: async (id: string): Promise<EmploymentContract> => {
    const response = await apiClient.get<EmploymentContract>(`/hr-russian/contracts/${id}`);
    return response.data;
  },

  createContract: async (data: Partial<EmploymentContract>): Promise<EmploymentContract> => {
    const response = await apiClient.post<EmploymentContract>('/hr-russian/contracts', data);
    return response.data;
  },

  terminateContract: async (id: string): Promise<EmploymentContract> => {
    const response = await apiClient.put<EmploymentContract>(`/hr-russian/contracts/${id}/terminate`);
    return response.data;
  },

  deleteContract: async (id: string): Promise<void> => {
    await apiClient.delete(`/hr-russian/contracts/${id}`);
  },

  // ---- Employment Orders ----

  getOrders: async (params?: EmploymentOrderFilters): Promise<PaginatedResponse<PersonnelOrder>> => {
    const response = await apiClient.get<PaginatedResponse<PersonnelOrder>>('/hr-russian/orders', { params });
    return response.data;
  },

  getOrdersByEmployee: async (employeeId: string): Promise<PersonnelOrder[]> => {
    const response = await apiClient.get<PersonnelOrder[]>(`/hr-russian/orders/employee/${employeeId}`);
    return response.data;
  },

  createOrder: async (data: Partial<PersonnelOrder>): Promise<PersonnelOrder> => {
    const response = await apiClient.post<PersonnelOrder>('/hr-russian/orders', data);
    return response.data;
  },

  deleteOrder: async (id: string): Promise<void> => {
    await apiClient.delete(`/hr-russian/orders/${id}`);
  },

  // ---- Staffing Table ----

  getStaffingTable: async (params?: PaginationParams): Promise<PaginatedResponse<StaffingEntry>> => {
    const response = await apiClient.get<PaginatedResponse<StaffingEntry>>('/hr-russian/staffing-table', { params });
    return response.data;
  },

  getVacancies: async (): Promise<StaffingEntry[]> => {
    const response = await apiClient.get<StaffingEntry[]>('/hr-russian/staffing-table/vacancies');
    return response.data;
  },

  createStaffingPosition: async (data: Partial<StaffingEntry>): Promise<StaffingEntry> => {
    const response = await apiClient.post<StaffingEntry>('/hr-russian/staffing-table', data);
    return response.data;
  },

  deleteStaffingPosition: async (id: string): Promise<void> => {
    await apiClient.delete(`/hr-russian/staffing-table/${id}`);
  },

  // ---- Vacations ----

  getVacations: async (params?: PaginationParams): Promise<PaginatedResponse<unknown>> => {
    const response = await apiClient.get('/hr-russian/vacations', { params });
    return response.data;
  },

  // ---- Sick Leaves ----

  getSickLeaves: async (params?: PaginationParams): Promise<PaginatedResponse<unknown>> => {
    const response = await apiClient.get('/hr-russian/sick-leaves', { params });
    return response.data;
  },

  // ---- Business Trips ----

  getBusinessTrips: async (params?: PaginationParams): Promise<PaginatedResponse<unknown>> => {
    const response = await apiClient.get('/hr-russian/business-trips', { params });
    return response.data;
  },
};
