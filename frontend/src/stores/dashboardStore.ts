import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_WIDGETS = [
  'active_projects',
  'budget_overview',
  'health_score',
  'task_summary',
  'recent_activity',
  'cash_flow_chart',
];

interface DashboardStore {
  activeWidgets: string[];
  addWidget: (id: string) => void;
  removeWidget: (id: string) => void;
  reorderWidgets: (ids: string[]) => void;
  resetToDefault: () => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      activeWidgets: [...DEFAULT_WIDGETS],

      addWidget: (id) =>
        set((state) => {
          if (state.activeWidgets.includes(id)) return state;
          return { activeWidgets: [...state.activeWidgets, id] };
        }),

      removeWidget: (id) =>
        set((state) => ({
          activeWidgets: state.activeWidgets.filter((wid) => wid !== id),
        })),

      reorderWidgets: (ids) => set({ activeWidgets: ids }),

      resetToDefault: () => set({ activeWidgets: [...DEFAULT_WIDGETS] }),
    }),
    {
      name: 'privod-dashboard-widgets',
    },
  ),
);
