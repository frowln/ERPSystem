import type { EngineeringSurvey, SurveyStatus } from '@/types';

const STORAGE_KEY = 'privod-engineering-surveys';

function getLocal(projectId: string): EngineeringSurvey[] {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data[projectId] || [];
  } catch { return []; }
}

function saveLocal(projectId: string, items: EngineeringSurvey[]) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    data[projectId] = items;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

// TODO: No backend endpoint exists for engineering surveys. Using localStorage fallback.
export const surveysApi = {
  getSurveys: async (projectId: string): Promise<EngineeringSurvey[]> => {
    return getLocal(projectId);
  },

  createSurvey: async (projectId: string, data: Partial<EngineeringSurvey>): Promise<EngineeringSurvey> => {
    const item: EngineeringSurvey = {
      id: `survey-${Date.now()}`,
      projectId,
      type: data.type || 'GEODETIC',
      status: 'PLANNED' as SurveyStatus,
      ...data,
    } as EngineeringSurvey;
    const items = getLocal(projectId);
    items.push(item);
    saveLocal(projectId, items);
    return item;
  },

  updateSurvey: async (projectId: string, surveyId: string, data: Partial<EngineeringSurvey>): Promise<EngineeringSurvey> => {
    const items = getLocal(projectId);
    const idx = items.findIndex(s => s.id === surveyId);
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...data } as EngineeringSurvey;
      saveLocal(projectId, items);
      return items[idx];
    }
    return { id: surveyId, projectId, ...data } as EngineeringSurvey;
  },

  changeStatus: async (projectId: string, surveyId: string, status: SurveyStatus): Promise<EngineeringSurvey> => {
    const items = getLocal(projectId);
    const idx = items.findIndex(s => s.id === surveyId);
    if (idx >= 0) {
      items[idx] = { ...items[idx], status } as EngineeringSurvey;
      saveLocal(projectId, items);
      return items[idx];
    }
    return { id: surveyId, projectId, status } as EngineeringSurvey;
  },
};
