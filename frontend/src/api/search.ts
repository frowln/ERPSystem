import { apiClient } from './client';
import type { PaginatedResponse } from '@/types';
import type { SearchResult, SearchFilters } from '@/modules/search/types';

export const searchApi = {
  search: async (query: string, filters?: Partial<SearchFilters>): Promise<PaginatedResponse<SearchResult>> => {
    const response = await apiClient.get<PaginatedResponse<SearchResult>>('/search', {
      params: {
        q: query,
        entityTypes: filters?.entityTypes?.join(',') || undefined,
        projectId: filters?.projectId || undefined,
        dateFrom: filters?.dateFrom || undefined,
        dateTo: filters?.dateTo || undefined,
      },
    });
    return response.data;
  },

  suggest: async (query: string): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/search/suggest', {
      params: { q: query },
    });
    return response.data;
  },
};
