import { create } from 'zustand';
import { apiClient } from '@/api/client';

interface ModuleVisibilityState {
  disabledModules: Set<string>;
  loaded: boolean;
  fetchDisabledModules: () => Promise<void>;
  isModuleEnabled: (key: string) => boolean;
}

export const useModuleVisibilityStore = create<ModuleVisibilityState>((set, get) => ({
  disabledModules: new Set<string>(),
  loaded: false,

  fetchDisabledModules: async () => {
    try {
      const response = await apiClient.get('/module-visibility', { _silentErrors: true } as any);
      const modules: string[] = response.data?.disabledModules ?? [];
      set({ disabledModules: new Set(modules), loaded: true });
    } catch {
      set({ disabledModules: new Set(), loaded: true });
    }
  },

  isModuleEnabled: (key: string) => {
    return !get().disabledModules.has(key);
  },
}));
