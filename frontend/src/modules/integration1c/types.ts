// =============================================================================
// 1C Integration Module -- Types
// =============================================================================

export interface BankStatementImportResult {
  totalTransactions: number;
  matched: number;
  unmatched: number;
  errors: string[];
}

export interface ImportRecord {
  id: string;
  fileName: string;
  importDate: string;
  type: string;
  recordsCount: number;
  status: 'success' | 'partial' | 'failed';
}

export interface ExportRecord {
  id: string;
  fileName: string;
  exportDate: string;
  type: string;
  recordsCount: number;
  format: string;
  status: 'success' | 'failed';
}

export interface SyncResult {
  synced: number;
  created: number;
  updated: number;
  errors: string[];
}

export interface ContractorSyncStatus {
  lastSync: string;
  totalInPrivod: number;
  totalIn1c: number;
  synced: number;
  conflicts: number;
}

export interface NomenclatureSyncStatus {
  lastSync: string;
  totalInPrivod: number;
  totalIn1c: number;
  synced: number;
  conflicts: number;
}

export interface OneCConnectionStatus {
  connected: boolean;
  version: string;
  lastCheck: string;
  database: string;
}

export interface Ks2Act {
  id: string;
  number: string;
  date: string;
  contractor: string;
  amount: number;
  project: string;
  status: string;
}

export interface Ks3Certificate {
  id: string;
  number: string;
  date: string;
  contractor: string;
  amount: number;
  project: string;
  status: string;
}

export interface PaymentOrder {
  id: string;
  number: string;
  date: string;
  payee: string;
  amount: number;
  purpose: string;
  status: string;
}

export interface SyncConflict {
  id: string;
  entityType: string;
  privodName: string;
  oneCName: string;
  field: string;
  privodValue: string;
  oneCValue: string;
  detectedAt: string;
}

export interface ActivityRecord {
  id: string;
  type: 'import' | 'export' | 'sync';
  description: string;
  status: 'success' | 'partial' | 'failed';
  recordsCount: number;
  timestamp: string;
}

// --- Nomenclature Sync ---

export type SyncDirection = 'PRIVOD_TO_1C' | '1C_TO_PRIVOD' | 'BOTH' | 'from_1c' | 'to_1c' | 'bidirectional';

export type ConflictResolution = 'PRIVOD_WINS' | '1C_WINS' | 'MANUAL' | 'use_privod' | 'use_1c';

export interface NomenclatureMapping {
  id: string;
  privodName: string;
  privodCode?: string;
  privodArticle?: string;
  privodGroup?: string;
  oneCName: string;
  oneCCode?: string;
  oneCArticle?: string;
  oneCGroup?: string;
  groupName?: string;
  status: 'MAPPED' | 'UNMAPPED' | 'CONFLICT';
  syncStatus?: string;
  autoMatched?: boolean;
  lastSyncAt?: string;
}

export interface SyncProgress {
  total: number;
  processed: number;
  errors: number;
  created?: number;
  updated?: number;
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'running' | 'completed' | 'failed' | 'idle';
  startedAt?: string;
  completedAt?: string;
}

export interface SyncErrorLog {
  id: string;
  entityType: string;
  entityName: string;
  errorMessage: string;
  timestamp: string;
  resolved: boolean;
  retryable?: boolean;
}

// --- Pricing Database ---

export type PricingDatabaseType = 'GESN' | 'FER' | 'TER' | 'CUSTOM' | 'LOCAL';

export interface PricingDatabase {
  id: string;
  name: string;
  type: PricingDatabaseType;
  region?: string;
  version?: string;
  rateCount: number;
  lastUpdated: string;
  isActive: boolean;
  active?: boolean;
  baseYear?: number;
  coefficientToCurrentPrices?: number;
  effectiveFrom?: string;
}

export interface PriceRate {
  id: string;
  code: string;
  name: string;
  unit: string;
  basePrice: number;
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  overheadCost?: number;
  totalCost?: number;
  category?: string;
  source: PricingDatabaseType;
}

export interface PriceIndex {
  id: string;
  region: string;
  quarter: number;
  year: number;
  workType: string;
  indexValue: number;
  source: string;
  baseQuarter?: string;
  targetQuarter?: string;
  updatedAt?: string;
}

export interface CsvImportResult {
  imported: number;
  skipped: number;
  totalRows?: number;
  errors: string[];
}
