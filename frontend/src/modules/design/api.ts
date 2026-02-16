import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type DesignVersionStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'SUPERSEDED' | 'ARCHIVED';
export type DesignReviewStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';

export interface DesignVersion {
  id: string;
  code: string;
  title: string;
  description?: string;
  projectId: string;
  projectName?: string;
  sectionId?: string;
  sectionName?: string;
  documentId?: string;
  versionNumber: string;
  status: DesignVersionStatus;
  authorId: string;
  authorName: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DesignReview {
  id: string;
  versionId: string;
  versionTitle?: string;
  reviewerId: string;
  reviewerName: string;
  status: DesignReviewStatus;
  comments?: string;
  createdAt: string;
  completedAt?: string;
}

export interface DesignSection {
  id: string;
  code: string;
  name: string;
  description?: string;
  projectId: string;
  projectName?: string;
  parentId?: string;
  parentName?: string;
  sortOrder: number;
  versionCount: number;
  createdAt: string;
}

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

export const designApi = {
  // Versions
  getAll: async (params?: DesignVersionFilters): Promise<PaginatedResponse<DesignVersion>> => {
    const response = await apiClient.get<PaginatedResponse<DesignVersion>>('/v1/design/versions', { params });
    return response.data;
  },

  getById: async (id: string): Promise<DesignVersion> => {
    const response = await apiClient.get<DesignVersion>(`/v1/design/versions/${id}`);
    return response.data;
  },

  getByDocument: async (documentId: string): Promise<DesignVersion[]> => {
    const response = await apiClient.get<DesignVersion[]>(`/v1/design/versions/by-document/${documentId}`);
    return response.data;
  },

  create: async (data: Partial<DesignVersion>): Promise<DesignVersion> => {
    const response = await apiClient.post<DesignVersion>('/v1/design/versions', data);
    return response.data;
  },

  update: async (id: string, data: Partial<DesignVersion>): Promise<DesignVersion> => {
    const response = await apiClient.put<DesignVersion>(`/v1/design/versions/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/design/versions/${id}`);
  },

  submitForReview: async (id: string): Promise<DesignVersion> => {
    const response = await apiClient.post<DesignVersion>(`/v1/design/versions/${id}/submit-for-review`);
    return response.data;
  },

  approveVersion: async (id: string): Promise<DesignVersion> => {
    const response = await apiClient.post<DesignVersion>(`/v1/design/versions/${id}/approve`);
    return response.data;
  },

  supersedeVersion: async (id: string): Promise<DesignVersion> => {
    const response = await apiClient.post<DesignVersion>(`/v1/design/versions/${id}/supersede`);
    return response.data;
  },

  archiveVersion: async (id: string): Promise<DesignVersion> => {
    const response = await apiClient.post<DesignVersion>(`/v1/design/versions/${id}/archive`);
    return response.data;
  },

  // Reviews
  getReviews: async (params?: DesignReviewFilters): Promise<PaginatedResponse<DesignReview>> => {
    const response = await apiClient.get<PaginatedResponse<DesignReview>>('/v1/design/reviews', { params });
    return response.data;
  },

  getReviewsForVersion: async (versionId: string): Promise<DesignReview[]> => {
    const response = await apiClient.get<DesignReview[]>(`/v1/design/versions/${versionId}/reviews`);
    return response.data;
  },

  createReview: async (data: Partial<DesignReview>): Promise<DesignReview> => {
    const response = await apiClient.post<DesignReview>('/v1/design/reviews', data);
    return response.data;
  },

  approveReview: async (id: string, comments?: string): Promise<DesignReview> => {
    const response = await apiClient.post<DesignReview>(`/v1/design/reviews/${id}/approve`, null, {
      params: comments ? { comments } : undefined,
    });
    return response.data;
  },

  rejectReview: async (id: string, comments?: string): Promise<DesignReview> => {
    const response = await apiClient.post<DesignReview>(`/v1/design/reviews/${id}/reject`, null, {
      params: comments ? { comments } : undefined,
    });
    return response.data;
  },

  requestRevision: async (id: string, comments?: string): Promise<DesignReview> => {
    const response = await apiClient.post<DesignReview>(`/v1/design/reviews/${id}/request-revision`, null, {
      params: comments ? { comments } : undefined,
    });
    return response.data;
  },

  // Sections
  getSections: async (projectId: string): Promise<DesignSection[]> => {
    const response = await apiClient.get<DesignSection[]>('/v1/design/sections', {
      params: { projectId },
    });
    return response.data;
  },

  getRootSections: async (projectId: string): Promise<DesignSection[]> => {
    const response = await apiClient.get<DesignSection[]>('/v1/design/sections/root', {
      params: { projectId },
    });
    return response.data;
  },

  getChildSections: async (parentId: string): Promise<DesignSection[]> => {
    const response = await apiClient.get<DesignSection[]>(`/v1/design/sections/${parentId}/children`);
    return response.data;
  },

  createSection: async (data: Partial<DesignSection>): Promise<DesignSection> => {
    const response = await apiClient.post<DesignSection>('/v1/design/sections', data);
    return response.data;
  },

  updateSection: async (id: string, data: Partial<DesignSection>): Promise<DesignSection> => {
    const response = await apiClient.put<DesignSection>(`/v1/design/sections/${id}`, data);
    return response.data;
  },

  deleteSection: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/design/sections/${id}`);
  },
};
