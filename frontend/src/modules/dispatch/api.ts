import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type DispatchStatus = 'DRAFT' | 'PENDING' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export interface DispatchOrder {
  id: string;
  number: string;
  projectId: string;
  projectName?: string;
  purchaseRequestId?: string;
  supplierId?: string;
  supplierName?: string;
  status: DispatchStatus;
  dispatchDate?: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  origin?: string;
  destination?: string;
  transportType?: string;
  driverName?: string;
  vehicleNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierRating {
  id: string;
  supplierId: string;
  supplierName: string;
  qualityScore: number;
  deliveryScore: number;
  priceScore: number;
  overallScore: number;
  comment?: string;
  ratedByName: string;
  createdAt: string;
}

export interface DispatchOrderFilters extends PaginationParams {
  status?: DispatchStatus;
  projectId?: string;
  supplierId?: string;
  search?: string;
}

export const dispatchApi = {
  getAll: async (params?: DispatchOrderFilters): Promise<PaginatedResponse<DispatchOrder>> => {
    const response = await apiClient.get<PaginatedResponse<DispatchOrder>>('/procurement-ext/dispatch-orders', { params });
    return response.data;
  },

  getById: async (id: string): Promise<DispatchOrder> => {
    const response = await apiClient.get<DispatchOrder>(`/procurement-ext/dispatch-orders/${id}`);
    return response.data;
  },

  create: async (data: Partial<DispatchOrder>): Promise<DispatchOrder> => {
    const response = await apiClient.post<DispatchOrder>('/procurement-ext/dispatch-orders', data);
    return response.data;
  },

  update: async (id: string, data: Partial<DispatchOrder>): Promise<DispatchOrder> => {
    const response = await apiClient.put<DispatchOrder>(`/procurement-ext/dispatch-orders/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/procurement-ext/dispatch-orders/${id}`);
  },

  dispatch: async (id: string): Promise<DispatchOrder> => {
    const response = await apiClient.post<DispatchOrder>(`/procurement-ext/dispatch-orders/${id}/dispatch`);
    return response.data;
  },

  markInTransit: async (id: string): Promise<DispatchOrder> => {
    const response = await apiClient.post<DispatchOrder>(`/procurement-ext/dispatch-orders/${id}/in-transit`);
    return response.data;
  },

  markDelivered: async (id: string): Promise<DispatchOrder> => {
    const response = await apiClient.post<DispatchOrder>(`/procurement-ext/dispatch-orders/${id}/deliver`);
    return response.data;
  },

  cancel: async (id: string): Promise<DispatchOrder> => {
    const response = await apiClient.post<DispatchOrder>(`/procurement-ext/dispatch-orders/${id}/cancel`);
    return response.data;
  },

  // Supplier Ratings
  getSupplierRatings: async (supplierId: string): Promise<SupplierRating[]> => {
    const response = await apiClient.get<SupplierRating[]>(`/procurement-ext/supplier-ratings/${supplierId}`);
    return response.data;
  },

  createSupplierRating: async (data: Partial<SupplierRating>): Promise<SupplierRating> => {
    const response = await apiClient.post<SupplierRating>('/procurement-ext/supplier-ratings', data);
    return response.data;
  },

  updateSupplierRating: async (id: string, data: Partial<SupplierRating>): Promise<SupplierRating> => {
    const response = await apiClient.put<SupplierRating>(`/procurement-ext/supplier-ratings/${id}`, data);
    return response.data;
  },

  deleteSupplierRating: async (id: string): Promise<void> => {
    await apiClient.delete(`/procurement-ext/supplier-ratings/${id}`);
  },
};
