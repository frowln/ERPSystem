import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { Applicant, ApplicantStatus, ApplicantPriority, JobPosition, RecruitmentStage, Interview } from '@/modules/recruitment/types';

export interface ApplicantFilters extends PaginationParams {
  status?: ApplicantStatus;
  priority?: ApplicantPriority;
  positionId?: string;
  search?: string;
}

export interface JobPositionFilters extends PaginationParams {
  status?: string;
  search?: string;
}

export const recruitmentApi = {
  getApplicants: async (params?: ApplicantFilters): Promise<PaginatedResponse<Applicant>> => {
    const response = await apiClient.get<PaginatedResponse<Applicant>>('/v1/recruitment/applicants', { params });
    return response.data;
  },

  getApplicant: async (id: string): Promise<Applicant> => {
    const response = await apiClient.get<Applicant>(`/v1/recruitment/applicants/${id}`);
    return response.data;
  },

  createApplicant: async (data: Partial<Applicant>): Promise<Applicant> => {
    const response = await apiClient.post<Applicant>('/v1/recruitment/applicants', data);
    return response.data;
  },

  updateApplicant: async (id: string, data: Partial<Applicant>): Promise<Applicant> => {
    const response = await apiClient.put<Applicant>(`/v1/recruitment/applicants/${id}`, data);
    return response.data;
  },

  getJobPositions: async (params?: JobPositionFilters): Promise<PaginatedResponse<JobPosition>> => {
    const response = await apiClient.get<PaginatedResponse<JobPosition>>('/v1/recruitment/positions', { params });
    return response.data;
  },

  getJobPosition: async (id: string): Promise<JobPosition> => {
    const response = await apiClient.get<JobPosition>(`/v1/recruitment/positions/${id}`);
    return response.data;
  },

  createJobPosition: async (data: Partial<JobPosition>): Promise<JobPosition> => {
    const response = await apiClient.post<JobPosition>('/v1/recruitment/positions', data);
    return response.data;
  },

  getStages: async (): Promise<RecruitmentStage[]> => {
    const response = await apiClient.get<RecruitmentStage[]>('/v1/recruitment/stages');
    return response.data;
  },

  getInterviews: async (applicantId: string): Promise<Interview[]> => {
    const response = await apiClient.get<Interview[]>(`/v1/recruitment/applicants/${applicantId}/interviews`);
    return response.data;
  },

  createInterview: async (applicantId: string, data: Partial<Interview>): Promise<Interview> => {
    const response = await apiClient.post<Interview>(`/v1/recruitment/applicants/${applicantId}/interviews`, data);
    return response.data;
  },

  deleteApplicant: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/recruitment/applicants/${id}`);
  },
};
