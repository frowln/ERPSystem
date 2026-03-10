import type { TechnicalCondition } from '@/types';

const STORAGE_KEY = 'privod-technical-conditions';

function getLocal(projectId: string): TechnicalCondition[] {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data[projectId] || [];
  } catch { return []; }
}

function saveLocal(projectId: string, items: TechnicalCondition[]) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    data[projectId] = items;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

// TODO: No backend endpoint exists for technical conditions. Using localStorage fallback.
export const technicalConditionsApi = {
  getByProject: async (projectId: string): Promise<TechnicalCondition[]> => {
    return getLocal(projectId);
  },

  create: async (projectId: string, data: Partial<TechnicalCondition>): Promise<TechnicalCondition> => {
    const item: TechnicalCondition = {
      id: `tu-${Date.now()}`,
      projectId,
      type: 'OTHER',
      status: 'NOT_STARTED',
      ...data,
    } as TechnicalCondition;
    const items = getLocal(projectId);
    items.push(item);
    saveLocal(projectId, items);
    return item;
  },

  update: async (projectId: string, tuId: string, data: Partial<TechnicalCondition>): Promise<TechnicalCondition> => {
    const items = getLocal(projectId);
    const idx = items.findIndex(t => t.id === tuId);
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...data } as TechnicalCondition;
      saveLocal(projectId, items);
      return items[idx];
    }
    return { id: tuId, projectId, type: 'OTHER', status: 'NOT_STARTED', ...data } as TechnicalCondition;
  },

  delete: async (projectId: string, tuId: string): Promise<void> => {
    const items = getLocal(projectId).filter(t => t.id !== tuId);
    saveLocal(projectId, items);
  },
};
