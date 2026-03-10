import { apiClient } from './client';

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  plannedDate?: string;
  actualDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  sequence: number;
  isKeyMilestone: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'privod-milestones';

function getLocal(projectId: string): Milestone[] {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data[projectId] || [];
  } catch { return []; }
}

function saveLocal(projectId: string, items: Milestone[]) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    data[projectId] = items;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export const milestonesApi = {
  getMilestones: async (projectId: string): Promise<Milestone[]> => {
    try {
      const resp = await apiClient.get<Milestone[]>(`/projects/${projectId}/milestones`, { _silentErrors: true } as never);
      const data = resp.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return getLocal(projectId);
    }
  },
  createMilestone: async (projectId: string, data: Partial<Milestone>): Promise<Milestone> => {
    try {
      const resp = await apiClient.post<Milestone>(`/projects/${projectId}/milestones`, data, { _silentErrors: true } as never);
      return resp.data;
    } catch {
      const now = new Date().toISOString();
      const item: Milestone = {
        id: `ms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        projectId,
        name: data.name || '',
        status: data.status || 'PENDING',
        sequence: data.sequence ?? 0,
        isKeyMilestone: data.isKeyMilestone ?? false,
        plannedDate: data.plannedDate,
        createdAt: now,
        updatedAt: now,
        ...data,
      } as Milestone;
      const items = getLocal(projectId);
      items.push(item);
      saveLocal(projectId, items);
      return item;
    }
  },
  updateMilestone: async (projectId: string, id: string, data: Partial<Milestone>): Promise<Milestone> => {
    try {
      const resp = await apiClient.put<Milestone>(`/projects/${projectId}/milestones/${id}`, data, { _silentErrors: true } as never);
      return resp.data;
    } catch {
      const items = getLocal(projectId);
      const idx = items.findIndex(m => m.id === id);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() } as Milestone;
        saveLocal(projectId, items);
        return items[idx];
      }
      return { id, projectId, ...data } as Milestone;
    }
  },
  deleteMilestone: async (projectId: string, id: string): Promise<void> => {
    try {
      await apiClient.delete(`/projects/${projectId}/milestones/${id}`, { _silentErrors: true } as never);
    } catch {
      const items = getLocal(projectId).filter(m => m.id !== id);
      saveLocal(projectId, items);
    }
  },
};
