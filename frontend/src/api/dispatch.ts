import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  DispatchOrder,
  DispatchStatus,
  DispatchRoute,
  CreateDispatchOrderRequest,
} from '@/modules/dispatch/types';

export interface DispatchOrderFilters extends PaginationParams {
  status?: DispatchStatus;
  projectId?: string;
  search?: string;
}

export interface DispatchRouteFilters extends PaginationParams {
  isActive?: boolean;
  search?: string;
}

export const dispatchApi = {
  getOrders: async (params?: DispatchOrderFilters): Promise<PaginatedResponse<DispatchOrder>> => {
    const response = await apiClient.get<PaginatedResponse<DispatchOrder>>('/dispatch/orders', { params });
    return response.data;
  },

  getOrder: async (id: string): Promise<DispatchOrder> => {
    const response = await apiClient.get<DispatchOrder>(`/dispatch/orders/${id}`);
    return response.data;
  },

  createOrder: async (data: CreateDispatchOrderRequest): Promise<DispatchOrder> => {
    const response = await apiClient.post<DispatchOrder>('/dispatch/orders', data);
    return response.data;
  },

  updateOrderStatus: async (id: string, status: DispatchStatus): Promise<DispatchOrder> => {
    const response = await apiClient.patch<DispatchOrder>(`/dispatch/orders/${id}/status`, { status });
    return response.data;
  },

  getRoutes: async (params?: DispatchRouteFilters): Promise<PaginatedResponse<DispatchRoute>> => {
    const response = await apiClient.get<PaginatedResponse<DispatchRoute>>('/dispatch/routes', { params });
    return response.data;
  },

  getRoute: async (id: string): Promise<DispatchRoute> => {
    const response = await apiClient.get<DispatchRoute>(`/dispatch/routes/${id}`);
    return response.data;
  },

  createRoute: async (data: Partial<DispatchRoute>): Promise<DispatchRoute> => {
    const response = await apiClient.post<DispatchRoute>('/dispatch/routes', data);
    return response.data;
  },

  updateRoute: async (id: string, data: Partial<DispatchRoute>): Promise<DispatchRoute> => {
    const response = await apiClient.put<DispatchRoute>(`/dispatch/routes/${id}`, data);
    return response.data;
  },
};
