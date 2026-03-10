import type { ExpertiseReview, ExpertiseRemark } from '@/types';

const STORAGE_KEY = 'privod-expertise';
const REMARKS_KEY = 'privod-expertise-remarks';

function getLocal(projectId: string): ExpertiseReview[] {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data[projectId] || [];
  } catch { return []; }
}

function saveLocal(projectId: string, items: ExpertiseReview[]) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    data[projectId] = items;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function getRemarksLocal(expertiseId: string): ExpertiseRemark[] {
  try {
    const data = JSON.parse(localStorage.getItem(REMARKS_KEY) || '{}');
    return data[expertiseId] || [];
  } catch { return []; }
}

function saveRemarksLocal(expertiseId: string, items: ExpertiseRemark[]) {
  try {
    const data = JSON.parse(localStorage.getItem(REMARKS_KEY) || '{}');
    data[expertiseId] = items;
    localStorage.setItem(REMARKS_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

// TODO: No backend endpoint exists for expertise reviews. Using localStorage fallback.
export const expertiseApi = {
  getByProject: async (projectId: string): Promise<ExpertiseReview[]> => {
    return getLocal(projectId);
  },

  create: async (projectId: string, data: Partial<ExpertiseReview>): Promise<ExpertiseReview> => {
    const item: ExpertiseReview = {
      id: `expertise-${Date.now()}`,
      projectId,
      type: 'STATE',
      status: 'NOT_STARTED',
      remarksCount: 0,
      resolvedRemarksCount: 0,
      ...data,
    } as ExpertiseReview;
    const items = getLocal(projectId);
    items.push(item);
    saveLocal(projectId, items);
    return item;
  },

  update: async (projectId: string, expertiseId: string, data: Partial<ExpertiseReview>): Promise<ExpertiseReview> => {
    const items = getLocal(projectId);
    const idx = items.findIndex(e => e.id === expertiseId);
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...data } as ExpertiseReview;
      saveLocal(projectId, items);
      return items[idx];
    }
    return { id: expertiseId, projectId, type: 'STATE', status: 'NOT_STARTED', ...data } as ExpertiseReview;
  },

  delete: async (projectId: string, expertiseId: string): Promise<void> => {
    const items = getLocal(projectId).filter(e => e.id !== expertiseId);
    saveLocal(projectId, items);
  },

  // Remarks management
  getRemarks: async (_projectId: string, expertiseId: string): Promise<ExpertiseRemark[]> => {
    return getRemarksLocal(expertiseId);
  },

  addRemark: async (_projectId: string, expertiseId: string, data: Partial<ExpertiseRemark>): Promise<ExpertiseRemark> => {
    const remarks = getRemarksLocal(expertiseId);
    const remark: ExpertiseRemark = {
      id: `remark-${Date.now()}`,
      expertiseId,
      number: remarks.length + 1,
      description: data.description || '',
      status: 'OPEN',
      ...data,
    } as ExpertiseRemark;
    remarks.push(remark);
    saveRemarksLocal(expertiseId, remarks);
    return remark;
  },

  updateRemark: async (_projectId: string, expertiseId: string, remarkId: string, data: Partial<ExpertiseRemark>): Promise<ExpertiseRemark> => {
    const remarks = getRemarksLocal(expertiseId);
    const idx = remarks.findIndex(r => r.id === remarkId);
    if (idx >= 0) {
      remarks[idx] = { ...remarks[idx], ...data } as ExpertiseRemark;
      saveRemarksLocal(expertiseId, remarks);
      return remarks[idx];
    }
    return { id: remarkId, expertiseId, number: 0, description: '', status: 'OPEN', ...data } as ExpertiseRemark;
  },
};
