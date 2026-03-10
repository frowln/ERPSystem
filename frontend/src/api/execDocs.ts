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

// ---------------------------------------------------------------------------
// localStorage keys
// ---------------------------------------------------------------------------
const STORAGE_AOSR = 'privod_exec_docs_aosr';
const STORAGE_KS6 = 'privod_exec_docs_ks6';
const STORAGE_INCOMING = 'privod_exec_docs_incoming_control';
const STORAGE_WELDING = 'privod_exec_docs_welding';
const STORAGE_SPECIAL = 'privod_exec_docs_special_journals';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function readStore<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as T[];
  } catch {
    return [];
  }
}

function writeStore<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

// ---------------------------------------------------------------------------
// Filter interfaces
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// API with localStorage fallbacks
// ---------------------------------------------------------------------------
export const execDocsApi = {
  // ---------------------------------------------------------------------------
  // AOSR
  // ---------------------------------------------------------------------------

  getAosrList: async (params?: AosrFilters): Promise<PaginatedResponse<AosrRecord>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<AosrRecord>>('/exec-docs/aosr', {
        params,
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore<AosrRecord>(STORAGE_AOSR);
      return { content: stored, totalElements: stored.length, totalPages: 1, page: 0, size: 20 };
    }
  },

  createAosr: async (data: CreateAosrRequest): Promise<AosrRecord> => {
    try {
      const response = await apiClient.post<AosrRecord>('/exec-docs/aosr', data, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore<AosrRecord>(STORAGE_AOSR);
      const newItem: AosrRecord = {
        ...data,
        id: crypto.randomUUID(),
        number: `AOSR-${(stored.length + 1).toString().padStart(4, '0')}`,
        status: 'draft',
        projectName: '',
        createdAt: new Date().toISOString(),
      };
      stored.push(newItem);
      writeStore(STORAGE_AOSR, stored);
      return newItem;
    }
  },

  getAosr: async (id: string): Promise<AosrRecord> => {
    try {
      const response = await apiClient.get<AosrRecord>(`/exec-docs/aosr/${id}`, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore<AosrRecord>(STORAGE_AOSR);
      const found = stored.find((r) => r.id === id);
      if (found) return found;
      throw new Error(`AOSR record ${id} not found`);
    }
  },

  // ---------------------------------------------------------------------------
  // KS-6 General Journal
  // ---------------------------------------------------------------------------

  getKs6Entries: async (projectId: string, year: number): Promise<Ks6Entry[]> => {
    try {
      const response = await apiClient.get<Ks6Entry[]>('/exec-docs/ks6', {
        params: { projectId, year },
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore<Ks6Entry>(STORAGE_KS6);
      return stored.filter(
        (e) => e.projectId === projectId && new Date(e.date).getFullYear() === year,
      );
    }
  },

  createKs6Entry: async (data: CreateKs6EntryRequest): Promise<Ks6Entry> => {
    try {
      const response = await apiClient.post<Ks6Entry>('/exec-docs/ks6', data, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore<Ks6Entry>(STORAGE_KS6);
      const newItem: Ks6Entry = {
        ...data,
        id: crypto.randomUUID(),
      };
      stored.push(newItem);
      writeStore(STORAGE_KS6, stored);
      return newItem;
    }
  },

  // ---------------------------------------------------------------------------
  // Incoming Control
  // ---------------------------------------------------------------------------

  getIncomingControlEntries: async (params?: IncomingControlFilters): Promise<IncomingControlEntry[]> => {
    try {
      const response = await apiClient.get<IncomingControlEntry[]>('/exec-docs/incoming-control', {
        params,
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore<IncomingControlEntry>(STORAGE_INCOMING);
      let filtered = stored;
      if (params?.result) {
        filtered = filtered.filter((e) => e.result === params.result);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.materialName.toLowerCase().includes(q) || e.supplier.toLowerCase().includes(q),
        );
      }
      return filtered;
    }
  },

  createIncomingControlEntry: async (data: CreateIncomingControlRequest): Promise<IncomingControlEntry> => {
    try {
      const response = await apiClient.post<IncomingControlEntry>('/exec-docs/incoming-control', data, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore<IncomingControlEntry>(STORAGE_INCOMING);
      const newItem: IncomingControlEntry = {
        ...data,
        id: crypto.randomUUID(),
      };
      stored.push(newItem);
      writeStore(STORAGE_INCOMING, stored);
      return newItem;
    }
  },

  // ---------------------------------------------------------------------------
  // Welding Journal
  // ---------------------------------------------------------------------------

  getWeldingJournalEntries: async (projectId: string): Promise<WeldingJournalEntry[]> => {
    try {
      const response = await apiClient.get<WeldingJournalEntry[]>('/exec-docs/welding', {
        params: { projectId },
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore<WeldingJournalEntry>(STORAGE_WELDING);
      return stored.filter((e) => e.projectId === projectId);
    }
  },

  createWeldingJournalEntry: async (data: CreateWeldingEntryRequest): Promise<WeldingJournalEntry> => {
    try {
      const response = await apiClient.post<WeldingJournalEntry>('/exec-docs/welding', data, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore<WeldingJournalEntry>(STORAGE_WELDING);
      const newItem: WeldingJournalEntry = {
        ...data,
        id: crypto.randomUUID(),
      };
      stored.push(newItem);
      writeStore(STORAGE_WELDING, stored);
      return newItem;
    }
  },

  // ---------------------------------------------------------------------------
  // Special Journals (Concrete, Installation, Pile)
  // ---------------------------------------------------------------------------

  getSpecialJournalEntries: async (projectId: string, journalType: SpecialJournalType): Promise<SpecialJournalEntry[]> => {
    try {
      const response = await apiClient.get<SpecialJournalEntry[]>('/exec-docs/special-journals', {
        params: { projectId, journalType },
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore<SpecialJournalEntry>(STORAGE_SPECIAL);
      return stored.filter(
        (e) => e.projectId === projectId && e.journalType === journalType,
      );
    }
  },

  createSpecialJournalEntry: async (data: CreateSpecialJournalRequest): Promise<SpecialJournalEntry> => {
    try {
      const response = await apiClient.post<SpecialJournalEntry>('/exec-docs/special-journals', data, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore<SpecialJournalEntry>(STORAGE_SPECIAL);
      const newItem: SpecialJournalEntry = {
        ...data,
        id: crypto.randomUUID(),
      };
      stored.push(newItem);
      writeStore(STORAGE_SPECIAL, stored);
      return newItem;
    }
  },
};
