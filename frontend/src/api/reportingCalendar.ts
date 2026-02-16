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

export const reportingCalendarApi = {
  getDeadlines: async (params?: DeadlineFilters): Promise<PaginatedResponse<ReportingDeadline>> => {
    const response = await apiClient.get<PaginatedResponse<ReportingDeadline>>('/regulatory/reporting-deadlines', { params });
    return response.data;
  },

  getDeadline: async (id: string): Promise<ReportingDeadline> => {
    const response = await apiClient.get<ReportingDeadline>(`/regulatory/reporting-deadlines/${id}`);
    return response.data;
  },

  createDeadline: async (data: Partial<ReportingDeadline>): Promise<ReportingDeadline> => {
    const response = await apiClient.post<ReportingDeadline>('/regulatory/reporting-deadlines', data);
    return response.data;
  },

  getSubmissions: async (params?: SubmissionFilters): Promise<PaginatedResponse<ReportingSubmission>> => {
    const response = await apiClient.get<PaginatedResponse<ReportingSubmission>>('/regulatory/reporting-submissions', { params });
    return response.data;
  },

  createSubmission: async (data: Partial<ReportingSubmission>): Promise<ReportingSubmission> => {
    const response = await apiClient.post<ReportingSubmission>('/regulatory/reporting-submissions', data);
    return response.data;
  },
};
