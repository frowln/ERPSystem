import React, { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ConfirmDialogProvider } from '@/design-system/components/ConfirmDialog/provider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useWebSocket, useUserNotifications, useBroadcastNotifications } from '@/hooks/useWebSocket';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { tw } from '@/design-system/tokens';
import { t } from '@/i18n';

const Sidebar = lazy(() =>
  import('@/design-system/components/Sidebar').then((module) => ({ default: module.Sidebar })),
);
const TopBar = lazy(() =>
  import('@/design-system/components/TopBar').then((module) => ({ default: module.TopBar })),
);
const BottomNav = lazy(() =>
  import('@/design-system/components/BottomNav').then((module) => ({ default: module.BottomNav })),
);
const CommandPalette = lazy(() =>
  import('@/design-system/components/CommandPalette').then((module) => ({ default: module.CommandPalette })),
);
const ShortcutsHelp = lazy(() =>
  import('@/design-system/components/ShortcutsHelp').then((module) => ({ default: module.ShortcutsHelp })),
);
const OfflineIndicator = lazy(() =>
  import('@/design-system/components/OfflineIndicator').then((module) => ({ default: module.OfflineIndicator })),
);
const InstallPrompt = lazy(() =>
  import('@/components/InstallPrompt').then((module) => ({ default: module.InstallPrompt })),
);
const AssistantWidget = lazy(() =>
  import('@/components/AssistantWidget/AssistantWidget'),
);
const OnboardingOverlay = lazy(() =>
  import('@/components/OnboardingOverlay'),
);

/** Error boundary that keeps sidebar/topbar functional when a page crashes */
class PageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[PageErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <PageErrorFallback error={this.state.error} onReset={() => this.setState({ hasError: false, error: null })} />;
    }
    return this.props.children;
  }
}

const PageErrorFallback: React.FC<{ error: Error | null; onReset: () => void }> = ({ error, onReset }) => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center min-h-[60vh]" role="alert">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-danger-50 dark:bg-danger-500/10 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-danger-500">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {t('errors.generic')}
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm">
          {t('errors.serverErrorDescription')}
        </p>
        {error && (
          <details className="mb-6 text-left bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4">
            <summary className="cursor-pointer text-sm text-neutral-500 dark:text-neutral-400">
              {t('common.details')}
            </summary>
            <pre className="mt-2 text-xs text-danger-600 dark:text-danger-400 whitespace-pre-wrap break-words">
              {error.message}
            </pre>
          </details>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onReset}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            {t('errors.tryAgain')}
          </button>
          <button
            onClick={() => { onReset(); navigate('/'); }}
            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors text-sm font-medium"
          >
            {t('errors.goHome')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AppLayout: React.FC = () => {
  const { isAuthenticated, token } = useAuthStore();
  const { collapsed } = useSidebarStore();
  const isMobile = useIsMobile();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);

  // Establish the WebSocket connection for the authenticated session
  useWebSocket(isAuthenticated ? token : null);

  // Subscribe to user-specific and broadcast notifications (shows toasts)
  useUserNotifications();
  useBroadcastNotifications();

  // Global Cmd+K / Ctrl+K shortcut for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), []);
  const closeCommandPalette = useCallback(() => setCommandPaletteOpen(false), []);
  const openShortcutsHelp = useCallback(() => setShortcutsHelpOpen(true), []);
  const closeShortcutsHelp = useCallback(() => setShortcutsHelpOpen(false), []);

  // Register keyboard shortcuts (? for help, g+key for navigation)
  useKeyboardShortcuts(openCommandPalette, openShortcutsHelp);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ConfirmDialogProvider>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <Suspense fallback={null}>
          <Sidebar />
          <TopBar />
          {isMobile && <BottomNav />}
          <CommandPalette open={commandPaletteOpen} onClose={closeCommandPalette} />
          <ShortcutsHelp open={shortcutsHelpOpen} onClose={closeShortcutsHelp} />
          <OfflineIndicator />
          <InstallPrompt />
        </Suspense>
        {/* Floating AI + Support chat widget — hidden in print */}
        <div className="print:hidden">
          <Suspense fallback={null}>
            <AssistantWidget />
          </Suspense>
        </div>
        {/* Onboarding overlay for new users */}
        <Suspense fallback={null}>
          <OnboardingOverlay />
        </Suspense>
        <main
          className={cn(
            tw.ptTopBar, 'transition-[padding] duration-200 min-h-screen isolate',
            isMobile
              ? 'pl-0 pb-16'
              : collapsed
                ? tw.plSidebarCollapsed
                : tw.plSidebar,
          )}
        >
          <div className={cn('max-w-[1440px] mx-auto', isMobile ? 'p-4' : 'p-6')}>
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            }>
              <PageErrorBoundary>
                <ProtectedRoute>
                  <Outlet />
                </ProtectedRoute>
              </PageErrorBoundary>
            </Suspense>
          </div>
        </main>
      </div>
    </ConfirmDialogProvider>
  );
};
