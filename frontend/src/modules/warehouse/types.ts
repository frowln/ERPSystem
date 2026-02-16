export type MaterialCategory =
  | 'CONCRETE'
  | 'METAL'
  | 'WOOD'
  | 'INSULATION'
  | 'PIPES'
  | 'ELECTRICAL'
  | 'FINISHING'
  | 'FASTENERS'
  | 'TOOLS'
  | 'OTHER';

export interface Material {
  id: string;
  name: string;
  code: string;
  category: MaterialCategory;
  unitOfMeasure: string;
  currentPrice: number;
  description?: string;
  minStockLevel?: number;
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType = 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN' | 'WRITE_OFF';

export type StockMovementStatus = 'DRAFT' | 'CONFIRMED' | 'DONE' | 'CANCELLED';

export interface StockMovement {
  id: string;
  number: string;
  movementDate: string;
  movementType: StockMovementType;
  status: StockMovementStatus;
  projectId?: string;
  projectName?: string;
  sourceLocation?: string;
  destinationLocation?: string;
  lineCount: number;
  responsibleName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovementLine {
  id: string;
  movementId: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice?: number;
  amount?: number;
}

export interface StockEntry {
  id: string;
  materialId: string;
  materialName: string;
  locationId?: string;
  locationName: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  totalValue: number;
}

export type WarehouseLocationType = 'warehouse' | 'site' | 'zone';

export type WarehouseLocationStatus = 'ACTIVE' | 'INACTIVE' | 'FULL';

export interface WarehouseLocation {
  id: string;
  code: string;
  name: string;
  type: WarehouseLocationType;
  projectId?: string;
  projectName?: string;
  capacity: number;
  currentLoad: number;
  loadPercent: number;
  responsible: string;
  address?: string;
  status: WarehouseLocationStatus;
  materialsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type InventoryCheckStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface InventoryCheck {
  id: string;
  number: string;
  location: string;
  locationId?: string;
  date: string;
  status: InventoryCheckStatus;
  itemsCount: number;
  matchedCount: number;
  shortageCount: number;
  surplusCount: number;
  responsible: string;
  projectName?: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryItemStatus = 'match' | 'shortage' | 'surplus';

export interface InventoryItem {
  id: string;
  inventoryCheckId: string;
  materialId?: string;
  materialName: string;
  unit: string;
  plannedQty: number;
  actualQty: number;
  variance: number;
  status: InventoryItemStatus;
}

export interface TurnoverReportParams {
  locationId: string;
  periodFrom: string;
  periodTo: string;
  materialCategory?: MaterialCategory;
}

export interface TurnoverReportEntry {
  materialId: string;
  materialName: string;
  unitOfMeasure: string;
  openingBalance: number;
  receipts: number;
  issues: number;
  closingBalance: number;
  turnoverValue: number;
}

export interface CreateMovementRequest {
  movementType: StockMovementType;
  movementDate: string;
  projectId?: string;
  sourceLocation?: string;
  destinationLocation?: string;
  lines: Omit<StockMovementLine, 'id' | 'movementId'>[];
  notes?: string;
}

export interface CreateMaterialRequest {
  name: string;
  code: string;
  category: MaterialCategory;
  unitOfMeasure: string;
  currentPrice: number;
  description?: string;
  minStockLevel?: number;
}

// --- Stock Limits ---

export type StockLimitType = 'MIN' | 'MAX' | 'REORDER_POINT' | 'SAFETY_STOCK';

export type StockAlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface StockLimit {
  id: string;
  materialId: string;
  materialName: string;
  locationId?: string;
  locationName: string;
  limitType: StockLimitType;
  limitValue: number;
  currentStock: number;
  unitOfMeasure: string;
  isBreached: boolean;
  projectId?: string;
  projectName?: string;
  createdAt: string;
  updatedAt: string;
}

export type StockAlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface StockLimitAlert {
  id: string;
  stockLimitId: string;
  materialName: string;
  locationName: string;
  limitType: StockLimitType;
  severity: StockAlertSeverity;
  status: StockAlertStatus;
  limitValue: number;
  currentValue: number;
  deviation: number;
  message: string;
  acknowledgedById?: string;
  acknowledgedByName?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  projectId?: string;
  projectName?: string;
  createdAt: string;
  updatedAt: string;
}
