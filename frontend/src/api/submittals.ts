import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { Submittal, SubmittalReview, CreateSubmittalRequest, SubmittalStatus } from '@/modules/submittals/types';

export interface SubmittalFilters extends PaginationParams {
  status?: SubmittalStatus;
  projectId?: string;
  search?: string;
}

function parseJsonArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string' && val.startsWith('[')) {
    try { return JSON.parse(val) as string[]; } catch { return []; }
  }
  if (typeof val === 'string' && val.length > 0) {
    return val.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function mapSubmittal(raw: Record<string, unknown>): Submittal {
  return {
    id: String(raw.id ?? ''),
    number: String(raw.number ?? raw.code ?? ''),
    code: raw.code ? String(raw.code) : undefined,
    title: String(raw.title ?? ''),
    description: raw.description ? String(raw.description) : undefined,
    submittalType: String(raw.submittalType ?? 'OTHER') as Submittal['submittalType'],
    submittalTypeDisplayName: raw.submittalTypeDisplayName ? String(raw.submittalTypeDisplayName) : undefined,
    status: String(raw.status ?? 'DRAFT') as Submittal['status'],
    statusDisplayName: raw.statusDisplayName ? String(raw.statusDisplayName) : undefined,
    projectId: String(raw.projectId ?? ''),
    projectName: raw.projectName ? String(raw.projectName) : undefined,
    specSection: raw.specSection ? String(raw.specSection) : undefined,
    ballInCourt: raw.ballInCourt ? String(raw.ballInCourt) : undefined,
    submittedById: raw.submittedById ? String(raw.submittedById) : undefined,
    submittedByName: raw.submittedByName ? String(raw.submittedByName) : undefined,
    reviewedById: raw.reviewedById ? String(raw.reviewedById) : undefined,
    reviewerName: raw.reviewerName ? String(raw.reviewerName) : undefined,
    dueDate: raw.dueDate ? String(raw.dueDate) : undefined,
    submitDate: raw.submittedDate ? String(raw.submittedDate) : (raw.submitDate ? String(raw.submitDate) : undefined),
    responseDate: raw.responseDate ? String(raw.responseDate) : undefined,
    requiredDate: raw.requiredDate ? String(raw.requiredDate) : undefined,
    leadTimeDays: raw.leadTime != null ? Number(raw.leadTime) : undefined,
    linkedDrawingIds: parseJsonArray(raw.linkedDrawingIds),
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
  };
}

function mapReview(raw: Record<string, unknown>): SubmittalReview {
  return {
    id: String(raw.id ?? ''),
    submittalId: String(raw.submittalId ?? ''),
    reviewerName: raw.reviewerName ? String(raw.reviewerName) : (raw.reviewerId ? String(raw.reviewerId) : '---'),
    status: String(raw.status ?? ''),
    comment: raw.comments ? String(raw.comments) : (raw.comment ? String(raw.comment) : undefined),
    reviewDate: String(raw.reviewedAt ?? raw.reviewDate ?? raw.createdAt ?? ''),
  };
}

export const submittalsApi = {
  getSubmittals: async (params?: SubmittalFilters): Promise<PaginatedResponse<Submittal>> => {
    const response = await apiClient.get('/pm/submittals', { params });
    const wrapper = response.data?.data ?? response.data;
    const content = wrapper?.content ?? wrapper;
    const items: Record<string, unknown>[] = Array.isArray(content) ? content : [];
    return {
      content: items.map(mapSubmittal),
      totalElements: Number(wrapper?.totalElements ?? items.length),
      totalPages: Number(wrapper?.totalPages ?? 1),
      size: Number(wrapper?.size ?? items.length),
      page: Number(wrapper?.number ?? wrapper?.page ?? 0),
    };
  },

  getSubmittal: async (id: string): Promise<Submittal> => {
    const response = await apiClient.get(`/pm/submittals/${id}`);
    const raw = response.data?.data ?? response.data;
    return mapSubmittal(raw as Record<string, unknown>);
  },

  createSubmittal: async (data: CreateSubmittalRequest): Promise<Submittal> => {
    const response = await apiClient.post('/pm/submittals', data);
    const raw = response.data?.data ?? response.data;
    return mapSubmittal(raw as Record<string, unknown>);
  },

  updateSubmittal: async (id: string, data: Partial<Submittal>): Promise<Submittal> => {
    const response = await apiClient.put(`/pm/submittals/${id}`, data);
    const raw = response.data?.data ?? response.data;
    return mapSubmittal(raw as Record<string, unknown>);
  },

  changeStatus: async (id: string, status: SubmittalStatus): Promise<Submittal> => {
    const response = await apiClient.patch(`/pm/submittals/${id}/status`, { status });
    const raw = response.data?.data ?? response.data;
    return mapSubmittal(raw as Record<string, unknown>);
  },

  getSubmittalReviews: async (id: string): Promise<SubmittalReview[]> => {
    const response = await apiClient.get(`/pm/submittals/${id}/reviews`, { params: { page: 0, size: 100 } });
    const wrapper = response.data?.data ?? response.data;
    const content = wrapper?.content ?? wrapper;
    const items: Record<string, unknown>[] = Array.isArray(content) ? content : [];
    return items.map(mapReview);
  },

  deleteSubmittal: async (id: string): Promise<void> => {
    await apiClient.delete(`/pm/submittals/${id}`);
  },
};
