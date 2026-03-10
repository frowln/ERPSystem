import { apiClient } from './client';
import type { ConstructionPermit } from '@/types';

const STORAGE_KEY = 'privod-permits';

function getLocal(projectId: string): ConstructionPermit[] {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data[projectId] || [];
  } catch { return []; }
}

function saveLocal(projectId: string, items: ConstructionPermit[]) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    data[projectId] = items;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export const permitsApi = {
  getPermits: async (projectId: string): Promise<ConstructionPermit[]> => {
    try {
      const response = await apiClient.get<{ content: ConstructionPermit[] }>('/regulatory/permits', {
        params: { projectId },
        _silentErrors: true,
      } as never);
      const data = response.data;
      const items = Array.isArray(data) ? data : (data as { content: ConstructionPermit[] }).content ?? [];
      if (items.length > 0) return items;
      // If backend returns empty, check localStorage
      return getLocal(projectId);
    } catch {
      return getLocal(projectId);
    }
  },

  createPermit: async (projectId: string, data: Partial<ConstructionPermit>): Promise<ConstructionPermit> => {
    try {
      const response = await apiClient.post<ConstructionPermit>('/regulatory/permits', {
        ...data,
        projectId,
      }, { _silentErrors: true } as never);
      return response.data;
    } catch {
      // Fallback to localStorage
      const item: ConstructionPermit = {
        id: `permit-${Date.now()}`,
        projectId,
        permitType: data.permitType || 'OTHER',
        status: data.status || 'NOT_STARTED',
        ...data,
      } as ConstructionPermit;
      const items = getLocal(projectId);
      items.push(item);
      saveLocal(projectId, items);
      return item;
    }
  },

  updatePermit: async (projectId: string, permitId: string, data: Partial<ConstructionPermit>): Promise<ConstructionPermit> => {
    try {
      const response = await apiClient.put<ConstructionPermit>(`/regulatory/permits/${permitId}`, data, { _silentErrors: true } as never);
      return response.data;
    } catch {
      // Fallback to localStorage
      const items = getLocal(projectId);
      const idx = items.findIndex(p => p.id === permitId);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...data } as ConstructionPermit;
        saveLocal(projectId, items);
        return items[idx];
      }
      return { id: permitId, projectId, ...data } as ConstructionPermit;
    }
  },
};
