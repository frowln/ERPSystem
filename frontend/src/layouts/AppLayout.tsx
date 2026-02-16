import React, { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ConfirmDialogProvider } from '@/design-system/components/ConfirmDialog/provider';
import { useAuthStore } from '@/stores/authStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useWebSocket, useUserNotifications, useBroadcastNotifications } from '@/hooks/useWebSocket';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { tw } from '@/design-system/tokens';

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
        </Suspense>
        <main
          className={cn(
            tw.ptTopBar, 'transition-all duration-200 min-h-screen',
            isMobile
              ? 'pl-0 pb-16'
              : collapsed
                ? tw.plSidebarCollapsed
                : tw.plSidebar,
          )}
        >
          <div className={cn('max-w-[1440px] mx-auto', isMobile ? 'p-4' : 'p-6')}>
            <Outlet />
          </div>
        </main>
      </div>
    </ConfirmDialogProvider>
  );
};
