import { apiClient } from './client';
import type {
  Material,
  StockEntry,
  StockMovement,
  PaginatedResponse,
  PaginationParams,
} from '@/types';
import type {
  WarehouseLocation,
  InventoryCheck,
  InventoryItem,
  TurnoverReportParams,
  TurnoverReportEntry,
  M29Report,
  LimitFenceCard,
  WarehouseOrderAdvanced,
  StorageLayout,
  StorageCell,
  MaterialDemand,
  PendingConfirmation,
  InterProjectTransfer,
  InterProjectTransferStatus,
} from '@/modules/warehouse/types';

export interface MaterialFilters extends PaginationParams {
  category?: string;
  search?: string;
}

export interface MaterialDetail {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  totalStock: number;
  minStock: number;
  maxStock: number;
  avgPrice: number;
  projectName: string;
  lastReceiptDate: string;
  createdAt: string;
}

export interface StockByLocation {
  locationId: string;
  locationName: string;
  quantity: number;
  reserved: number;
  available: number;
}

export interface RecentMovement {
  id: string;
  type: string;
  quantity: number;
  date: string;
  fromLocation: string;
  toLocation: string;
  responsibleName: string;
}

export interface MovementDetail {
  id: string;
  number: string;
  type: string;
  status: string;
  materialId: string;
  materialName: string;
  materialSku: string;
  quantity: number;
  unit: string;
  fromLocationId: string;
  fromLocationName: string;
  toLocationId: string;
  toLocationName: string;
  responsibleId: string;
  responsibleName: string;
  approvedByName: string | null;
  date: string;
  note: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ks2Act {
  id: string;
  number: string;
  period: string;
  contractor: string;
  amount: number;
}

export interface M29MaterialLine {
  id: string;
  name: string;
  unit: string;
  normQty: number;
  actualQty: number;
}

export interface CreateLimitFenceCardRequest {
  projectId: string;
  materialName: string;
  unit: string;
  limitQty: number;
  periodFrom: string;
  periodTo: string;
}

export interface CreateWarehouseOrderAdvancedRequest {
  type: 'incoming' | 'outgoing' | 'transfer' | 'write_off';
  date: string;
  warehouseName: string;
  counterparty: string;
  items: { materialName: string; qty: number; unit: string; price: number }[];
}

export const warehouseApi = {
  getMaterials: async (params?: MaterialFilters): Promise<PaginatedResponse<Material>> => {
    const response = await apiClient.get<PaginatedResponse<Material>>('/warehouse/materials', { params });
    return response.data;
  },

  getMaterial: async (id: string): Promise<MaterialDetail> => {
    const response = await apiClient.get<MaterialDetail>(`/warehouse/materials/${id}`);
    return response.data;
  },

  getMaterialStock: async (materialId: string): Promise<StockByLocation[]> => {
    const response = await apiClient.get<StockByLocation[]>(`/warehouse/materials/${materialId}/stock`);
    return response.data;
  },

  getMaterialMovements: async (materialId: string): Promise<RecentMovement[]> => {
    const response = await apiClient.get<RecentMovement[]>(`/warehouse/materials/${materialId}/movements`);
    return response.data;
  },

  deleteMaterial: async (id: string): Promise<void> => {
    await apiClient.delete(`/warehouse/materials/${id}`);
  },

  getStock: async (params?: PaginationParams): Promise<PaginatedResponse<StockEntry>> => {
    const response = await apiClient.get<PaginatedResponse<StockEntry>>('/warehouse/stock', { params });
    return response.data;
  },

  getMovements: async (params?: PaginationParams): Promise<PaginatedResponse<StockMovement>> => {
    const response = await apiClient.get<PaginatedResponse<StockMovement>>('/warehouse/movements', { params });
    return response.data;
  },

  getMovement: async (id: string): Promise<MovementDetail> => {
    const response = await apiClient.get<MovementDetail>(`/warehouse/movements/${id}`);
    return response.data;
  },

  updateMovementStatus: async (id: string, status: string): Promise<MovementDetail> => {
    const response = await apiClient.patch<MovementDetail>(`/warehouse/movements/${id}/status`, { status });
    return response.data;
  },

  deleteMovement: async (id: string): Promise<void> => {
    await apiClient.delete(`/warehouse/movements/${id}`);
  },

  createMaterial: async (data: Partial<Material>): Promise<Material> => {
    const response = await apiClient.post<Material>('/warehouse/materials', data);
    return response.data;
  },

  createMovement: async (data: Partial<StockMovement>): Promise<StockMovement> => {
    const response = await apiClient.post<StockMovement>('/warehouse/movements', data);
    return response.data;
  },

  // Locations
  getLocations: async (params?: PaginationParams): Promise<PaginatedResponse<WarehouseLocation>> => {
    const response = await apiClient.get<PaginatedResponse<WarehouseLocation>>('/warehouse/locations', { params });
    return response.data;
  },

  // Inventory checks
  getInventoryChecks: async (params?: PaginationParams): Promise<PaginatedResponse<InventoryCheck>> => {
    const response = await apiClient.get<PaginatedResponse<InventoryCheck>>('/warehouse/inventory-checks', { params });
    return response.data;
  },

  getInventoryCheckItems: async (checkId: string): Promise<InventoryItem[]> => {
    const response = await apiClient.get<InventoryItem[]>(`/warehouse/inventory-checks/${checkId}/items`);
    return response.data;
  },

  createInventoryCheck: async (data: Partial<InventoryCheck>): Promise<InventoryCheck> => {
    const response = await apiClient.post<InventoryCheck>('/warehouse/inventory-checks', data);
    return response.data;
  },

  // Turnover report
  getTurnoverReport: async (params: TurnoverReportParams): Promise<TurnoverReportEntry[]> => {
    const response = await apiClient.get<TurnoverReportEntry[]>('/warehouse/reports/turnover', { params });
    return response.data;
  },

  exportTurnoverReport: async (params: TurnoverReportParams & { format: string }): Promise<Blob> => {
    const response = await apiClient.get('/warehouse/reports/turnover/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // M-29 from KS-2
  getKs2Acts: async (): Promise<Ks2Act[]> => {
    const response = await apiClient.get<Ks2Act[]>('/warehouse/ks2-acts');
    return response.data;
  },

  getM29Materials: async (actIds: string[]): Promise<M29MaterialLine[]> => {
    const response = await apiClient.post<M29MaterialLine[]>('/warehouse/m29/materials', { actIds });
    return response.data;
  },

  generateM29: async (data: { actIds: string[]; quantities: Record<string, number> }): Promise<Blob> => {
    const response = await apiClient.post('/warehouse/m29/generate', data, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Movement board
  getMovementBoard: async (): Promise<StockMovement[]> => {
    const response = await apiClient.get<StockMovement[]>('/warehouse/movements/board');
    return response.data;
  },

  // Inter-site transfers
  createInterSiteTransfer: async (data: {
    movementDate?: string;
    sourceLocationId: string;
    destinationLocationId: string;
    sourceProjectId?: string;
    destinationProjectId?: string;
    responsibleId?: string;
    notes?: string;
    lines: { materialId: string; quantity: number }[];
  }): Promise<StockMovement> => {
    const response = await apiClient.post<StockMovement>('/warehouse/movements/inter-site-transfer', data);
    return response.data;
  },

  // Barcode lookup
  lookupMaterialByBarcode: async (barcode: string): Promise<Material> => {
    const response = await apiClient.get<Material>('/warehouse/materials/barcode-lookup', {
      params: { barcode },
    });
    return response.data;
  },

  // M-29 Report
  getM29Report: async (projectId: string, month: number, year: number): Promise<M29Report> => {
    const response = await apiClient.get<M29Report>('/warehouse/reports/m29', {
      params: { projectId, month, year },
    });
    return response.data;
  },

  // Limit Fence Cards
  getLimitFenceCards: async (params?: PaginationParams): Promise<PaginatedResponse<LimitFenceCard>> => {
    const response = await apiClient.get<PaginatedResponse<LimitFenceCard>>('/warehouse/limit-fence-cards', { params });
    return response.data;
  },

  getLimitFenceCard: async (id: string): Promise<LimitFenceCard> => {
    const response = await apiClient.get<LimitFenceCard>(`/warehouse/limit-fence-cards/${id}`);
    return response.data;
  },

  createLimitFenceCard: async (data: CreateLimitFenceCardRequest): Promise<LimitFenceCard> => {
    const response = await apiClient.post<LimitFenceCard>('/warehouse/limit-fence-cards', data);
    return response.data;
  },

  // Warehouse Orders (advanced)
  getWarehouseOrders: async (params?: PaginationParams): Promise<PaginatedResponse<WarehouseOrderAdvanced>> => {
    const response = await apiClient.get<PaginatedResponse<WarehouseOrderAdvanced>>('/warehouse/orders-advanced', { params });
    return response.data;
  },

  getWarehouseOrder: async (id: string): Promise<WarehouseOrderAdvanced> => {
    const response = await apiClient.get<WarehouseOrderAdvanced>(`/warehouse/orders-advanced/${id}`);
    return response.data;
  },

  createWarehouseOrder: async (data: CreateWarehouseOrderAdvancedRequest): Promise<WarehouseOrderAdvanced> => {
    const response = await apiClient.post<WarehouseOrderAdvanced>('/warehouse/orders-advanced', data);
    return response.data;
  },

  // Address Storage
  getStorageLayout: async (warehouseId?: string): Promise<StorageLayout> => {
    const response = await apiClient.get<StorageLayout>('/warehouse/storage/layout', {
      params: warehouseId ? { warehouseId } : undefined,
    });
    return response.data;
  },

  getCellContents: async (cellId: string): Promise<StorageCell> => {
    const response = await apiClient.get<StorageCell>(`/warehouse/storage/cells/${cellId}`);
    return response.data;
  },

  // Material Demand
  calculateDemand: async (projectId: string): Promise<MaterialDemand[]> => {
    const response = await apiClient.get<MaterialDemand[]>('/warehouse/demand/calculate', {
      params: { projectId },
    });
    return response.data;
  },

  // --- Pending Confirmations ---
  getPendingConfirmations: async (): Promise<PendingConfirmation[]> => {
    const response = await apiClient.get<PendingConfirmation[]>('/warehouse/movements/pending-confirmations');
    return response.data;
  },

  confirmMovement: async (id: string): Promise<void> => {
    await apiClient.post(`/warehouse/movements/${id}/confirm`);
  },

  rejectMovement: async (id: string, reason?: string): Promise<void> => {
    await apiClient.post(`/warehouse/movements/${id}/reject`, { reason });
  },

  batchConfirmMovements: async (ids: string[]): Promise<void> => {
    await apiClient.post('/warehouse/movements/batch-confirm', { ids });
  },

  // --- Inter-Project Transfers ---
  getInterProjectTransfers: async (params?: PaginationParams): Promise<PaginatedResponse<InterProjectTransfer>> => {
    const response = await apiClient.get<PaginatedResponse<InterProjectTransfer>>('/warehouse/inter-project-transfers', { params });
    return response.data;
  },

  createInterProjectTransfer: async (data: Partial<InterProjectTransfer>): Promise<InterProjectTransfer> => {
    const response = await apiClient.post<InterProjectTransfer>('/warehouse/inter-project-transfers', data);
    return response.data;
  },

  updateInterProjectTransferStatus: async (id: string, status: InterProjectTransferStatus): Promise<InterProjectTransfer> => {
    const response = await apiClient.patch<InterProjectTransfer>(`/warehouse/inter-project-transfers/${id}/status`, { status });
    return response.data;
  },
};
