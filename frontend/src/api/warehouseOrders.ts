import { apiClient } from './client';
import type { PaginatedResponse } from '@/types';

export interface WarehouseOrderItem {
  id: string;
  warehouseOrderId: string;
  materialId: string;
  materialName?: string;
  unit?: string;
  quantity: number;
  unitPrice?: number;
  totalAmount?: number;
  lotNumber?: string;
  certificateNumber?: string;
}

export interface WarehouseOrder {
  id: string;
  orderNumber: string;
  orderType: 'RECEIPT' | 'ISSUE' | 'INTERNAL_TRANSFER' | 'RETURN';
  orderDate: string;
  warehouseId: string;
  stockMovementId?: string;
  counterpartyId?: string;
  contractId?: string;
  purchaseOrderId?: string;
  responsibleId?: string;
  receiverId?: string;
  totalQuantity: number;
  totalAmount: number;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  notes?: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WarehouseOrderFilters {
  status?: string;
  orderType?: string;
  warehouseId?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface CreateWarehouseOrderRequest {
  orderNumber: string;
  orderType: string;
  orderDate: string;
  warehouseId: string;
  counterpartyId?: string;
  contractId?: string;
  purchaseOrderId?: string;
  responsibleId?: string;
  receiverId?: string;
  notes?: string;
}

export interface CreateWarehouseOrderItemRequest {
  materialId: string;
  materialName?: string;
  unit?: string;
  quantity: number;
  unitPrice?: number;
  lotNumber?: string;
  certificateNumber?: string;
}

export const warehouseOrdersApi = {
  async getOrders(params?: WarehouseOrderFilters): Promise<PaginatedResponse<WarehouseOrder>> {
    const response = await apiClient.get<PaginatedResponse<WarehouseOrder>>('/warehouse/orders', { params });
    return response.data;
  },

  async getOrder(id: string): Promise<WarehouseOrder> {
    const response = await apiClient.get<WarehouseOrder>(`/warehouse/orders/${id}`);
    return response.data;
  },

  async getOrderItems(orderId: string): Promise<WarehouseOrderItem[]> {
    const response = await apiClient.get<WarehouseOrderItem[]>(`/warehouse/orders/${orderId}/items`);
    return response.data;
  },

  async createOrder(data: CreateWarehouseOrderRequest): Promise<WarehouseOrder> {
    const response = await apiClient.post<WarehouseOrder>('/warehouse/orders', data);
    return response.data;
  },

  async updateOrder(id: string, data: Partial<CreateWarehouseOrderRequest>): Promise<WarehouseOrder> {
    const response = await apiClient.put<WarehouseOrder>(`/warehouse/orders/${id}`, data);
    return response.data;
  },

  async addItem(orderId: string, item: CreateWarehouseOrderItemRequest): Promise<WarehouseOrderItem> {
    const response = await apiClient.post<WarehouseOrderItem>(`/warehouse/orders/${orderId}/items`, item);
    return response.data;
  },

  async confirmOrder(id: string): Promise<WarehouseOrder> {
    const response = await apiClient.post<WarehouseOrder>(`/warehouse/orders/${id}/confirm`);
    return response.data;
  },

  async cancelOrder(id: string): Promise<WarehouseOrder> {
    const response = await apiClient.post<WarehouseOrder>(`/warehouse/orders/${id}/cancel`);
    return response.data;
  },

  async deleteOrder(id: string): Promise<void> {
    await apiClient.delete(`/warehouse/orders/${id}`);
  },
};
