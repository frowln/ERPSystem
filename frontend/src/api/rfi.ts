import { apiClient } from './client';
import { useAuthStore } from '@/stores/authStore';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { Rfi, RfiResponse, CreateRfiRequest, RfiStatus } from '@/modules/rfi/types';

export interface RfiFilters extends PaginationParams {
  status?: RfiStatus;
  projectId?: string;
  search?: string;
}

function parseJsonArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string' && val.startsWith('[')) {
    try { return JSON.parse(val) as string[]; } catch { return []; }
  }
  return [];
}

function toJsonbString(val: unknown): string | undefined {
  if (Array.isArray(val)) return JSON.stringify(val);
  if (typeof val === 'string') return val;
  return undefined;
}

function isOverdue(dueDate: string | undefined, status: string): boolean {
  if (!dueDate) return false;
  if (['CLOSED', 'ANSWERED', 'VOID'].includes(status)) return false;
  return new Date(dueDate) < new Date();
}

function mapRfi(raw: Record<string, unknown>): Rfi {
  const status = String(raw.status ?? 'DRAFT') as RfiStatus;
  const dueDate = raw.dueDate ? String(raw.dueDate) : undefined;
  return {
    id: String(raw.id ?? ''),
    number: String(raw.number ?? ''),
    subject: String(raw.subject ?? ''),
    question: String(raw.question ?? ''),
    answer: raw.answer ? String(raw.answer) : undefined,
    status,
    priority: (String(raw.priority ?? 'NORMAL')) as Rfi['priority'],
    projectId: String(raw.projectId ?? ''),
    projectName: raw.projectName ? String(raw.projectName) : undefined,
    assignedToId: raw.assignedToId ? String(raw.assignedToId) : undefined,
    assignedToName: raw.assignedToName ? String(raw.assignedToName) : undefined,
    responsibleId: raw.responsibleId ? String(raw.responsibleId) : undefined,
    createdById: raw.createdBy ? String(raw.createdBy) : undefined,
    createdByName: raw.createdByName ?? raw.createdBy ? String(raw.createdByName ?? raw.createdBy ?? '') : undefined,
    dueDate,
    answeredDate: raw.answeredDate ? String(raw.answeredDate) : undefined,
    answeredById: raw.answeredById ? String(raw.answeredById) : undefined,
    costImpact: raw.costImpact === true,
    scheduleImpact: raw.scheduleImpact === true,
    relatedDrawingId: raw.relatedDrawingId ? String(raw.relatedDrawingId) : undefined,
    specSection: raw.relatedSpecSection ? String(raw.relatedSpecSection) : (raw.specSection ? String(raw.specSection) : undefined),
    distributionList: parseJsonArray(raw.distributionList),
    linkedDocumentIds: parseJsonArray(raw.linkedDocumentIds),
    tags: parseJsonArray(raw.tags),
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
    isOverdue: isOverdue(dueDate, status),
  };
}

function mapRfiResponse(raw: Record<string, unknown>): RfiResponse {
  return {
    id: String(raw.id ?? ''),
    rfiId: String(raw.rfiId ?? ''),
    authorId: String(raw.responderId ?? raw.authorId ?? ''),
    authorName: raw.responderName ? String(raw.responderName) : (raw.authorName ? String(raw.authorName) : (raw.createdBy ? String(raw.createdBy) : undefined)),
    content: String(raw.responseText ?? raw.content ?? ''),
    isOfficial: raw.isOfficial === true,
    createdAt: String(raw.respondedAt ?? raw.createdAt ?? ''),
  };
}

export const rfiApi = {
  getRfis: async (params?: RfiFilters): Promise<PaginatedResponse<Rfi>> => {
    const response = await apiClient.get('/pm/rfis', { params });
    const wrapper = response.data?.data ?? response.data;
    const content = wrapper?.content ?? wrapper;
    const items: Record<string, unknown>[] = Array.isArray(content) ? content : [];
    return {
      content: items.map(mapRfi),
      totalElements: Number(wrapper?.totalElements ?? items.length),
      totalPages: Number(wrapper?.totalPages ?? 1),
      size: Number(wrapper?.size ?? items.length),
      page: Number(wrapper?.number ?? wrapper?.page ?? 0),
    };
  },

  getRfi: async (id: string): Promise<Rfi> => {
    const response = await apiClient.get(`/pm/rfis/${id}`);
    const raw = response.data?.data ?? response.data;
    return mapRfi(raw as Record<string, unknown>);
  },

  createRfi: async (data: CreateRfiRequest): Promise<Rfi> => {
    const { specSection, distributionList, ...rest } = data;
    const payload = {
      ...rest,
      relatedSpecSection: specSection,
      distributionList: toJsonbString(distributionList ?? []),
    };
    const response = await apiClient.post('/pm/rfis', payload);
    const raw = response.data?.data ?? response.data;
    return mapRfi(raw as Record<string, unknown>);
  },

  updateRfi: async (id: string, data: Partial<Rfi>): Promise<Rfi> => {
    const { specSection, distributionList, linkedDocumentIds, tags, ...rest } = data;
    const payload: Record<string, unknown> = { ...rest };
    if (specSection !== undefined) payload.relatedSpecSection = specSection;
    if (distributionList !== undefined) payload.distributionList = toJsonbString(distributionList);
    if (linkedDocumentIds !== undefined) payload.linkedDocumentIds = toJsonbString(linkedDocumentIds);
    if (tags !== undefined) payload.tags = toJsonbString(tags);
    const response = await apiClient.put(`/pm/rfis/${id}`, payload);
    const raw = response.data?.data ?? response.data;
    return mapRfi(raw as Record<string, unknown>);
  },

  changeRfiStatus: async (id: string, status: RfiStatus): Promise<Rfi> => {
    const response = await apiClient.patch(`/pm/rfis/${id}/status`, { status });
    const raw = response.data?.data ?? response.data;
    return mapRfi(raw as Record<string, unknown>);
  },

  getRfiResponses: async (id: string): Promise<RfiResponse[]> => {
    const response = await apiClient.get(`/pm/rfis/${id}/responses`);
    const wrapper = response.data?.data ?? response.data;
    const content = wrapper?.content ?? wrapper;
    const items: Record<string, unknown>[] = Array.isArray(content) ? content : [];
    return items.map(mapRfiResponse);
  },

  addRfiResponse: async (id: string, content: string, isOfficial: boolean): Promise<RfiResponse> => {
    const responderId = useAuthStore.getState().user?.id ?? null;
    const response = await apiClient.post(`/pm/rfis/${id}/responses`, {
      rfiId: id,
      responderId,
      responseText: content,
      isOfficial,
    });
    const raw = response.data?.data ?? response.data;
    return mapRfiResponse(raw as Record<string, unknown>);
  },

  deleteRfi: async (id: string): Promise<void> => {
    await apiClient.delete(`/pm/rfis/${id}`);
  },
};
