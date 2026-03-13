import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PortalBrandingState {
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  companyName: string;
  setBranding: (branding: Partial<Pick<PortalBrandingState, 'logoUrl' | 'primaryColor' | 'accentColor' | 'companyName'>>) => void;
  resetBranding: () => void;
}

const defaults = {
  logoUrl: null as string | null,
  primaryColor: '#6366f1',
  accentColor: '#f59e0b',
  companyName: '',
};

export const usePortalBrandingStore = create<PortalBrandingState>()(
  persist(
    (set) => ({
      ...defaults,

      setBranding: (partial) => set((state) => ({ ...state, ...partial })),

      resetBranding: () => set(defaults),
    }),
    {
      name: 'privod-portal-branding',
      partialize: (state) => ({
        logoUrl: state.logoUrl,
        primaryColor: state.primaryColor,
        accentColor: state.accentColor,
        companyName: state.companyName,
      }),
    },
  ),
);
