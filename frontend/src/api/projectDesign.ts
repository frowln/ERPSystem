import { apiClient } from './client';
import { t } from '@/i18n';
import type { ProjectDesign, ProjectDesignSection } from '@/types';

const STORAGE_KEY = 'privod-project-design';

function getLocal(projectId: string): ProjectDesign[] {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data[projectId] || [];
  } catch { return []; }
}

function saveLocal(projectId: string, items: ProjectDesign[]) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    data[projectId] = items;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export const projectDesignApi = {
  getByProject: async (projectId: string): Promise<ProjectDesign[]> => {
    try {
      // Backend: GET /api/v1/design/versions?projectId={id}
      const response = await apiClient.get<{ content: ProjectDesign[] }>('/v1/design/versions', {
        params: { projectId },
        _silentErrors: true,
      } as never);
      const data = response.data;
      return Array.isArray(data) ? data : (data as { content: ProjectDesign[] }).content ?? [];
    } catch {
      return getLocal(projectId);
    }
  },

  getById: async (projectId: string, designId: string): Promise<ProjectDesign | null> => {
    try {
      // Backend: GET /api/v1/design/versions/{id}
      const response = await apiClient.get<ProjectDesign>(`/v1/design/versions/${designId}`, { _silentErrors: true } as never);
      return response.data;
    } catch {
      const items = getLocal(projectId);
      return items.find(d => d.id === designId) ?? null;
    }
  },

  create: async (projectId: string, data: Partial<ProjectDesign>): Promise<ProjectDesign> => {
    try {
      // Backend: POST /api/v1/design/versions (projectId in body)
      const response = await apiClient.post<ProjectDesign>('/v1/design/versions', {
        ...data,
        projectId,
      }, { _silentErrors: true } as never);
      return response.data;
    } catch {
      const item: ProjectDesign = {
        id: `design-${Date.now()}`,
        projectId,
        name: data.name || t('projects.design.defaultFolder'),
        status: 'DRAFT',
        sections: [],
        overallCompletion: 0,
        createdAt: new Date().toISOString(),
        ...data,
      } as ProjectDesign;
      const items = getLocal(projectId);
      items.push(item);
      saveLocal(projectId, items);
      return item;
    }
  },

  update: async (projectId: string, designId: string, data: Partial<ProjectDesign>): Promise<ProjectDesign> => {
    try {
      // Backend: PUT /api/v1/design/versions/{id}
      const response = await apiClient.put<ProjectDesign>(`/v1/design/versions/${designId}`, data, { _silentErrors: true } as never);
      return response.data;
    } catch {
      const items = getLocal(projectId);
      const idx = items.findIndex(d => d.id === designId);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...data } as ProjectDesign;
        saveLocal(projectId, items);
        return items[idx];
      }
      return { id: designId, projectId, name: '', status: 'DRAFT', sections: [], overallCompletion: 0, createdAt: new Date().toISOString(), ...data } as ProjectDesign;
    }
  },

  delete: async (projectId: string, designId: string): Promise<void> => {
    try {
      // Backend: DELETE /api/v1/design/versions/{id}
      await apiClient.delete(`/v1/design/versions/${designId}`, { _silentErrors: true } as never);
    } catch {
      const items = getLocal(projectId).filter(d => d.id !== designId);
      saveLocal(projectId, items);
    }
  },

  // Section management
  addSection: async (projectId: string, _designId: string, data: Partial<ProjectDesignSection>): Promise<ProjectDesignSection> => {
    try {
      // Backend: POST /api/v1/design/sections (projectId in body)
      const response = await apiClient.post<ProjectDesignSection>('/v1/design/sections', {
        ...data,
        projectId,
      }, { _silentErrors: true } as never);
      return response.data;
    } catch {
      const section: ProjectDesignSection = {
        id: `section-${Date.now()}`,
        designId: _designId,
        code: data.code || 'OTHER',
        name: data.name || '',
        status: 'NOT_STARTED',
        version: 1,
        completionPercent: 0,
        ...data,
      } as ProjectDesignSection;
      const items = getLocal(projectId);
      const idx = items.findIndex(d => d.id === _designId);
      if (idx >= 0) {
        items[idx].sections = [...(items[idx].sections || []), section];
        saveLocal(projectId, items);
      }
      return section;
    }
  },

  updateSection: async (projectId: string, designId: string, sectionId: string, data: Partial<ProjectDesignSection>): Promise<ProjectDesignSection> => {
    try {
      // Backend: PUT /api/v1/design/sections/{id}
      const response = await apiClient.put<ProjectDesignSection>(`/v1/design/sections/${sectionId}`, data, { _silentErrors: true } as never);
      return response.data;
    } catch {
      const items = getLocal(projectId);
      const dIdx = items.findIndex(d => d.id === designId);
      if (dIdx >= 0) {
        const sIdx = items[dIdx].sections.findIndex((s: ProjectDesignSection) => s.id === sectionId);
        if (sIdx >= 0) {
          items[dIdx].sections[sIdx] = { ...items[dIdx].sections[sIdx], ...data } as ProjectDesignSection;
          saveLocal(projectId, items);
          return items[dIdx].sections[sIdx];
        }
      }
      return { id: sectionId, designId, code: 'OTHER', name: '', status: 'NOT_STARTED', version: 1, completionPercent: 0, ...data } as ProjectDesignSection;
    }
  },
};
