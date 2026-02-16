import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';
const THEME_STORAGE_KEY = 'privod_theme';

interface ThemeState {
  theme: Theme;
  resolved: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : 'light';
  } catch {
    return 'light';
  }
}

function writeStoredTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') return getSystemTheme();
  return theme;
}

function applyTheme(resolved: 'light' | 'dark') {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;
  const appRoot = document.getElementById('root');

  // Be defensive: some older builds / plugins might toggle `.dark` on body/root.
  // We keep html as the canonical target, but synchronize other common roots too.
  const targets = [root, body, appRoot].filter(Boolean) as HTMLElement[];
  for (const el of targets) {
    el.classList.toggle('dark', resolved === 'dark');
    el.setAttribute('data-theme', resolved);
  }
}

const storedTheme = readStoredTheme();

const initialResolved = resolveTheme(storedTheme);

// Apply immediately so there's no flash
if (typeof document !== 'undefined') {
  applyTheme(initialResolved);
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: storedTheme,
  resolved: initialResolved,
  setTheme: (theme) => {
    const resolved = resolveTheme(theme);
    writeStoredTheme(theme);
    applyTheme(resolved);
    set({ theme, resolved });
  },
}));

// Listen for system theme changes when in "system" mode
if (typeof window !== 'undefined') {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    const state = useThemeStore.getState();
    if (state.theme === 'system') {
      const resolved = getSystemTheme();
      applyTheme(resolved);
      useThemeStore.setState({ resolved });
    }
  };
  // Safari < 14 uses addListener/removeListener
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', handler);
  } else if (typeof (media as unknown as { addListener?: (fn: () => void) => void }).addListener === 'function') {
    (media as unknown as { addListener: (fn: () => void) => void }).addListener(handler);
  }
}
