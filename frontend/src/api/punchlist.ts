import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  PunchItem,
  PunchItemStatus,
  PunchItemPriority,
  PunchCategory,
  PunchList,
  PunchListStatus,
  CreatePunchItemRequest,
  CreatePunchListRequest,
} from '@/modules/punchlist/types';

export interface PunchListFilters extends PaginationParams {
  status?: PunchListStatus;
  projectId?: string;
  search?: string;
}

export interface PunchItemFilters extends PaginationParams {
  punchListId?: string;
  status?: PunchItemStatus;
  priority?: PunchItemPriority;
  category?: PunchCategory;
  projectId?: string;
  assignedToId?: string;
  search?: string;
}

export const punchlistApi = {
  // Punch Lists
  getPunchLists: async (params?: PunchListFilters): Promise<PaginatedResponse<PunchList>> => {
    const response = await apiClient.get<PaginatedResponse<PunchList>>('/punchlist', { params });
    return response.data;
  },

  getPunchList: async (id: string): Promise<PunchList> => {
    const response = await apiClient.get<PunchList>(`/punchlist/${id}`);
    return response.data;
  },

  createPunchList: async (data: CreatePunchListRequest): Promise<PunchList> => {
    const response = await apiClient.post<PunchList>('/punchlist', data);
    return response.data;
  },

  updatePunchList: async (id: string, data: Partial<PunchList>): Promise<PunchList> => {
    const response = await apiClient.put<PunchList>(`/punchlist/${id}`, data);
    return response.data;
  },

  changePunchListStatus: async (id: string, status: PunchListStatus): Promise<PunchList> => {
    const response = await apiClient.patch<PunchList>(`/punchlist/${id}/complete`, { status });
    return response.data;
  },

  // Punch Items (items are nested under their punch list)
  getPunchItems: async (punchListId: string, params?: PunchItemFilters): Promise<PunchItem[]> => {
    const response = await apiClient.get<PunchItem[]>(`/punchlist/${punchListId}/items`, { params });
    return response.data;
  },

  getPunchItem: async (itemId: string): Promise<PunchItem> => {
    const response = await apiClient.get<PunchItem>(`/punchlist/items/${itemId}`);
    return response.data;
  },

  createPunchItem: async (
    punchListIdOrData: string | CreatePunchItemRequest,
    maybeData?: CreatePunchItemRequest,
  ): Promise<PunchItem> => {
    const punchListId =
      typeof punchListIdOrData === 'string'
        ? punchListIdOrData
        : punchListIdOrData.punchListId;
    const payload =
      typeof punchListIdOrData === 'string'
        ? maybeData
        : punchListIdOrData;

    if (!payload) {
      throw new Error('createPunchItem requires payload');
    }

    const response = await apiClient.post<PunchItem>(`/punchlist/${punchListId}/items`, payload);
    return response.data;
  },

  updatePunchItem: async (itemId: string, data: Partial<PunchItem>): Promise<PunchItem> => {
    const response = await apiClient.put<PunchItem>(`/punchlist/items/${itemId}`, data);
    return response.data;
  },

  fixPunchItem: async (itemId: string): Promise<PunchItem> => {
    const response = await apiClient.patch<PunchItem>(`/punchlist/items/${itemId}/fix`);
    return response.data;
  },

  verifyPunchItem: async (itemId: string): Promise<PunchItem> => {
    const response = await apiClient.patch<PunchItem>(`/punchlist/items/${itemId}/verify`);
    return response.data;
  },

  closePunchItem: async (itemId: string): Promise<PunchItem> => {
    const response = await apiClient.patch<PunchItem>(`/punchlist/items/${itemId}/close`);
    return response.data;
  },

  changePunchItemStatus: async (itemId: string, status: PunchItemStatus): Promise<PunchItem> => {
    const response = await apiClient.patch<PunchItem>(`/punchlist/items/${itemId}/status`, { status });
    return response.data;
  },

  deletePunchItem: async (itemId: string): Promise<void> => {
    await apiClient.delete(`/punchlist/items/${itemId}`);
  },
};
