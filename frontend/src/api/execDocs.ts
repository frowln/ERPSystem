import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  AosrRecord,
  Ks6Entry,
  IncomingControlEntry,
  WeldingJournalEntry,
  SpecialJournalEntry,
  SpecialJournalType,
  CreateAosrRequest,
  CreateKs6EntryRequest,
  CreateIncomingControlRequest,
  CreateWeldingEntryRequest,
  CreateSpecialJournalRequest,
  IncomingControlResult,
  WeldingResult,
} from '@/modules/execDocs/types';

export interface AosrFilters extends PaginationParams {
  status?: string;
  search?: string;
}

export interface IncomingControlFilters extends PaginationParams {
  result?: IncomingControlResult;
  search?: string;
}

export interface WeldingFilters extends PaginationParams {
  result?: WeldingResult;
  projectId?: string;
}

export const execDocsApi = {
  // ---------------------------------------------------------------------------
  // AOSR
  // ---------------------------------------------------------------------------

  getAosrList: async (params?: AosrFilters): Promise<PaginatedResponse<AosrRecord>> => {
    const response = await apiClient.get<PaginatedResponse<AosrRecord>>('/exec-docs/aosr', { params });
    return response.data;
  },

  createAosr: async (data: CreateAosrRequest): Promise<AosrRecord> => {
    const response = await apiClient.post<AosrRecord>('/exec-docs/aosr', data);
    return response.data;
  },

  getAosr: async (id: string): Promise<AosrRecord> => {
    const response = await apiClient.get<AosrRecord>(`/exec-docs/aosr/${id}`);
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // KS-6 General Journal
  // ---------------------------------------------------------------------------

  getKs6Entries: async (projectId: string, year: number): Promise<Ks6Entry[]> => {
    const response = await apiClient.get<Ks6Entry[]>('/exec-docs/ks6', {
      params: { projectId, year },
    });
    return response.data;
  },

  createKs6Entry: async (data: CreateKs6EntryRequest): Promise<Ks6Entry> => {
    const response = await apiClient.post<Ks6Entry>('/exec-docs/ks6', data);
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Incoming Control
  // ---------------------------------------------------------------------------

  getIncomingControlEntries: async (params?: IncomingControlFilters): Promise<IncomingControlEntry[]> => {
    const response = await apiClient.get<IncomingControlEntry[]>('/exec-docs/incoming-control', { params });
    return response.data;
  },

  createIncomingControlEntry: async (data: CreateIncomingControlRequest): Promise<IncomingControlEntry> => {
    const response = await apiClient.post<IncomingControlEntry>('/exec-docs/incoming-control', data);
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Welding Journal
  // ---------------------------------------------------------------------------

  getWeldingJournalEntries: async (projectId: string): Promise<WeldingJournalEntry[]> => {
    const response = await apiClient.get<WeldingJournalEntry[]>('/exec-docs/welding', {
      params: { projectId },
    });
    return response.data;
  },

  createWeldingJournalEntry: async (data: CreateWeldingEntryRequest): Promise<WeldingJournalEntry> => {
    const response = await apiClient.post<WeldingJournalEntry>('/exec-docs/welding', data);
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Special Journals (Concrete, Installation, Pile)
  // ---------------------------------------------------------------------------

  getSpecialJournalEntries: async (projectId: string, journalType: SpecialJournalType): Promise<SpecialJournalEntry[]> => {
    const response = await apiClient.get<SpecialJournalEntry[]>('/exec-docs/special-journals', {
      params: { projectId, journalType },
    });
    return response.data;
  },

  createSpecialJournalEntry: async (data: CreateSpecialJournalRequest): Promise<SpecialJournalEntry> => {
    const response = await apiClient.post<SpecialJournalEntry>('/exec-docs/special-journals', data);
    return response.data;
  },
};
