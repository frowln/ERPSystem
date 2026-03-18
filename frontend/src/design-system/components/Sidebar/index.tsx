import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, ChevronLeft, ChevronDown, ChevronRight, Building2, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useAuthStore } from '@/stores/authStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { usePermissions } from '@/hooks/usePermissions';
import { navigation, type NavItem, type NavGroup } from '@/config/navigation';
import { useModuleVisibilityStore } from '@/stores/moduleVisibilityStore';
import { tw } from '@/design-system/tokens';
import { t } from '@/i18n';

const NavItemComponent: React.FC<{
  item: NavItem;
  collapsed: boolean;
  onClick?: () => void;
}> = React.memo(({ item, collapsed, onClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = item.href === '/'
    ? location.pathname === '/'
    : location.pathname === item.href || location.pathname.startsWith(item.href + '/');

  const Icon = item.icon;

  const handleClick = useCallback(() => {
    navigate(item.href);
    onClick?.();
  }, [item.href, navigate, onClick]);

  return (
    <button
      onClick={handleClick}
      aria-label={item.label}
      title={collapsed ? item.label : undefined}
      className={cn(
        'w-full flex items-center gap-3 rounded-lg transition-all duration-150 group relative',
        collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
        isActive
          ? 'bg-white/10 text-white'
          : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5',
      )}
    >
      <Icon size={collapsed ? 20 : 18} className="flex-shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 text-left text-sm font-medium truncate" title={item.label}>
            {item.label}
          </span>
          {item.badge != null && item.badge > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-semibold bg-primary-500 text-white rounded-full">
              {item.badge}
            </span>
          )}
        </>
      )}
      {collapsed && item.badge != null && item.badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary-500 rounded-full" />
      )}
    </button>
  );
});

const NavGroupComponent: React.FC<{
  group: NavGroup;
  collapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
  onItemClick?: () => void;
}> = React.memo(({ group, collapsed, expanded, onToggle, onItemClick }) => {
  const location = useLocation();
  const GroupIcon = group.icon;

  // Check if any item in this group is active
  const isGroupActive = group.items.some((item) =>
    item.href === '/'
      ? location.pathname === '/'
      : location.pathname === item.href || location.pathname.startsWith(item.href + '/'),
  );

  // For single-item groups (like Home), just render the item directly
  if (group.items.length === 1) {
    return (
      <div className="space-y-0.5">
        <NavItemComponent item={group.items[0]} collapsed={collapsed} onClick={onItemClick} />
      </div>
    );
  }

  // Group badge total
  const groupBadge = group.items.reduce((sum, item) => sum + (item.badge ?? 0), 0);

  return (
    <div>
      {/* Group header */}
      {collapsed ? (
        <div className="mb-1">
          <button
            onClick={onToggle}
            aria-label={`${expanded ? t('sidebar.collapse') : t('sidebar.expand')} ${group.title}`}
            aria-expanded={expanded}
            title={group.title}
            className={cn(
              'w-full flex justify-center px-2 py-2.5 rounded-lg transition-all duration-150 relative',
              isGroupActive
                ? 'text-white bg-white/10'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5',
            )}
          >
            <GroupIcon size={20} className="flex-shrink-0" />
            {groupBadge > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary-500 rounded-full" />
            )}
          </button>
        </div>
      ) : (
        <button
          onClick={onToggle}
          aria-label={`${expanded ? t('sidebar.collapse') : t('sidebar.expand')} ${group.title}`}
          aria-expanded={expanded}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 mb-0.5',
            isGroupActive
              ? 'text-white'
              : 'text-neutral-400 hover:text-neutral-200',
          )}
        >
          <GroupIcon size={18} className="flex-shrink-0" />
          <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider">
            {group.title}
          </span>
          {groupBadge > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-semibold bg-primary-500 text-white rounded-full mr-1">
              {groupBadge}
            </span>
          )}
          <span className="text-neutral-500">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </button>
      )}

      {/* Group items */}
      {!collapsed && expanded && (
        <div className="ml-3 pl-3 border-l border-white/10 space-y-0.5">
          {group.items.map((item) => (
            <NavItemComponent key={item.id} item={item} collapsed={collapsed} onClick={onItemClick} />
          ))}
        </div>
      )}
    </div>
  );
});

