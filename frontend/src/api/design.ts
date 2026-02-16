import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  DesignVersion,
  DesignVersionStatus,
  DesignReview,
  DesignReviewStatus,
  DesignSection,
  CreateDesignVersionRequest,
  CreateDesignReviewRequest,
} from '@/modules/design/types';

export interface DesignVersionFilters extends PaginationParams {
  status?: DesignVersionStatus;
  sectionId?: string;
  projectId?: string;
  search?: string;
}

export interface DesignReviewFilters extends PaginationParams {
  status?: DesignReviewStatus;
  projectId?: string;
  search?: string;
}

export interface DesignSectionFilters extends PaginationParams {
  projectId?: string;
  search?: string;
}

export const designApi = {
  getVersions: async (params?: DesignVersionFilters): Promise<PaginatedResponse<DesignVersion>> => {
    const response = await apiClient.get<PaginatedResponse<DesignVersion>>('/v1/design/versions', { params });
    return response.data;
  },

  getVersion: async (id: string): Promise<DesignVersion> => {
    const response = await apiClient.get<DesignVersion>(`/v1/design/versions/${id}`);
    return response.data;
  },

  createVersion: async (data: CreateDesignVersionRequest): Promise<DesignVersion> => {
    const response = await apiClient.post<DesignVersion>('/v1/design/versions', data);
    return response.data;
  },

  updateVersionStatus: async (id: string, status: DesignVersionStatus): Promise<DesignVersion> => {
    const response = await apiClient.patch<DesignVersion>(`/v1/design/versions/${id}/status`, { status });
    return response.data;
  },

  getReviews: async (params?: DesignReviewFilters): Promise<PaginatedResponse<DesignReview>> => {
    const response = await apiClient.get<PaginatedResponse<DesignReview>>('/v1/design/reviews', { params });
    return response.data;
  },

  getReview: async (id: string): Promise<DesignReview> => {
    const response = await apiClient.get<DesignReview>(`/v1/design/reviews/${id}`);
    return response.data;
  },

  createReview: async (data: CreateDesignReviewRequest): Promise<DesignReview> => {
    const response = await apiClient.post<DesignReview>('/v1/design/reviews', data);
    return response.data;
  },

  updateReviewStatus: async (id: string, status: DesignReviewStatus, comments?: string): Promise<DesignReview> => {
    const response = await apiClient.patch<DesignReview>(`/v1/design/reviews/${id}/status`, { status, comments });
    return response.data;
  },

  getSections: async (params?: DesignSectionFilters): Promise<PaginatedResponse<DesignSection>> => {
    const response = await apiClient.get<PaginatedResponse<DesignSection>>('/v1/design/sections', { params });
    return response.data;
  },

  getSection: async (id: string): Promise<DesignSection> => {
    const response = await apiClient.get<DesignSection>(`/v1/design/sections/${id}`);
    return response.data;
  },

  createSection: async (data: Partial<DesignSection>): Promise<DesignSection> => {
    const response = await apiClient.post<DesignSection>('/v1/design/sections', data);
    return response.data;
  },
};
