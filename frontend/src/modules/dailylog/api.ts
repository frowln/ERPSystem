import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type DailyLogStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type LogEntryType = 'WORK' | 'MATERIAL' | 'EQUIPMENT' | 'PERSONNEL' | 'INCIDENT' | 'NOTE';

export interface WeatherInfo {
  temperature: number;
  condition: 'CLEAR' | 'CLOUDY' | 'RAIN' | 'SNOW' | 'FOG' | 'WIND';
  windSpeed: number;
  humidity: number;
}

export interface DailyLogEntry {
  id: string;
  type: LogEntryType;
  time: string;
  description: string;
  quantity?: number;
  unit?: string;
  workerCount?: number;
  responsibleName?: string;
}

export interface DailyLogPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption: string;
  takenAt: string;
  takenBy: string;
}

export interface DailyLog {
  id: string;
  date: string;
  projectId: string;
  projectName: string;
  status: DailyLogStatus;
  weather: WeatherInfo;
  entries: DailyLogEntry[];
  photos: DailyLogPhoto[];
  authorName: string;
  approvedByName?: string;
  submittedAt?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface DailyLogFilters extends PaginationParams {
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: DailyLogStatus;
  search?: string;
}

export const dailyLogApi = {
  getAll: async (params?: DailyLogFilters): Promise<PaginatedResponse<DailyLog>> => {
    const response = await apiClient.get<PaginatedResponse<DailyLog>>('/daily-logs', { params });
    return response.data;
  },

  getById: async (id: string): Promise<DailyLog> => {
    const response = await apiClient.get<DailyLog>(`/daily-logs/${id}`);
    return response.data;
  },

  getByDate: async (projectId: string, date: string): Promise<DailyLog> => {
    const response = await apiClient.get<DailyLog>('/daily-logs/by-date', {
      params: { projectId, date },
    });
    return response.data;
  },

  getByDateRange: async (projectId: string, startDate: string, endDate: string): Promise<DailyLog[]> => {
    const response = await apiClient.get<DailyLog[]>('/daily-logs/date-range', {
      params: { projectId, startDate, endDate },
    });
    return response.data;
  },

  getTimeline: async (projectId: string): Promise<DailyLog[]> => {
    const response = await apiClient.get<DailyLog[]>(`/daily-logs/timeline/${projectId}`);
    return response.data;
  },

  create: async (data: Partial<DailyLog>): Promise<DailyLog> => {
    const response = await apiClient.post<DailyLog>('/daily-logs', data);
    return response.data;
  },

  update: async (id: string, data: Partial<DailyLog>): Promise<DailyLog> => {
    const response = await apiClient.put<DailyLog>(`/daily-logs/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/daily-logs/${id}`);
  },

  submit: async (id: string): Promise<DailyLog> => {
    const response = await apiClient.patch<DailyLog>(`/daily-logs/${id}/submit`);
    return response.data;
  },

  approve: async (id: string): Promise<DailyLog> => {
    const response = await apiClient.patch<DailyLog>(`/daily-logs/${id}/approve`);
    return response.data;
  },

  // Entries
  getEntries: async (logId: string, params?: PaginationParams): Promise<PaginatedResponse<DailyLogEntry>> => {
    const response = await apiClient.get<PaginatedResponse<DailyLogEntry>>(`/daily-logs/${logId}/entries`, { params });
    return response.data;
  },

  getEntry: async (logId: string, entryId: string): Promise<DailyLogEntry> => {
    const response = await apiClient.get<DailyLogEntry>(`/daily-logs/${logId}/entries/${entryId}`);
    return response.data;
  },

  createEntry: async (logId: string, data: Partial<DailyLogEntry>): Promise<DailyLogEntry> => {
    const response = await apiClient.post<DailyLogEntry>(`/daily-logs/${logId}/entries`, data);
    return response.data;
  },

  updateEntry: async (logId: string, entryId: string, data: Partial<DailyLogEntry>): Promise<DailyLogEntry> => {
    const response = await apiClient.put<DailyLogEntry>(`/daily-logs/${logId}/entries/${entryId}`, data);
    return response.data;
  },

  deleteEntry: async (logId: string, entryId: string): Promise<void> => {
    await apiClient.delete(`/daily-logs/${logId}/entries/${entryId}`);
  },

  // Photos
  getPhotos: async (logId: string, params?: PaginationParams): Promise<PaginatedResponse<DailyLogPhoto>> => {
    const response = await apiClient.get<PaginatedResponse<DailyLogPhoto>>(`/daily-logs/${logId}/photos`, { params });
    return response.data;
  },

  addPhoto: async (logId: string, data: { url: string; caption: string }): Promise<DailyLogPhoto> => {
    const response = await apiClient.post<DailyLogPhoto>(`/daily-logs/${logId}/photos`, data);
    return response.data;
  },

  deletePhoto: async (logId: string, photoId: string): Promise<void> => {
    await apiClient.delete(`/daily-logs/${logId}/photos/${photoId}`);
  },
};
