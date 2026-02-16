import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { PayrollTemplate, PayrollCalculation } from './types';

export interface PayrollTemplateFilters extends PaginationParams {
  type?: string;
  isActive?: boolean;
  search?: string;
}

export interface CalculatePayrollRequest {
  templateId: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  workDays?: number;
  workHours?: number;
  overtimeHours?: number;
}

export const payrollApi = {
  getTemplates: async (params?: PayrollTemplateFilters): Promise<PaginatedResponse<PayrollTemplate>> => {
    const response = await apiClient.get<PaginatedResponse<PayrollTemplate>>('/payroll/templates', { params });
    return response.data;
  },

  getTemplate: async (id: string): Promise<PayrollTemplate> => {
    const response = await apiClient.get<PayrollTemplate>(`/payroll/templates/${id}`);
    return response.data;
  },

  createTemplate: async (data: Partial<PayrollTemplate>): Promise<PayrollTemplate> => {
    const response = await apiClient.post<PayrollTemplate>('/payroll/templates', data);
    return response.data;
  },

  updateTemplate: async (id: string, data: Partial<PayrollTemplate>): Promise<PayrollTemplate> => {
    const response = await apiClient.put<PayrollTemplate>(`/payroll/templates/${id}`, data);
    return response.data;
  },

  deleteTemplate: async (id: string): Promise<void> => {
    await apiClient.delete(`/payroll/templates/${id}`);
  },

  calculatePayroll: async (request: CalculatePayrollRequest): Promise<PayrollCalculation> => {
    const response = await apiClient.post<PayrollCalculation>('/payroll/calculate', request);
    return response.data;
  },

  getCalculations: async (params?: PaginationParams): Promise<PaginatedResponse<PayrollCalculation>> => {
    const response = await apiClient.get<PaginatedResponse<PayrollCalculation>>('/payroll/calculations', { params });
    return response.data;
  },
};
