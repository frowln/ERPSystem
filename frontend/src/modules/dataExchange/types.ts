// Data Exchange types

export type ImportEntityType = 'PROJECTS' | 'CONTRACTS' | 'MATERIALS' | 'EMPLOYEES' | 'DOCUMENTS' | 'WBS' | 'BUDGET_ITEMS' | 'INVOICES';
export type ExportFormat = 'CSV' | 'XLSX' | 'PDF' | 'JSON';
export type ImportStatus = 'PENDING' | 'VALIDATING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PARTIALLY_COMPLETED';

export interface ImportJob {
  id: string;
  entityType: ImportEntityType;
  fileName: string;
  fileSize: number;
  status: ImportStatus;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
  startedAt: string;
  completedAt?: string;
  uploadedByName: string;
}

export interface ImportError {
  row: number;
  column: string;
  value: string;
  message: string;
}

export interface FieldMapping {
  sourceColumn: string;
  targetField: string;
  isRequired: boolean;
  transformation?: string;
}

export interface ExportJob {
  id: string;
  entityType: ImportEntityType;
  format: ExportFormat;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  fileName?: string;
  fileSize?: number;
  totalRecords: number;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
}

// 1C Integration

export type OneCExchangeStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
export type OneCExchangeDirection = 'import' | 'export' | 'bidirectional';
export type OneCEntityType = 'CONTRACTS' | 'INVOICES' | 'PAYMENTS' | 'MATERIALS' | 'EMPLOYEES' | 'COST_ITEMS' | 'ORGANIZATIONS';

export interface OneCConfig {
  id: string;
  name: string;
  serverUrl: string;
  databaseName: string;
  username: string;
  isActive: boolean;
  exchangeDirection: OneCExchangeDirection;
  syncInterval: number;
  lastSyncAt?: string;
  entityTypes: OneCEntityType[];
  autoSync: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OneCExchangeLog {
  id: string;
  configId: string;
  configName: string;
  direction: OneCExchangeDirection;
  entityType: OneCEntityType;
  status: OneCExchangeStatus;
  totalRecords: number;
  processedRecords: number;
  errorCount: number;
  errors: string[];
  startedAt: string;
  completedAt?: string;
  duration?: number;
  triggeredByName: string;
  notes?: string;
}

export interface OneCMapping {
  id: string;
  configId: string;
  entityType: OneCEntityType;
  oneCField: string;
  systemField: string;
  transformRule?: string;
  isRequired: boolean;
  defaultValue?: string;
  isActive: boolean;
}
