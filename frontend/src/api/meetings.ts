import type { PreConstructionMeeting } from '@/types';

const STORAGE_KEY = 'privod-preconstruction-meetings';

function getLocal(projectId: string): PreConstructionMeeting | null {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data[projectId] || null;
  } catch { return null; }
}

function saveLocal(projectId: string, meeting: PreConstructionMeeting) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    data[projectId] = meeting;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

// TODO: No backend endpoint exists for pre-construction meetings. Using localStorage fallback.
export const meetingsApi = {
  getMeeting: async (projectId: string): Promise<PreConstructionMeeting | null> => {
    return getLocal(projectId);
  },

  createMeeting: async (projectId: string, data: Partial<PreConstructionMeeting>): Promise<PreConstructionMeeting> => {
    const meeting: PreConstructionMeeting = {
      id: `meeting-${Date.now()}`,
      projectId,
      date: data.date || new Date().toISOString(),
      decisions: data.decisions || [],
      actionItems: data.actionItems || [],
      ...data,
    } as PreConstructionMeeting;
    saveLocal(projectId, meeting);
    return meeting;
  },

  updateMeeting: async (projectId: string, data: Partial<PreConstructionMeeting>): Promise<PreConstructionMeeting> => {
    const existing = getLocal(projectId);
    const meeting = { ...existing, ...data, projectId } as PreConstructionMeeting;
    saveLocal(projectId, meeting);
    return meeting;
  },

  toggleDecision: async (projectId: string, decisionId: string): Promise<PreConstructionMeeting> => {
    const meeting = getLocal(projectId);
    if (meeting && meeting.decisions) {
      meeting.decisions = meeting.decisions.map((d) =>
        d.id === decisionId ? { ...d, completed: !d.completed } : d,
      );
      saveLocal(projectId, meeting);
    }
    return meeting as PreConstructionMeeting;
  },

  toggleActionItem: async (projectId: string, actionItemId: string): Promise<PreConstructionMeeting> => {
    const meeting = getLocal(projectId);
    if (meeting && meeting.actionItems) {
      meeting.actionItems = meeting.actionItems.map((a) =>
        a.id === actionItemId ? { ...a, completed: !a.completed } : a,
      );
      saveLocal(projectId, meeting);
    }
    return meeting as PreConstructionMeeting;
  },
};
