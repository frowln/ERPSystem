import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  DailyLog,
  DailyLogStatus,
  DailyLogEntry,
  WorkOrder,
  WorkOrderStatus,
  WorkOrderPriority,
  ResourceSchedule,
  ResourceType,
  CreateDailyLogRequest,
  CreateWorkOrderRequest,
} from '@/modules/operations/types';

export interface DailyLogFilters extends PaginationParams {
  status?: DailyLogStatus;
  projectId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface WorkOrderFilters extends PaginationParams {
  status?: WorkOrderStatus;
  priority?: WorkOrderPriority;
  projectId?: string;
  assignedToId?: string;
  search?: string;
}

export interface ResourceScheduleFilters extends PaginationParams {
  resourceType?: ResourceType;
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const operationsApi = {
  // Daily Logs
  getDailyLogs: async (params?: DailyLogFilters): Promise<PaginatedResponse<DailyLog>> => {
    const response = await apiClient.get<PaginatedResponse<DailyLog>>('/daily-logs', { params });
    return response.data;
  },

  getDailyLog: async (id: string): Promise<DailyLog> => {
    const response = await apiClient.get<DailyLog>(`/daily-logs/${id}`);
    return response.data;
  },

  createDailyLog: async (data: CreateDailyLogRequest): Promise<DailyLog> => {
    const response = await apiClient.post<DailyLog>('/daily-logs', data);
    return response.data;
  },

  updateDailyLog: async (id: string, data: Partial<DailyLog>): Promise<DailyLog> => {
    const response = await apiClient.put<DailyLog>(`/daily-logs/${id}`, data);
    return response.data;
  },

  submitDailyLog: async (id: string): Promise<DailyLog> => {
    const response = await apiClient.patch<DailyLog>(`/daily-logs/${id}/submit`);
    return response.data;
  },

  approveDailyLog: async (id: string): Promise<DailyLog> => {
    const response = await apiClient.patch<DailyLog>(`/daily-logs/${id}/approve`);
    return response.data;
  },

  getDailyLogEntries: async (id: string): Promise<DailyLogEntry[]> => {
    const response = await apiClient.get<DailyLogEntry[]>(`/daily-logs/${id}/entries`);
    return response.data;
  },

  // Work Orders
  getWorkOrders: async (params?: WorkOrderFilters): Promise<PaginatedResponse<WorkOrder>> => {
    const response = await apiClient.get<PaginatedResponse<WorkOrder>>('/ops/work-orders', { params });
    return response.data;
  },

  getWorkOrder: async (id: string): Promise<WorkOrder> => {
    const response = await apiClient.get<WorkOrder>(`/ops/work-orders/${id}`);
    return response.data;
  },

  createWorkOrder: async (data: CreateWorkOrderRequest): Promise<WorkOrder> => {
    const response = await apiClient.post<WorkOrder>('/ops/work-orders', data);
    return response.data;
  },

  updateWorkOrder: async (id: string, data: Partial<WorkOrder>): Promise<WorkOrder> => {
    const response = await apiClient.put<WorkOrder>(`/ops/work-orders/${id}`, data);
    return response.data;
  },

  changeWorkOrderStatus: async (id: string, status: WorkOrderStatus): Promise<WorkOrder> => {
    const response = await apiClient.patch<WorkOrder>(`/ops/work-orders/${id}/status`, { status });
    return response.data;
  },

  // Resource Schedules
  getResourceSchedules: async (params?: ResourceScheduleFilters): Promise<PaginatedResponse<ResourceSchedule>> => {
    const response = await apiClient.get<PaginatedResponse<ResourceSchedule>>('/resource-allocations', { params });
    return response.data;
  },

  getResourceSchedule: async (id: string): Promise<ResourceSchedule> => {
    const response = await apiClient.get<ResourceSchedule>(`/resource-allocations/${id}`);
    return response.data;
  },

  createResourceSchedule: async (data: Partial<ResourceSchedule>): Promise<ResourceSchedule> => {
    const response = await apiClient.post<ResourceSchedule>('/resource-allocations', data);
    return response.data;
  },

  deleteResourceSchedule: async (id: string): Promise<void> => {
    await apiClient.delete(`/resource-allocations/${id}`);
  },
};
