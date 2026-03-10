import { apiClient } from './client';
import type { PurchaseOrder } from './procurement';

export interface CreatePurchaseOrderItemRequest {
  materialId?: string;
  materialName: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  specificationItemId?: string;
}

export interface CreatePurchaseOrderRequest {
  purchaseRequestId?: string;
  supplierId: string;
  projectId?: string;
  contractId?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  paymentTerms?: string;
  deliveryAddress?: string;
  notes?: string;
  items?: CreatePurchaseOrderItemRequest[];
}

export interface UpdatePurchaseOrderRequest {
  supplierId?: string;
  projectId?: string;
  contractId?: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  paymentTerms?: string;
  deliveryAddress?: string;
  notes?: string;
}

export interface DeliveryItemRequest {
  itemId: string;
  deliveredQuantity: number;
}

export interface RecordDeliveryRequest {
  deliveryDate?: string;
  items: DeliveryItemRequest[];
}

export const purchaseOrdersApi = {
  getById: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.get<PurchaseOrder>(`/purchase-orders/${id}`);
    return response.data;
  },

  getByProject: async (projectId: string): Promise<PurchaseOrder[]> => {
    const response = await apiClient.get<PurchaseOrder[]>(`/purchase-orders/by-project/${projectId}`);
    return response.data;
  },

  getByRequest: async (purchaseRequestId: string): Promise<PurchaseOrder> => {
    const response = await apiClient.get<PurchaseOrder>(`/purchase-orders/by-request/${purchaseRequestId}`);
    return response.data;
  },

  create: async (data: CreatePurchaseOrderRequest): Promise<PurchaseOrder> => {
    const response = await apiClient.post<PurchaseOrder>('/purchase-orders', data);
    return response.data;
  },

  createFromRequest: async (purchaseRequestId: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post<PurchaseOrder>(`/purchase-orders/from-request/${purchaseRequestId}`);
    return response.data;
  },

  update: async (id: string, data: UpdatePurchaseOrderRequest): Promise<PurchaseOrder> => {
    const response = await apiClient.put<PurchaseOrder>(`/purchase-orders/${id}`, data);
    return response.data;
  },

  approve: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post<PurchaseOrder>(`/purchase-orders/${id}/approve`);
    return response.data;
  },

  markSent: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post<PurchaseOrder>(`/purchase-orders/${id}/send`);
    return response.data;
  },

  recordDelivery: async (id: string, data: RecordDeliveryRequest): Promise<PurchaseOrder> => {
    const response = await apiClient.post<PurchaseOrder>(`/purchase-orders/${id}/deliver`, data);
    return response.data;
  },

  cancel: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post<PurchaseOrder>(`/purchase-orders/${id}/cancel`);
    return response.data;
  },
};
