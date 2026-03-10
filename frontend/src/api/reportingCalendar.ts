import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  ReportingDeadline,
  ReportingSubmission,
  DeadlineStatus,
  ReportingFrequency,
  SubmissionStatus,
} from '@/modules/regulatory/types';

export interface DeadlineFilters extends PaginationParams {
  status?: DeadlineStatus;
  frequency?: ReportingFrequency;
  regulatoryBody?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface SubmissionFilters extends PaginationParams {
  status?: SubmissionStatus;
  deadlineId?: string;
  search?: string;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------
const STORAGE_DEADLINES = 'privod_reporting_deadlines';
const STORAGE_SUBMISSIONS = 'privod_reporting_submissions';

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
// API with localStorage fallbacks
// ---------------------------------------------------------------------------
export const reportingCalendarApi = {
  getDeadlines: async (params?: DeadlineFilters): Promise<PaginatedResponse<ReportingDeadline>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<ReportingDeadline>>('/regulatory/reporting-deadlines', {
        params,
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      let stored = readStore<ReportingDeadline>(STORAGE_DEADLINES);
      if (params?.status) stored = stored.filter((d) => d.status === params.status);
      if (params?.frequency) stored = stored.filter((d) => d.frequency === params.frequency);
      if (params?.regulatoryBody) stored = stored.filter((d) => d.regulatoryBody === params.regulatoryBody);
      if (params?.dateFrom) stored = stored.filter((d) => d.dueDate >= params.dateFrom!);
      if (params?.dateTo) stored = stored.filter((d) => d.dueDate <= params.dateTo!);
      if (params?.search) {
        const q = params.search.toLowerCase();
        stored = stored.filter((d) => d.name.toLowerCase().includes(q) || d.regulatoryBody.toLowerCase().includes(q));
      }
      return { content: stored, totalElements: stored.length, totalPages: 1, page: params?.page ?? 0, size: params?.size ?? 20 };
    }
  },

  getDeadline: async (id: string): Promise<ReportingDeadline> => {
    try {
      const response = await apiClient.get<ReportingDeadline>(`/regulatory/reporting-deadlines/${id}`, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore<ReportingDeadline>(STORAGE_DEADLINES);
      const found = stored.find((d) => d.id === id);
      if (found) return found;
      throw new Error(`ReportingDeadline ${id} not found`);
    }
  },

  createDeadline: async (data: Partial<ReportingDeadline>): Promise<ReportingDeadline> => {
    try {
      const response = await apiClient.post<ReportingDeadline>('/regulatory/reporting-deadlines', data, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore<ReportingDeadline>(STORAGE_DEADLINES);
      const newItem: ReportingDeadline = {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        regulatoryBody: '',
        frequency: 'MONTHLY',
        dueDate: new Date().toISOString().slice(0, 10),
        status: 'UPCOMING',
        responsibleId: '',
        responsibleName: '',
        submissionChannel: 'portal',
        reportType: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      } as ReportingDeadline;
      stored.push(newItem);
      writeStore(STORAGE_DEADLINES, stored);
      return newItem;
    }
  },

  getSubmissions: async (params?: SubmissionFilters): Promise<PaginatedResponse<ReportingSubmission>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<ReportingSubmission>>('/regulatory/reporting-submissions', {
        params,
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      let stored = readStore<ReportingSubmission>(STORAGE_SUBMISSIONS);
      if (params?.status) stored = stored.filter((s) => s.status === params.status);
      if (params?.deadlineId) stored = stored.filter((s) => s.deadlineId === params.deadlineId);
      if (params?.search) {
        const q = params.search.toLowerCase();
        stored = stored.filter((s) => s.deadlineName.toLowerCase().includes(q) || s.regulatoryBody.toLowerCase().includes(q));
      }
      return { content: stored, totalElements: stored.length, totalPages: 1, page: params?.page ?? 0, size: params?.size ?? 20 };
    }
  },

  createSubmission: async (data: Partial<ReportingSubmission>): Promise<ReportingSubmission> => {
    try {
      const response = await apiClient.post<ReportingSubmission>('/regulatory/reporting-submissions', data, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore<ReportingSubmission>(STORAGE_SUBMISSIONS);
      const newItem: ReportingSubmission = {
        id: crypto.randomUUID(),
        deadlineId: '',
        deadlineName: '',
        regulatoryBody: '',
        submissionDate: new Date().toISOString().slice(0, 10),
        status: 'DRAFT',
        channel: 'portal',
        submittedById: '',
        submittedByName: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      } as ReportingSubmission;
      stored.push(newItem);
      writeStore(STORAGE_SUBMISSIONS, stored);
      return newItem;
    }
  },
};
