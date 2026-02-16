import { apiClient } from './client';

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

export const dailyLogApi = {
  getDailyLogs: async (params?: { projectId?: string; dateFrom?: string; dateTo?: string }): Promise<DailyLog[]> => {
    const response = await apiClient.get<DailyLog[]>('/daily-logs', { params });
    return response.data;
  },

  getDailyLog: async (id: string): Promise<DailyLog> => {
    const response = await apiClient.get<DailyLog>(`/daily-logs/${id}`);
    return response.data;
  },

  getDailyLogByDate: async (date: string, projectId: string): Promise<DailyLog | null> => {
    const response = await apiClient.get<DailyLog | null>('/daily-logs/by-date', { params: { date, projectId } });
    return response.data;
  },

  createDailyLog: async (data: Partial<DailyLog>): Promise<DailyLog> => {
    const response = await apiClient.post<DailyLog>('/daily-logs', data);
    return response.data;
  },

  updateDailyLog: async (id: string, data: Partial<DailyLog>): Promise<DailyLog> => {
    const response = await apiClient.put<DailyLog>(`/daily-logs/${id}`, data);
    return response.data;
  },

  submitDailyLog: async (id: string): Promise<DailyLog> => {
    const response = await apiClient.post<DailyLog>(`/daily-logs/${id}/submit`);
    return response.data;
  },

  approveDailyLog: async (id: string): Promise<DailyLog> => {
    const response = await apiClient.post<DailyLog>(`/daily-logs/${id}/approve`);
    return response.data;
  },

  rejectDailyLog: async (id: string, reason: string): Promise<DailyLog> => {
    const response = await apiClient.post<DailyLog>(`/daily-logs/${id}/reject`, { reason });
    return response.data;
  },

  addEntry: async (logId: string, entry: Partial<DailyLogEntry>): Promise<DailyLogEntry> => {
    const response = await apiClient.post<DailyLogEntry>(`/daily-logs/${logId}/entries`, entry);
    return response.data;
  },

  uploadPhoto: async (logId: string, file: File, caption: string): Promise<DailyLogPhoto> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', caption);
    const response = await apiClient.post<DailyLogPhoto>(`/daily-logs/${logId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteDailyLog: async (id: string): Promise<void> => {
    await apiClient.delete(`/daily-logs/${id}`);
  },
};