export const Sidebar: React.FC = () => {
  const { collapsed, toggle, setCollapsed, mobileOpen, setMobileOpen } = useSidebarStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { canAccess } = usePermissions();
  const isModuleEnabled = useModuleVisibilityStore((s) => s.isModuleEnabled);

  // Filter navigation items based on user permissions AND module visibility
  const filteredNavigation = useMemo(
    () =>
      navigation
        .filter((group) => isModuleEnabled(group.id))
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => canAccess(item.href) && isModuleEnabled(item.id)),
        }))
        .filter((group) => group.items.length > 0),
    [canAccess, isModuleEnabled],
  );

  // Track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    // Initially expand the group that contains the active route
    const initial: Record<string, boolean> = {};
    for (const group of filteredNavigation) {
      const isGroupActive = group.items.some((item) =>
        item.href === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.href),
      );
      initial[group.id] = isGroupActive;
    }
    return initial;
  });

  // Update expanded groups when location changes
  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = { ...prev };
      for (const group of filteredNavigation) {
        const isGroupActive = group.items.some((item) =>
          item.href === '/'
            ? location.pathname === '/'
            : location.pathname === item.href || location.pathname.startsWith(item.href + '/'),
        );
        if (isGroupActive) {
          next[group.id] = true;
        }
      }
      return next;
    });
  }, [location.pathname, filteredNavigation]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile, setCollapsed]);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleMobileItemClick = useCallback(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile]);

  const userInitials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : t('common.appInitials');

  const sidebarContent = (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-fixed flex flex-col bg-neutral-900 transition-all duration-200 ease-in-out',
        // Desktop sizing
        !isMobile && (collapsed ? tw.sidebarCollapsedWidth : tw.sidebarWidth),
        // Mobile: always full-width sidebar when open
        isMobile && tw.sidebarMobileWidth,
        isMobile && !mobileOpen && '-translate-x-full',
        isMobile && mobileOpen && 'translate-x-0',
      )}
    >
      {/* Logo area */}
      <div
        className={cn(
          'flex items-center border-b border-white/10 flex-shrink-0', tw.topBarHeight,
          collapsed && !isMobile ? 'justify-center px-2' : 'px-5 gap-3',
        )}
      >
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 size={18} className="text-white" />
        </div>
        {(!collapsed || isMobile) && (
          <span className="text-lg font-bold text-white tracking-wide flex-1">
            {t('common.appName').toUpperCase()}
          </span>
        )}
        {isMobile && mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            aria-label={t('sidebar.closeSidebar')}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
        {filteredNavigation.map((group) => (
          <NavGroupComponent
            key={group.id}
            group={group}
            collapsed={collapsed && !isMobile}
            expanded={!!expandedGroups[group.id]}
            onToggle={() => toggleGroup(group.id)}
            onItemClick={handleMobileItemClick}
          />
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 p-3 flex-shrink-0">
        {!collapsed || isMobile ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user ? `${user.firstName} ${user.lastName}` : t('topbar.defaultUser')}
              </p>
              <p className="text-xs text-neutral-400 truncate">
                {user?.role === 'ADMIN'
                  ? t('sidebar.roleAdmin')
                  : (user?.role === 'PROJECT_MANAGER' || user?.role === 'MANAGER')
                    ? t('sidebar.roleManager')
                    : user?.role === 'ACCOUNTANT'
                      ? t('sidebar.roleAccountant')
                      : user?.role === 'VIEWER'
                        ? t('sidebar.roleViewer')
                        : t('sidebar.roleEngineer')}
              </p>
            </div>
            <button
              onClick={handleLogout}
              aria-label={t('sidebar.logoutAccount')}
              title={t('topbar.logout')}
              className="p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-white/5 rounded-md transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            aria-label={t('sidebar.logoutAccount')}
            title={t('topbar.logout')}
            className="w-full flex justify-center p-2 text-neutral-500 hover:text-neutral-300 hover:bg-white/5 rounded-md transition-colors"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>

      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <button
          onClick={toggle}
          aria-label={collapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
          className="absolute -right-3 top-20 w-6 h-6 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors shadow-md z-10"
        >
          <ChevronLeft
            size={14}
            className={cn('transition-transform', collapsed && 'rotate-180')}
          />
        </button>
      )}
    </aside>
  );

  return (
    <>
      {sidebarContent}

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-overlay bg-black/50 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile hamburger (visible when sidebar is closed on mobile) */}
      {isMobile && !mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          aria-label={t('sidebar.openSidebar')}
          className="fixed top-4 left-4 z-fixed w-10 h-10 bg-neutral-900 text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-neutral-800 transition-colors"
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <path d="M1 1H17M1 7H17M1 13H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </>
  );
};
