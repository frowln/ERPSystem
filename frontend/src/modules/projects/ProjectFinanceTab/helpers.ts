import { apiClient } from '@/api/client';
import type { PaginatedResponse } from '@/types';
import type { ChangeOrder } from './types';

export async function fetchContractTypes(): Promise<Record<string, string>> {
  try {
    const res = await apiClient.get<{ id: string; code: string; name: string }[]>('/contracts/types');
    const map: Record<string, string> = {};
    (res.data ?? []).forEach((ct) => { map[ct.id] = ct.code; });
    return map;
  } catch {
    return {};
  }
}

export async function fetchChangeOrders(projectId: string): Promise<ChangeOrder[]> {
  try {
    const res = await apiClient.get<PaginatedResponse<ChangeOrder>>('/change-orders', {
      params: { projectId, size: 50, sort: 'createdAt,asc' },
    });
    return res.data?.content ?? [];
  } catch {
    return [];
  }
}
