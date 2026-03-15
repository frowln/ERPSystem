import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Bell, ChevronDown, LogOut, Settings, User, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { notificationsApi } from '@/api/notifications';
import { useAuthStore } from '@/stores/authStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { tw } from '@/design-system/tokens';
import { isDemoMode } from '@/lib/demoMode';
import { useThemeStore } from '@/hooks/useTheme';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { WhatsNewBadge } from '@/components/WhatsNewBadge';
import { t } from '@/i18n';

const ThemeToggle: React.FC = () => {
  const { resolved, setTheme } = useThemeStore();
  const toggle = () => setTheme(resolved === 'dark' ? 'light' : 'dark');
  return (
    <button
      onClick={toggle}
      aria-label={resolved === 'dark' ? t('topbar.enableLightTheme') : t('topbar.enableDarkTheme')}
      className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
    >
      {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

export const TopBar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { collapsed } = useSidebarStore();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationsApi.getUnreadCount().catch(() => ({ count: 0 })),
    placeholderData: { count: 0 },
    refetchInterval: 60000,
  });

  const resetNotifications = useNotificationStore((s) => s.reset);
  const handleLogout = useCallback(() => {
    resetNotifications();
    logout();
    navigate('/login');
  }, [resetNotifications, logout, navigate]);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cmd+K is now handled by AppLayout → CommandPalette

  const userInitials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : t('common.appInitials');
  const wsUnreadCount = useNotificationStore((s) => s.unreadCount);
  // Combine the REST-polled count with the real-time WebSocket increment
  const unreadCount = (unreadData?.count ?? 0) + wsUnreadCount;

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-fixed bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-4 px-6 transition-all duration-200',
        tw.topBarHeight,
        isMobile
          ? 'left-0 pl-16'
          : collapsed
            ? tw.leftSidebar
            : tw.leftSidebarExpanded,
      )}
    >
      {/* Search */}
      <div className="flex-1 max-w-lg">
        <div
          className={cn(
            'relative flex items-center rounded-lg border transition-all duration-150',
            searchFocused
              ? 'border-primary-300 ring-2 ring-primary-100 bg-white dark:bg-neutral-800 dark:ring-primary-900'
              : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700',
          )}
        >
          <Search size={16} className="absolute left-3 text-neutral-400" />
          <input
            ref={searchRef}
            type="text"
            aria-label={t('topbar.globalSearch')}
            placeholder={t('topbar.searchPlaceholder')}
            className="w-full h-9 pl-9 pr-16 text-sm bg-transparent outline-none placeholder:text-neutral-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const q = searchQuery.trim();
                navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
              }
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="absolute right-3 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isDemoMode && (
          <span className="hidden sm:inline-flex items-center rounded-md bg-warning-50 text-warning-700 border border-warning-200 px-2 py-1 text-[11px] font-semibold tracking-wide">
            DEMO DATA
          </span>
        )}

        {/* Theme toggle */}
        <ThemeToggle />

        {/* What's new */}
        <WhatsNewBadge />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifDropdownOpen((prev) => !prev)}
            aria-label={unreadCount > 0 ? t('topbar.openNotificationsUnread', { count: String(unreadCount) }) : t('topbar.openNotifications')}
            aria-haspopup="dialog"
            aria-expanded={notifDropdownOpen}
            className="relative p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-danger-500 text-white text-[10px] font-semibold leading-4 text-center rounded-full ring-2 ring-white dark:ring-neutral-900">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationDropdown
            open={notifDropdownOpen}
            onClose={() => setNotifDropdownOpen(false)}
            unreadCount={unreadCount}
          />
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1" />

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-label={userMenuOpen ? t('topbar.closeUserMenu') : t('topbar.openUserMenu')}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-[11px] font-semibold text-white">
              {userInitials}
            </div>
            {user && (
              <span className="hidden md:block text-sm font-medium text-neutral-700 dark:text-neutral-300 max-w-[120px] truncate">
                {user.firstName}
              </span>
            )}
            <ChevronDown
              size={14}
              className={cn(
                'text-neutral-400 transition-transform',
                userMenuOpen && 'rotate-180',
              )}
            />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg py-1 animate-slide-up">
              <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-700">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {user ? `${user.firstName} ${user.lastName}` : t('topbar.defaultUser')}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  <User size={15} />
                  {t('topbar.profile')}
                </button>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  <Settings size={15} />
                  {t('topbar.settings')}
                </button>
              </div>
              <div className="border-t border-neutral-100 dark:border-neutral-700 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                >
                  <LogOut size={15} />
                  {t('topbar.logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
