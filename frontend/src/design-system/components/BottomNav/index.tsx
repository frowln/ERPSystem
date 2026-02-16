import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardList, BookOpen, MessageSquare, Menu } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { useSidebarStore } from '@/stores/sidebarStore';

interface NavTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
}

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setMobileOpen } = useSidebarStore();

  const tabs: NavTab[] = [
    { id: 'home', label: t('nav.dashboard'), icon: <Home size={20} />, href: '/' },
    { id: 'tasks', label: t('nav.tasks'), icon: <ClipboardList size={20} />, href: '/tasks' },
    { id: 'dailylog', label: t('nav.dailyLog'), icon: <BookOpen size={20} />, href: '/daily-log' },
    { id: 'messages', label: t('messaging.channels'), icon: <MessageSquare size={20} />, href: '/messaging' },
    { id: 'more', label: t('common.more'), icon: <Menu size={20} />, action: () => setMobileOpen(true) },
  ];

  const isActive = (tab: NavTab) => {
    if (!tab.href) return false;
    if (tab.href === '/') return location.pathname === '/';
    return location.pathname === tab.href || location.pathname.startsWith(tab.href + '/');
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 safe-area-bottom md:hidden"
      aria-label={t('nav.dashboard')}
    >
      <div className="flex items-stretch">
        {tabs.map((tab) => {
          const active = isActive(tab);
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.action) { tab.action(); return; }
                if (tab.href) navigate(tab.href);
              }}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors',
                'active:bg-neutral-50 dark:active:bg-neutral-800',
                active
                  ? 'text-primary-600'
                  : 'text-neutral-400',
              )}
            >
              <span className={cn(active && 'text-primary-600')}>{tab.icon}</span>
              <span className={cn('text-[10px] font-medium', active ? 'text-primary-600' : 'text-neutral-500')}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
