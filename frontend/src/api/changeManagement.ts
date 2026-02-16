import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { ChangeEvent, ChangeOrder, ChangeOrderLineItem, ChangeEventStatus, ChangeOrderStatus } from '@/modules/changeManagement/types';

export interface ChangeEventFilters extends PaginationParams {
  status?: ChangeEventStatus;
  projectId?: string;
  search?: string;
}

export interface ChangeOrderFilters extends PaginationParams {
  status?: ChangeOrderStatus;
  projectId?: string;
  search?: string;
}

export const changeManagementApi = {
  getChangeEvents: async (params?: ChangeEventFilters): Promise<PaginatedResponse<ChangeEvent>> => {
    const response = await apiClient.get<PaginatedResponse<ChangeEvent>>('/change-events', { params });
    return response.data;
  },

  getChangeEvent: async (id: string): Promise<ChangeEvent> => {
    const response = await apiClient.get<ChangeEvent>(`/change-events/${id}`);
    return response.data;
  },

  createChangeEvent: async (data: Partial<ChangeEvent>): Promise<ChangeEvent> => {
    const response = await apiClient.post<ChangeEvent>('/change-events', data);
    return response.data;
  },

  getChangeOrders: async (params?: ChangeOrderFilters): Promise<PaginatedResponse<ChangeOrder>> => {
    const response = await apiClient.get<PaginatedResponse<ChangeOrder>>('/change-orders', { params });
    return response.data;
  },

  getChangeOrder: async (id: string): Promise<ChangeOrder> => {
    const response = await apiClient.get<ChangeOrder>(`/change-orders/${id}`);
    return response.data;
  },

  createChangeOrder: async (data: Partial<ChangeOrder>): Promise<ChangeOrder> => {
    const response = await apiClient.post<ChangeOrder>('/change-orders', data);
    return response.data;
  },

  updateChangeOrder: async (id: string, data: Partial<ChangeOrder>): Promise<ChangeOrder> => {
    const response = await apiClient.put<ChangeOrder>(`/change-orders/${id}`, data);
    return response.data;
  },

  getChangeOrderLineItems: async (id: string): Promise<ChangeOrderLineItem[]> => {
    const response = await apiClient.get<ChangeOrderLineItem[]>(`/change-orders/${id}/line-items`);
    return response.data;
  },

  deleteChangeOrder: async (id: string): Promise<void> => {
    await apiClient.delete(`/change-orders/${id}`);
  },
};
