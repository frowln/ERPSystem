// Daily log module types
// Construction journal (KS-6) entries, weather, and photo records

export type DailyLogStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type DailyLogEntryType = 'WORK' | 'MATERIAL' | 'EQUIPMENT' | 'PERSONNEL' | 'INCIDENT' | 'NOTE';
export type WeatherCondition = 'CLEAR' | 'CLOUDY' | 'RAIN' | 'SNOW' | 'FOG' | 'WIND';

export interface WeatherInfo {
  temperature: number;
  condition: WeatherCondition;
  windSpeed: number;
  humidity: number;
}

export interface DailyLogEntry {
  id: string;
  type: DailyLogEntryType;
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
  authorId?: string;
  authorName: string;
  notes?: string;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDailyLogRequest {
  date: string;
  projectId: string;
  weather: WeatherInfo;
  notes?: string;
}

export interface CreateDailyLogEntryRequest {
  dailyLogId: string;
  type: DailyLogEntryType;
  time: string;
  description: string;
  quantity?: number;
  unit?: string;
  workerCount?: number;
  responsibleName?: string;
}

export interface ApproveDailyLogRequest {
  dailyLogId: string;
  comment?: string;
}

export interface RejectDailyLogRequest {
  dailyLogId: string;
  reason: string;
}
