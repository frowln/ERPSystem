import { create } from 'zustand';

interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;
  toggle: () => void;
  setCollapsed: (value: boolean) => void;
  setMobileOpen: (value: boolean) => void;
}

const storedCollapsed =
  typeof window !== 'undefined'
    ? localStorage.getItem('sidebar_collapsed') === 'true'
    : false;

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: storedCollapsed,
  mobileOpen: false,

  toggle: () =>
    set((state) => {
      const next = !state.collapsed;
      localStorage.setItem('sidebar_collapsed', String(next));
      return { collapsed: next };
    }),

  setCollapsed: (value) => {
    localStorage.setItem('sidebar_collapsed', String(value));
    set({ collapsed: value });
  },

  setMobileOpen: (value) => set({ mobileOpen: value }),
}));
