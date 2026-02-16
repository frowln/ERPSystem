import { apiClient } from './client';
import type {
  PurchaseRequest,
  PurchaseRequestItem,
  PurchaseRequestStatus,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export interface ProcurementFilters extends PaginationParams {
  status?: PurchaseRequestStatus;
  statuses?: PurchaseRequestStatus[];
  projectId?: string;
  priority?: string;
  requestedById?: string;
  search?: string;
}

export interface ProcurementDashboard {
  totalRequests: number;
  pendingApproval: number;
  inProgress: number;
  delivered: number;
  totalAmount: number;
  byStatus: { status: string; count: number }[];
  byPriority: { priority: string; count: number }[];
}

export interface PurchaseRequestCounters {
  all: number;
  my: number;
  inApproval: number;
  inWork: number;
  delivered: number;
}

export interface CreatePurchaseRequestPayload {
  requestDate: string;
  projectId?: string;
  contractId?: string;
  specificationId?: string;
  priority?: PurchaseRequest['priority'];
  requestedById?: string;
  requestedByName?: string;
  notes?: string;
}

export interface CreatePurchaseRequestItemPayload {
  specItemId?: string;
  sequence?: number;
  name: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice?: number;
  notes?: string;
}

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'SENT'
  | 'CONFIRMED'
  | 'PARTIALLY_DELIVERED'
  | 'DELIVERED'
  | 'INVOICED'
  | 'CLOSED'
  | 'CANCELLED';

export type PurchaseOrderBulkTransitionAction = 'SEND' | 'CONFIRM' | 'INVOICE' | 'CANCEL' | 'CLOSE';

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  projectId?: string;
  purchaseRequestId?: string;
  contractId?: string;
  supplierId: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;
  status: PurchaseOrderStatus;
  paymentTerms?: string;
  deliveryAddress?: string;
  notes?: string;
  organizationId: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  materialId: string;
  materialName?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  totalAmount: number;
  deliveredQuantity?: number;
  specificationItemId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseOrderPayload {
  orderNumber: string;
  supplierId: string;
  orderDate?: string;
  projectId?: string;
  purchaseRequestId?: string;
  contractId?: string;
  expectedDeliveryDate?: string;
  currency?: string;
  paymentTerms?: string;
  deliveryAddress?: string;
  notes?: string;
}

export interface PurchaseOrderItemPayload {
  materialId: string;
  materialName?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  specificationItemId?: string;
}

export interface PurchaseOrderWithItemsPayload extends PurchaseOrderPayload {
  items: PurchaseOrderItemPayload[];
}

export interface PurchaseOrderBulkTransitionPayload {
  action: PurchaseOrderBulkTransitionAction;
  orderIds: string[];
}

export interface PurchaseOrderBulkTransitionError {
  orderId: string;
  message: string;
}

export interface PurchaseOrderBulkTransitionResult {
  action: PurchaseOrderBulkTransitionAction;
  requestedCount: number;
  successCount: number;
  failedCount: number;
  succeededOrderIds: string[];
  errors: PurchaseOrderBulkTransitionError[];
}

export interface PurchaseOrderFilters extends PaginationParams {
  status?: PurchaseOrderStatus;
  projectId?: string;
  supplierId?: string;
  purchaseRequestId?: string;
  search?: string;
}

export const procurementApi = {
  getPurchaseRequests: async (params?: ProcurementFilters): Promise<PaginatedResponse<PurchaseRequest>> => {
    const { statuses, ...rest } = params ?? {};
    const response = await apiClient.get<PaginatedResponse<PurchaseRequest>>('/procurement/requests', {
      params: {
        ...rest,
        statuses: statuses && statuses.length > 0 ? statuses.join(',') : undefined,
      },
    });
    return response.data;
  },

  getPurchaseRequestCounters: async (params?: Pick<ProcurementFilters, 'projectId' | 'priority' | 'requestedById' | 'search'>): Promise<PurchaseRequestCounters> => {
    const response = await apiClient.get<PurchaseRequestCounters>('/procurement/requests/counters', {
      params,
    });
    return response.data;
  },

  getPurchaseRequest: async (id: string): Promise<PurchaseRequest> => {
    const response = await apiClient.get<PurchaseRequest>(`/procurement/requests/${id}`);
    return response.data;
  },

  createPurchaseRequest: async (data: CreatePurchaseRequestPayload): Promise<PurchaseRequest> => {
    const response = await apiClient.post<PurchaseRequest>('/procurement/requests', data);
    return response.data;
  },

  addPurchaseRequestItem: async (id: string, data: CreatePurchaseRequestItemPayload): Promise<PurchaseRequestItem> => {
    const response = await apiClient.post<PurchaseRequestItem>(`/procurement/requests/${id}/items`, data);
    return response.data;
  },

  getProcurementDashboard: async (projectId?: string): Promise<ProcurementDashboard> => {
    const response = await apiClient.get<ProcurementDashboard>('/procurement/requests/dashboard', {
      params: projectId ? { projectId } : undefined,
    });
    return response.data;
  },

  getMaterials: async (): Promise<{ id: string; name: string; unit: string }[]> => {
    const response = await apiClient.get<PaginatedResponse<{ id: string; name: string; unitOfMeasure: string }>>(
      '/warehouse/materials',
      { params: { page: 0, size: 500, sort: 'name,asc' } },
    );
    return response.data.content.map((material) => ({
      id: material.id,
      name: material.name,
      unit: material.unitOfMeasure || 'шт',
    }));
  },

  getSuppliers: async (): Promise<{ id: string; name: string; email: string; categories: string[] }[]> => {
    const response = await apiClient.get<Array<{
      id: string;
      name: string;
      email?: string | null;
      categories?: string[] | null;
    }>>('/procurement/suppliers');
    return response.data.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      email: supplier.email?.trim() ?? '',
      categories: (supplier.categories ?? []).filter((category): category is string => category != null && category.trim().length > 0),
    }));
  },

  sendPriceRequests: async (data: {
    materialIds: string[];
    quantities: Record<string, string>;
    supplierIds: string[];
    deadline: string;
    deliveryAddress?: string;
    message?: string;
  }): Promise<void> => {
    await apiClient.post('/procurement/price-requests', data);
  },

  approvePurchaseRequest: async (id: string, data: {
    decision: 'APPROVE' | 'REJECT' | 'RETURN';
    comment?: string;
    conditions?: string;
  }): Promise<void> => {
    if (data.decision === 'APPROVE') {
      await apiClient.post(`/procurement/requests/${id}/approve`);
      return;
    }

    const reason = data.comment?.trim() || data.conditions?.trim() || (
      data.decision === 'RETURN' ? 'Возвращено на доработку' : 'Отклонено'
    );
    await apiClient.post(`/procurement/requests/${id}/reject`, { reason });
  },

  submitPurchaseRequest: async (id: string): Promise<PurchaseRequest> => {
    const response = await apiClient.post<PurchaseRequest>(`/procurement/requests/${id}/submit`);
    return response.data;
  },

  approvePurchaseRequestStatus: async (id: string): Promise<PurchaseRequest> => {
    const response = await apiClient.post<PurchaseRequest>(`/procurement/requests/${id}/approve`);
    return response.data;
  },

  rejectPurchaseRequest: async (id: string, reason: string): Promise<PurchaseRequest> => {
    const response = await apiClient.post<PurchaseRequest>(`/procurement/requests/${id}/reject`, { reason });
    return response.data;
  },

  assignPurchaseRequest: async (id: string, assignedToId: string): Promise<PurchaseRequest> => {
    const response = await apiClient.post<PurchaseRequest>(`/procurement/requests/${id}/assign`, { assignedToId });
    return response.data;
  },

  markPurchaseRequestOrdered: async (id: string): Promise<PurchaseRequest> => {
    const response = await apiClient.post<PurchaseRequest>(`/procurement/requests/${id}/ordered`);
    return response.data;
  },

  markPurchaseRequestDelivered: async (id: string): Promise<PurchaseRequest> => {
    const response = await apiClient.post<PurchaseRequest>(`/procurement/requests/${id}/delivered`);
    return response.data;
  },

  closePurchaseRequest: async (id: string): Promise<PurchaseRequest> => {
    const response = await apiClient.post<PurchaseRequest>(`/procurement/requests/${id}/close`);
    return response.data;
  },

  cancelPurchaseRequest: async (id: string): Promise<PurchaseRequest> => {
    const response = await apiClient.post<PurchaseRequest>(`/procurement/requests/${id}/cancel`);
    return response.data;
  },

  mergePurchaseRequests: async (data: {
    requestIds: string[];
    title: string;
    comment?: string;
  }): Promise<PurchaseRequest> => {
    const response = await apiClient.post<PurchaseRequest>('/procurement/requests/merge', data);
    return response.data;
  },

  getPurchaseOrders: async (params?: PurchaseOrderFilters): Promise<PaginatedResponse<PurchaseOrder>> => {
    const response = await apiClient.get<PaginatedResponse<PurchaseOrder>>('/procurement/purchase-orders', { params });
    return response.data;
  },

  getPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.get<PurchaseOrder>(`/procurement/purchase-orders/${id}`);
    return response.data;
  },

  getPurchaseOrderItems: async (id: string): Promise<PurchaseOrderItem[]> => {
    const response = await apiClient.get<PurchaseOrderItem[]>(`/procurement/purchase-orders/${id}/items`);
    return response.data;
  },

  createPurchaseOrder: async (data: PurchaseOrderPayload): Promise<PurchaseOrder> => {
    const response = await apiClient.post<PurchaseOrder>('/procurement/purchase-orders', data);
    return response.data;
  },

  createPurchaseOrderWithItems: async (data: PurchaseOrderWithItemsPayload): Promise<PurchaseOrder> => {
    const response = await apiClient.post<PurchaseOrder>('/procurement/purchase-orders/with-items', data);
    return response.data;
  },

  updatePurchaseOrder: async (id: string, data: Partial<PurchaseOrderPayload>): Promise<PurchaseOrder> => {
    const response = await apiClient.put<PurchaseOrder>(`/procurement/purchase-orders/${id}`, data);
    return response.data;
  },

  addPurchaseOrderItem: async (id: string, data: PurchaseOrderItemPayload): Promise<PurchaseOrderItem> => {
    const response = await apiClient.post<PurchaseOrderItem>(`/procurement/purchase-orders/${id}/items`, data);
    return response.data;
  },

  updatePurchaseOrderItem: async (
    id: string,
    itemId: string,
    data: Partial<PurchaseOrderItemPayload>,
  ): Promise<PurchaseOrderItem> => {
    const response = await apiClient.put<PurchaseOrderItem>(
      `/procurement/purchase-orders/${id}/items/${itemId}`,
      data,
    );
    return response.data;
  },

  deletePurchaseOrderItem: async (id: string, itemId: string): Promise<void> => {
    await apiClient.delete(`/procurement/purchase-orders/${id}/items/${itemId}`);
  },

  deletePurchaseOrder: async (id: string): Promise<void> => {
    await apiClient.delete(`/procurement/purchase-orders/${id}`);
  },

  registerPurchaseOrderDelivery: async (
    id: string,
    data: { itemId: string; deliveredQuantity: number },
  ): Promise<PurchaseOrder> => {
    const response = await apiClient.post<PurchaseOrder>(
      `/procurement/purchase-orders/${id}/delivery`,
      null,
      { params: data },
    );
    return response.data;
  },

  sendPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post<PurchaseOrder>(`/procurement/purchase-orders/${id}/send`);
    return response.data;
  },

  confirmPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post<PurchaseOrder>(`/procurement/purchase-orders/${id}/confirm`);
    return response.data;
  },

  cancelPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post<PurchaseOrder>(`/procurement/purchase-orders/${id}/cancel`);
    return response.data;
  },

  closePurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post<PurchaseOrder>(`/procurement/purchase-orders/${id}/close`);
    return response.data;
  },

  invoicePurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post<PurchaseOrder>(`/procurement/purchase-orders/${id}/invoice`);
    return response.data;
  },

  bulkTransitionPurchaseOrders: async (
    data: PurchaseOrderBulkTransitionPayload,
  ): Promise<PurchaseOrderBulkTransitionResult> => {
    const response = await apiClient.post<PurchaseOrderBulkTransitionResult>(
      '/procurement/purchase-orders/bulk-transition',
      data,
    );
    return response.data;
  },
};
