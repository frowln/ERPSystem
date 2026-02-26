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
};
