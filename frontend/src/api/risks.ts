import type { ProjectRisk } from '@/types';

const STORAGE_KEY = 'privod-project-risks';

function getLocal(projectId: string): ProjectRisk[] {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data[projectId] || [];
  } catch { return []; }
}

function saveLocal(projectId: string, items: ProjectRisk[]) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    data[projectId] = items;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

// TODO: No backend endpoint exists for project risks. Using localStorage fallback.
export const risksApi = {
  getRisks: async (projectId: string): Promise<ProjectRisk[]> => {
    return getLocal(projectId);
  },

  createRisk: async (projectId: string, data: Partial<ProjectRisk>): Promise<ProjectRisk> => {
    const item: ProjectRisk = {
      id: `risk-${Date.now()}`,
      projectId,
      description: data.description || '',
      category: data.category || 'OTHER',
      probability: data.probability ?? 3,
      impact: data.impact ?? 3,
      score: (data.probability ?? 3) * (data.impact ?? 3),
      status: data.status || 'IDENTIFIED',
      mitigation: data.mitigation || '',
      createdAt: new Date().toISOString(),
      ...data,
    } as ProjectRisk;
    const items = getLocal(projectId);
    items.push(item);
    saveLocal(projectId, items);
    return item;
  },

  updateRisk: async (projectId: string, riskId: string, data: Partial<ProjectRisk>): Promise<ProjectRisk> => {
    const items = getLocal(projectId);
    const idx = items.findIndex(r => r.id === riskId);
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...data } as ProjectRisk;
      saveLocal(projectId, items);
      return items[idx];
    }
    return { id: riskId, projectId, ...data } as ProjectRisk;
  },

  deleteRisk: async (projectId: string, riskId: string): Promise<void> => {
    const items = getLocal(projectId).filter(r => r.id !== riskId);
    saveLocal(projectId, items);
  },
};
