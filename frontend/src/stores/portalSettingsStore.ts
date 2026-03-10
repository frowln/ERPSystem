import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PortalBranding {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  welcomeMessage: string;
  contactPhone: string;
  contactEmail: string;
}

export interface PortalVisibility {
  progress: boolean;
  schedule: boolean;
  budget: boolean;
  documents: boolean;
  photos: boolean;
  ks2Acts: boolean;
  defects: boolean;
  teamContacts: boolean;
  chat: boolean;
}

export interface PortalNotifications {
  milestones: boolean;
  weeklySummary: boolean;
  documentUploads: boolean;
}

export interface PortalSettings {
  branding: PortalBranding;
  visibility: PortalVisibility;
  notifications: PortalNotifications;
}

interface PortalSettingsState extends PortalSettings {
  setBranding: (branding: Partial<PortalBranding>) => void;
  setVisibility: (visibility: Partial<PortalVisibility>) => void;
  setNotifications: (notifications: Partial<PortalNotifications>) => void;
  resetSettings: () => void;
}

const defaultSettings: PortalSettings = {
  branding: {
    companyName: '',
    logoUrl: '',
    primaryColor: '#6366f1',
    welcomeMessage: '',
    contactPhone: '',
    contactEmail: '',
  },
  visibility: {
    progress: true,
    schedule: true,
    budget: true,
    documents: true,
    photos: true,
    ks2Acts: true,
    defects: true,
    teamContacts: true,
    chat: true,
  },
  notifications: {
    milestones: true,
    weeklySummary: true,
    documentUploads: true,
  },
};

export const usePortalSettingsStore = create<PortalSettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setBranding: (partial) =>
        set((state) => ({
          branding: { ...state.branding, ...partial },
        })),

      setVisibility: (partial) =>
        set((state) => ({
          visibility: { ...state.visibility, ...partial },
        })),

      setNotifications: (partial) =>
        set((state) => ({
          notifications: { ...state.notifications, ...partial },
        })),

      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'privod-portal-settings',
      partialize: (state) => ({
        branding: state.branding,
        visibility: state.visibility,
        notifications: state.notifications,
      }),
    },
  ),
);
