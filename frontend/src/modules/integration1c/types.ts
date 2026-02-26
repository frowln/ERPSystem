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
