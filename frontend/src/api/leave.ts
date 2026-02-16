import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { LeaveRequest, LeaveRequestStatus, LeaveType, LeaveAllocation } from '@/modules/leave/types';

export interface LeaveRequestFilters extends PaginationParams {
  status?: LeaveRequestStatus;
  employeeId?: string;
  leaveTypeId?: string;
  search?: string;
}

export interface LeaveAllocationFilters extends PaginationParams {
  year?: number;
  employeeId?: string;
  search?: string;
}

export const leaveApi = {
  getLeaveRequests: async (params?: LeaveRequestFilters): Promise<PaginatedResponse<LeaveRequest>> => {
    const response = await apiClient.get<PaginatedResponse<LeaveRequest>>('/v1/leave/requests', { params });
    return response.data;
  },

  getLeaveRequest: async (id: string): Promise<LeaveRequest> => {
    const response = await apiClient.get<LeaveRequest>(`/v1/leave/requests/${id}`);
    return response.data;
  },

  createLeaveRequest: async (data: Partial<LeaveRequest>): Promise<LeaveRequest> => {
    const response = await apiClient.post<LeaveRequest>('/v1/leave/requests', data);
    return response.data;
  },

  approveLeaveRequest: async (id: string): Promise<LeaveRequest> => {
    const response = await apiClient.post<LeaveRequest>(`/v1/leave/requests/${id}/approve`);
    return response.data;
  },

  refuseLeaveRequest: async (id: string, reason: string): Promise<LeaveRequest> => {
    const response = await apiClient.post<LeaveRequest>(`/v1/leave/requests/${id}/refuse`, { reason });
    return response.data;
  },

  getLeaveTypes: async (): Promise<LeaveType[]> => {
    const response = await apiClient.get<LeaveType[]>('/v1/leave/types');
    return response.data;
  },

  createLeaveType: async (data: Partial<LeaveType>): Promise<LeaveType> => {
    const response = await apiClient.post<LeaveType>('/v1/leave/types', data);
    return response.data;
  },

  getLeaveAllocations: async (params?: LeaveAllocationFilters): Promise<PaginatedResponse<LeaveAllocation>> => {
    const response = await apiClient.get<PaginatedResponse<LeaveAllocation>>('/v1/leave/allocations', { params });
    return response.data;
  },

  createLeaveAllocation: async (data: Partial<LeaveAllocation>): Promise<LeaveAllocation> => {
    const response = await apiClient.post<LeaveAllocation>('/v1/leave/allocations', data);
    return response.data;
  },
};
