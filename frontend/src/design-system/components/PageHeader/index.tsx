import React from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  backTo?: string;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  tabs,
  activeTab,
  onTabChange,
  backTo,
  className,
}) => {
  const navigate = useNavigate();

  return (
    <div className={cn('mb-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400 mb-3">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight size={14} className="text-neutral-300 dark:text-neutral-600 flex-shrink-0" />}
              {crumb.href ? (
                <button
                  onClick={() => navigate(crumb.href!)}
                  className="hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-neutral-900 dark:text-neutral-100 font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {backTo && (
            <button
              onClick={() => navigate(backTo)}
              aria-label={t('common.back')}
              className="mt-1 p-1 -ml-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>

      {tabs && tabs.length > 0 && (
        <div className="mt-4 -mb-px flex gap-0 border-b border-neutral-200 dark:border-neutral-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={cn(
                'relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap min-h-[44px] sm:min-h-0',
                'hover:text-neutral-700 dark:hover:text-neutral-300',
                activeTab === tab.id
                  ? 'text-primary-600 dark:text-primary-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-600 dark:after:bg-primary-400 after:rounded-t'
                  : 'text-neutral-500 dark:text-neutral-400',
              )}
            >
              {tab.label}
              {tab.count != null && (
                <span
                  className={cn(
                    'ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs rounded-full',
                    activeTab === tab.id
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
