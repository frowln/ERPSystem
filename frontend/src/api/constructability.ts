import { apiClient } from './client';

// ===================== Types =====================

export interface ConstructabilityReview {
  id: string;
  projectId: string;
  specificationId?: string;
  title: string;
  status: string;
  reviewerName: string;
  reviewDate: string;
  overallRating?: string;
  notes?: string;
  itemCount: number;
  createdAt?: string;
}

export interface ConstructabilityItem {
  id: string;
  reviewId: string;
  category: string;
  description: string;
  severity: string;
  status: string;
  resolution?: string;
  rfiId?: string;
  assignedTo?: string;
  createdAt?: string;
}

export interface CreateReviewRequest {
  projectId: string;
  specificationId?: string;
  title: string;
  reviewerName: string;
  reviewDate: string;
  overallRating?: string;
  notes?: string;
}

export interface UpdateReviewRequest {
  specificationId?: string;
  title?: string;
  reviewerName?: string;
  reviewDate?: string;
  overallRating?: string;
  status?: string;
  notes?: string;
}

export interface CreateItemRequest {
  category: string;
  description: string;
  severity?: string;
  status?: string;
  resolution?: string;
  rfiId?: string;
  assignedTo?: string;
}

export interface UpdateItemRequest {
  category?: string;
  description?: string;
  severity?: string;
  status?: string;
  resolution?: string;
  rfiId?: string;
  assignedTo?: string;
}

// ===================== API =====================

export const constructabilityApi = {
  // Reviews
  listReviews: async (projectId?: string, page = 0, size = 50): Promise<{ content: ConstructabilityReview[]; totalElements: number }> => {
    const params: Record<string, string | number> = { page, size };
    if (projectId) params.projectId = projectId;
    const res = await apiClient.get('/constructability-reviews', { params });
    return res.data.data;
  },

  getReview: async (id: string): Promise<ConstructabilityReview> => {
    const res = await apiClient.get(`/constructability-reviews/${id}`);
    return res.data.data;
  },

  createReview: async (data: CreateReviewRequest): Promise<ConstructabilityReview> => {
    const res = await apiClient.post('/constructability-reviews', data);
    return res.data.data;
  },

  updateReview: async (id: string, data: UpdateReviewRequest): Promise<ConstructabilityReview> => {
    const res = await apiClient.put(`/constructability-reviews/${id}`, data);
    return res.data.data;
  },

  deleteReview: async (id: string): Promise<void> => {
    await apiClient.delete(`/constructability-reviews/${id}`);
  },

  // Items
  listItems: async (reviewId: string): Promise<ConstructabilityItem[]> => {
    const res = await apiClient.get(`/constructability-reviews/${reviewId}/items`);
    return res.data.data;
  },

  addItem: async (reviewId: string, data: CreateItemRequest): Promise<ConstructabilityItem> => {
    const res = await apiClient.post(`/constructability-reviews/${reviewId}/items`, data);
    return res.data.data;
  },

  updateItem: async (reviewId: string, itemId: string, data: UpdateItemRequest): Promise<ConstructabilityItem> => {
    const res = await apiClient.put(`/constructability-reviews/${reviewId}/items/${itemId}`, data);
    return res.data.data;
  },

  deleteItem: async (reviewId: string, itemId: string): Promise<void> => {
    await apiClient.delete(`/constructability-reviews/${reviewId}/items/${itemId}`);
  },
};
