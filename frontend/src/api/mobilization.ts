import { apiClient } from './client';
import type { MobilizationItem } from '@/types';

const STORAGE_KEY = 'privod-mobilization';

function getLocal(projectId: string): MobilizationItem[] {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data[projectId] || [];
  } catch { return []; }
}

function saveLocal(projectId: string, items: MobilizationItem[]) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    data[projectId] = items;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export const mobilizationApi = {
  getByProject: async (projectId: string): Promise<MobilizationItem[]> => {
    try {
      // Backend: GET /api/mobilization-schedules?projectId={id}
      const response = await apiClient.get<MobilizationItem[]>('/mobilization-schedules', {
        params: { projectId },
        _silentErrors: true,
      } as never);
      const data = response.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return getLocal(projectId);
    }
  },

  create: async (projectId: string, data: Partial<MobilizationItem>): Promise<MobilizationItem> => {
    try {
      // Backend: POST /api/mobilization-schedules/generate { projectId }
      const response = await apiClient.post<MobilizationItem>('/mobilization-schedules/generate', {
        projectId,
        ...data,
      }, { _silentErrors: true } as never);
      return response.data;
    } catch {
      const item: MobilizationItem = {
        id: `mob-${Date.now()}`,
        projectId,
        type: 'OTHER',
        name: data.name || '',
        status: 'PLANNED',
        ...data,
      } as MobilizationItem;
      const items = getLocal(projectId);
      items.push(item);
      saveLocal(projectId, items);
      return item;
    }
  },

  update: async (projectId: string, itemId: string, data: Partial<MobilizationItem>): Promise<MobilizationItem> => {
    // TODO: No PUT endpoint on backend for mobilization schedules. Using localStorage.
    const items = getLocal(projectId);
    const idx = items.findIndex(m => m.id === itemId);
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...data } as MobilizationItem;
      saveLocal(projectId, items);
      return items[idx];
    }
    return { id: itemId, projectId, type: 'OTHER', name: '', status: 'PLANNED', ...data } as MobilizationItem;
  },

  delete: async (projectId: string, itemId: string): Promise<void> => {
    // TODO: No DELETE endpoint on backend for mobilization schedules. Using localStorage.
    const items = getLocal(projectId).filter(m => m.id !== itemId);
    saveLocal(projectId, items);
  },
};
