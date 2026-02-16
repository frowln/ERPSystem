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

export const crewTimeApi = {
  getTimeSheets: async (params?: CrewTimeSheetFilters): Promise<PaginatedResponse<CrewTimeSheet>> => {
    const response = await apiClient.get<PaginatedResponse<CrewTimeSheet>>('/hr/crew-timesheets', { params });
    return response.data;
  },

  getTimeSheet: async (id: string): Promise<CrewTimeSheet> => {
    const response = await apiClient.get<CrewTimeSheet>(`/hr/crew-timesheets/${id}`);
    return response.data;
  },

  submitTimeSheet: async (id: string): Promise<CrewTimeSheet> => {
    const response = await apiClient.patch<CrewTimeSheet>(`/hr/crew-timesheets/${id}/submit`);
    return response.data;
  },

  approveTimeSheet: async (id: string): Promise<CrewTimeSheet> => {
    const response = await apiClient.patch<CrewTimeSheet>(`/hr/crew-timesheets/${id}/approve`);
    return response.data;
  },

  rejectTimeSheet: async (id: string, reason: string): Promise<CrewTimeSheet> => {
    const response = await apiClient.patch<CrewTimeSheet>(`/hr/crew-timesheets/${id}/reject`, { reason });
    return response.data;
  },

  getTimeEntries: async (params?: CrewTimeEntryFilters): Promise<PaginatedResponse<CrewTimeEntry>> => {
    const response = await apiClient.get<PaginatedResponse<CrewTimeEntry>>('/hr/crew-time-entries', { params });
    return response.data;
  },

  getTimeEntry: async (id: string): Promise<CrewTimeEntry> => {
    const response = await apiClient.get<CrewTimeEntry>(`/hr/crew-time-entries/${id}`);
    return response.data;
  },

  createTimeEntry: async (data: Partial<CrewTimeEntry>): Promise<CrewTimeEntry> => {
    const response = await apiClient.post<CrewTimeEntry>('/hr/crew-time-entries', data);
    return response.data;
  },
};
