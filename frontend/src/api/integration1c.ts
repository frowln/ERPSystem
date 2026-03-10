// =============================================================================
// 1C Integration Module -- API Client
// =============================================================================

import { apiClient } from './client';
import type {
  BankStatementImportResult,
  ImportRecord,
  ExportRecord,
  SyncResult,
  ContractorSyncStatus,
  NomenclatureSyncStatus,
  OneCConnectionStatus,
  Ks2Act,
  Ks3Certificate,
  PaymentOrder,
  SyncConflict,
  ActivityRecord,
  NomenclatureMapping,
  SyncDirection,
  ConflictResolution,
  SyncProgress,
  SyncErrorLog,
  PricingDatabase,
  PriceRate,
  PriceIndex,
  CsvImportResult,
} from '@/modules/integration1c/types';

export const integration1cApi = {
  // KS-2 / KS-3 export
  getKs2Acts: async (): Promise<Ks2Act[]> => {
    const response = await apiClient.get('/integration-1c/ks2/acts');
    return response.data;
  },

  getKs3Certificates: async (): Promise<Ks3Certificate[]> => {
    const response = await apiClient.get('/integration-1c/ks3/certificates');
    return response.data;
  },

  exportKs2: async (actIds: string[], format: string): Promise<Blob> => {
    const response = await apiClient.post(
      '/integration-1c/ks2/export',
      { actIds, format },
      { responseType: 'blob' },
    );
    return response.data;
  },

  exportKs3: async (certificateIds: string[], format: string): Promise<Blob> => {
    const response = await apiClient.post(
      '/integration-1c/ks3/export',
      { certificateIds, format },
      { responseType: 'blob' },
    );
    return response.data;
  },

  // Payment export
  getPaymentOrders: async (): Promise<PaymentOrder[]> => {
    const response = await apiClient.get('/integration-1c/payments/orders');
    return response.data;
  },

  exportPaymentOrders: async (paymentIds: string[], format: string): Promise<Blob> => {
    const response = await apiClient.post(
      '/integration-1c/payments/export',
      { paymentIds, format },
      { responseType: 'blob' },
    );
    return response.data;
  },

  // Bank statement import
  importBankStatement: async (file: File): Promise<BankStatementImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/integration-1c/bank-statement/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // History
  getImportHistory: async (): Promise<ImportRecord[]> => {
    const response = await apiClient.get('/integration-1c/history/imports');
    return response.data;
  },

  getExportHistory: async (): Promise<ExportRecord[]> => {
    const response = await apiClient.get('/integration-1c/history/exports');
    return response.data;
  },

  // Contractor & Nomenclature sync
  syncContractors: async (): Promise<SyncResult> => {
    const response = await apiClient.post('/integration-1c/sync/contractors');
    return response.data;
  },

  getContractorSyncStatus: async (): Promise<ContractorSyncStatus> => {
    const response = await apiClient.get('/integration-1c/sync/contractors/status');
    return response.data;
  },

  getContractorConflicts: async (): Promise<SyncConflict[]> => {
    const response = await apiClient.get('/integration-1c/sync/contractors/conflicts');
    return response.data;
  },

  syncNomenclature: async (): Promise<SyncResult> => {
    const response = await apiClient.post('/integration-1c/sync/nomenclature');
    return response.data;
  },

  getNomenclatureSyncStatus: async (): Promise<NomenclatureSyncStatus> => {
    const response = await apiClient.get('/integration-1c/sync/nomenclature/status');
    return response.data;
  },

  getNomenclatureConflicts: async (): Promise<SyncConflict[]> => {
    const response = await apiClient.get('/integration-1c/sync/nomenclature/conflicts');
    return response.data;
  },

  // Connection
  getConnectionStatus: async (): Promise<OneCConnectionStatus> => {
    const response = await apiClient.get('/integration-1c/connection/status');
    return response.data;
  },

  testConnection: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/integration-1c/connection/test');
    return response.data;
  },

  // Activity feed
  getRecentActivity: async (limit: number = 10): Promise<ActivityRecord[]> => {
    const response = await apiClient.get('/integration-1c/activity/recent', {
      params: { limit },
    });
    return response.data;
  },

  // --- Nomenclature Sync (extended) ---
  getNomenclatureGroups: async (): Promise<{ id: string; name: string; code?: string }[]> => {
    const response = await apiClient.get('/integration-1c/nomenclature/groups');
    return response.data;
  },

  getNomenclatureMappings: async (params?: { groupId?: string; status?: string }): Promise<NomenclatureMapping[]> => {
    const response = await apiClient.get<NomenclatureMapping[]>('/integration-1c/nomenclature/mappings', { params });
    return response.data;
  },

  autoMatchNomenclature: async (): Promise<{ matched: number; unmatched: number; total?: number }> => {
    const response = await apiClient.post('/integration-1c/nomenclature/auto-match');
    return response.data;
  },

  syncNomenclatureWithDirection: async (direction: SyncDirection, options?: { group?: string }): Promise<SyncResult> => {
    const response = await apiClient.post<SyncResult>('/integration-1c/sync/nomenclature', { direction, ...options });
    return response.data;
  },

  getSyncProgress: async (type?: string): Promise<SyncProgress> => {
    const response = await apiClient.get<SyncProgress>('/integration-1c/sync/progress', { params: type ? { type } : undefined });
    return response.data;
  },

  getSyncErrors: async (type?: string): Promise<SyncErrorLog[]> => {
    const response = await apiClient.get<SyncErrorLog[]>('/integration-1c/sync/errors', { params: type ? { type } : undefined });
    return response.data;
  },

  resolveConflict: async (conflictId: string, resolution: ConflictResolution): Promise<void> => {
    await apiClient.post(`/integration-1c/sync/conflicts/${conflictId}/resolve`, { resolution });
  },

  retrySyncError: async (errorId: string): Promise<void> => {
    await apiClient.post(`/integration-1c/sync/errors/${errorId}/retry`);
  },

  // --- Pricing Database ---
  getPricingDatabases: async (): Promise<PricingDatabase[]> => {
    const response = await apiClient.get<PricingDatabase[]>('/integration-1c/pricing/databases');
    return response.data;
  },

  getAvailableRegions: async (): Promise<{ code: string; name: string }[]> => {
    const response = await apiClient.get('/integration-1c/pricing/regions');
    return response.data;
  },

  getMinstroyIndices: async (params?: { region?: string; year?: number; quarter?: number }): Promise<PriceIndex[]> => {
    const response = await apiClient.get<PriceIndex[]>('/integration-1c/pricing/minstroy-indices', { params });
    return response.data;
  },

  searchRates: async (params: { query?: string; databaseId?: string; source?: string; category?: string; page?: number; size?: number }): Promise<PriceRate[]> => {
    const response = await apiClient.get<PriceRate[]>('/integration-1c/pricing/rates/search', { params });
    return response.data;
  },

  importCsvCoefficients: async (file: File, databaseId?: string): Promise<CsvImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    if (databaseId) formData.append('databaseId', databaseId);
    const response = await apiClient.post<CsvImportResult>('/integration-1c/pricing/import-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
