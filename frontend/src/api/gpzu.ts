import type { GpzuDocument } from '@/types';

const STORAGE_KEY = 'privod-gpzu';

function getLocal(projectId: string): GpzuDocument[] {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data[projectId] || [];
  } catch { return []; }
}

function saveLocal(projectId: string, items: GpzuDocument[]) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    data[projectId] = items;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

// TODO: No backend endpoint exists for GPZU documents. Using localStorage fallback.
export const gpzuApi = {
  getByProject: async (projectId: string): Promise<GpzuDocument[]> => {
    return getLocal(projectId);
  },

  create: async (projectId: string, data: Partial<GpzuDocument>): Promise<GpzuDocument> => {
    const item: GpzuDocument = {
      id: `gpzu-${Date.now()}`,
      projectId,
      status: 'NOT_STARTED',
      ...data,
    } as GpzuDocument;
    const items = getLocal(projectId);
    items.push(item);
    saveLocal(projectId, items);
    return item;
  },

  update: async (projectId: string, gpzuId: string, data: Partial<GpzuDocument>): Promise<GpzuDocument> => {
    const items = getLocal(projectId);
    const idx = items.findIndex(g => g.id === gpzuId);
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...data } as GpzuDocument;
      saveLocal(projectId, items);
      return items[idx];
    }
    return { id: gpzuId, projectId, status: 'NOT_STARTED', ...data } as GpzuDocument;
  },

  delete: async (projectId: string, gpzuId: string): Promise<void> => {
    const items = getLocal(projectId).filter(g => g.id !== gpzuId);
    saveLocal(projectId, items);
  },
};
