import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type ApplicantStatus = 'NEW' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';
export type ApplicantPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type JobPositionStatus = 'OPEN' | 'CLOSED' | 'ON_HOLD' | 'CANCELLED';
export type InterviewResult = 'PENDING' | 'PASSED' | 'FAILED' | 'CANCELLED';

export interface Applicant {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  status: ApplicantStatus;
  priority: ApplicantPriority;
  jobPositionId: string;
  jobPositionTitle?: string;
  stageId?: string;
  stageName?: string;
  source?: string;
  resumeUrl?: string;
  expectedSalary?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobPosition {
  id: string;
  title: string;
  departmentId?: string;
  departmentName?: string;
  status: JobPositionStatus;
  description?: string;
  requirements?: string;
  salaryFrom?: number;
  salaryTo?: number;
  applicantCount: number;
  createdAt: string;
}

export interface RecruitmentStage {
  name: string;
  order: number;
}

export interface Interview {
  id: string;
  applicantId: string;
  applicantName?: string;
  interviewerId: string;
  interviewerName?: string;
  scheduledAt: string;
  duration?: number;
  type?: string;
  result: InterviewResult;
  notes?: string;
  createdAt: string;
}

export interface ApplicantFilters extends PaginationParams {
  status?: ApplicantStatus;
  priority?: ApplicantPriority;
  jobPositionId?: string;
  search?: string;
}

export interface JobPositionFilters extends PaginationParams {
  status?: JobPositionStatus;
  departmentId?: string;
  search?: string;
}

export interface InterviewFilters extends PaginationParams {
  applicantId?: string;
  interviewerId?: string;
}

export const recruitmentApi = {
  // Applicants
  getApplicants: async (params?: ApplicantFilters): Promise<PaginatedResponse<Applicant>> => {
    const response = await apiClient.get<PaginatedResponse<Applicant>>('/v1/recruitment/applicants', { params });
    return response.data;
  },

  getApplicantById: async (id: string): Promise<Applicant> => {
    const response = await apiClient.get<Applicant>(`/v1/recruitment/applicants/${id}`);
    return response.data;
  },

  createApplicant: async (data: Partial<Applicant>): Promise<Applicant> => {
    const response = await apiClient.post<Applicant>('/v1/recruitment/applicants', data);
    return response.data;
  },

  updateApplicantStage: async (id: string, stageId: string): Promise<Applicant> => {
    const response = await apiClient.put<Applicant>(`/v1/recruitment/applicants/${id}/stage`, null, {
      params: { stageId },
    });
    return response.data;
  },

  updateApplicantStatus: async (id: string, status: ApplicantStatus): Promise<Applicant> => {
    const response = await apiClient.put<Applicant>(`/v1/recruitment/applicants/${id}/status`, null, {
      params: { status },
    });
    return response.data;
  },

  deleteApplicant: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/recruitment/applicants/${id}`);
  },

  // Job Positions
  getJobPositions: async (params?: JobPositionFilters): Promise<PaginatedResponse<JobPosition>> => {
    const response = await apiClient.get<PaginatedResponse<JobPosition>>('/v1/recruitment/jobs', { params });
    return response.data;
  },

  getJobPosition: async (id: string): Promise<JobPosition> => {
    const response = await apiClient.get<JobPosition>(`/v1/recruitment/jobs/${id}`);
    return response.data;
  },

  createJobPosition: async (data: Partial<JobPosition>): Promise<JobPosition> => {
    const response = await apiClient.post<JobPosition>('/v1/recruitment/jobs', data);
    return response.data;
  },

  updateJobPositionStatus: async (id: string, status: JobPositionStatus): Promise<JobPosition> => {
    const response = await apiClient.put<JobPosition>(`/v1/recruitment/jobs/${id}/status`, null, {
      params: { status },
    });
    return response.data;
  },

  deleteJobPosition: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/recruitment/jobs/${id}`);
  },

  // Stages
  getStages: async (): Promise<RecruitmentStage[]> => {
    const response = await apiClient.get<RecruitmentStage[]>('/v1/recruitment/stages');
    return response.data;
  },

  // Interviews
  getInterviews: async (params?: InterviewFilters): Promise<PaginatedResponse<Interview>> => {
    const response = await apiClient.get<PaginatedResponse<Interview>>('/v1/recruitment/interviews', { params });
    return response.data;
  },

  getInterview: async (id: string): Promise<Interview> => {
    const response = await apiClient.get<Interview>(`/v1/recruitment/interviews/${id}`);
    return response.data;
  },

  scheduleInterview: async (data: Partial<Interview>): Promise<Interview> => {
    const response = await apiClient.post<Interview>('/v1/recruitment/interviews', data);
    return response.data;
  },

  updateInterviewResult: async (id: string, result: InterviewResult, notes?: string): Promise<Interview> => {
    const response = await apiClient.put<Interview>(`/v1/recruitment/interviews/${id}/result`, null, {
      params: { result, ...(notes ? { notes } : {}) },
    });
    return response.data;
  },

  deleteInterview: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/recruitment/interviews/${id}`);
  },
};
