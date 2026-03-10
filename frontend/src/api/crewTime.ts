import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { CrewTimeEntry, CrewTimeSheet, CrewTimeSheetStatus } from '@/modules/hr/types';

export interface CrewTimeSheetFilters extends PaginationParams {
  status?: CrewTimeSheetStatus;
  crewId?: string;
  projectId?: string;
  search?: string;
}

export interface CrewTimeEntryFilters extends PaginationParams {
  crewId?: string;
  crewTimeSheetId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

const EMPTY_PAGE: PaginatedResponse<any> = { content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 };

export const crewTimeApi = {
  getTimeSheets: async (params?: CrewTimeSheetFilters): Promise<PaginatedResponse<CrewTimeSheet>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<CrewTimeSheet>>('/hr/crew-timesheets', { params });
      return response.data;
    } catch {
      const stored = localStorage.getItem('hr_crew_timesheets');
      if (stored) {
        const items: CrewTimeSheet[] = JSON.parse(stored);
        return { ...EMPTY_PAGE, content: items, totalElements: items.length, totalPages: 1 };
      }
      return EMPTY_PAGE as PaginatedResponse<CrewTimeSheet>;
    }
  },

  getTimeSheet: async (id: string): Promise<CrewTimeSheet> => {
    try {
      const response = await apiClient.get<CrewTimeSheet>(`/hr/crew-timesheets/${id}`);
      return response.data;
    } catch {
      const stored = localStorage.getItem('hr_crew_timesheets');
      if (stored) {
        const items: CrewTimeSheet[] = JSON.parse(stored);
        const found = items.find((ts) => ts.id === id);
        if (found) return found;
      }
      throw new Error('CrewTimeSheet not found');
    }
  },

  submitTimeSheet: async (id: string): Promise<CrewTimeSheet> => {
    try {
      const response = await apiClient.patch<CrewTimeSheet>(`/hr/crew-timesheets/${id}/submit`);
      return response.data;
    } catch {
      return { id } as CrewTimeSheet;
    }
  },

  approveTimeSheet: async (id: string): Promise<CrewTimeSheet> => {
    try {
      const response = await apiClient.patch<CrewTimeSheet>(`/hr/crew-timesheets/${id}/approve`);
      return response.data;
    } catch {
      return { id } as CrewTimeSheet;
    }
  },

  rejectTimeSheet: async (id: string, reason: string): Promise<CrewTimeSheet> => {
    try {
      const response = await apiClient.patch<CrewTimeSheet>(`/hr/crew-timesheets/${id}/reject`, { reason });
      return response.data;
    } catch {
      return { id } as CrewTimeSheet;
    }
  },

  getTimeEntries: async (params?: CrewTimeEntryFilters): Promise<PaginatedResponse<CrewTimeEntry>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<CrewTimeEntry>>('/hr/crew-time-entries', { params });
      return response.data;
    } catch {
      const stored = localStorage.getItem('hr_crew_time_entries');
      if (stored) {
        const items: CrewTimeEntry[] = JSON.parse(stored);
        return { ...EMPTY_PAGE, content: items, totalElements: items.length, totalPages: 1 };
      }
      return EMPTY_PAGE as PaginatedResponse<CrewTimeEntry>;
    }
  },

  getTimeEntry: async (id: string): Promise<CrewTimeEntry> => {
    try {
      const response = await apiClient.get<CrewTimeEntry>(`/hr/crew-time-entries/${id}`);
      return response.data;
    } catch {
      const stored = localStorage.getItem('hr_crew_time_entries');
      if (stored) {
        const items: CrewTimeEntry[] = JSON.parse(stored);
        const found = items.find((e) => e.id === id);
        if (found) return found;
      }
      throw new Error('CrewTimeEntry not found');
    }
  },

  createTimeEntry: async (data: Partial<CrewTimeEntry>): Promise<CrewTimeEntry> => {
    try {
      const response = await apiClient.post<CrewTimeEntry>('/hr/crew-time-entries', data);
      return response.data;
    } catch {
      const entry = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() } as CrewTimeEntry;
      const stored = localStorage.getItem('hr_crew_time_entries');
      const items: CrewTimeEntry[] = stored ? JSON.parse(stored) : [];
      items.push(entry);
      localStorage.setItem('hr_crew_time_entries', JSON.stringify(items));
      return entry;
    }
  },
};
