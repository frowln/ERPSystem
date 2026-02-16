import React from 'react';
import {
  Inbox,
  SearchX,
  AlertTriangle,
  FolderOpen,
  FileText,
  Users,
  ClipboardList,
  Wallet,
  Truck,
  Package,
  HardHat,
  BarChart3,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { Button } from '../Button';

type EmptyStateVariant =
  | 'no-data'
  | 'no-results'
  | 'ERROR'
  | 'projects'
  | 'contracts'
  | 'documents'
  | 'tasks'
  | 'team'
  | 'finance'
  | 'warehouse'
  | 'fleet'
  | 'safety'
  | 'analytics';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const variantConfig: Record<EmptyStateVariant, { icon: React.ReactNode; titleKey: string; descKey: string }> = {
  'no-data': {
    icon: <Inbox size={40} strokeWidth={1.5} />,
    titleKey: 'table.noData',
    descKey: 'empty.createFirst',
  },
  'no-results': {
    icon: <SearchX size={40} strokeWidth={1.5} />,
    titleKey: 'empty.noResults',
    descKey: 'empty.noResultsDescription',
  },
  ERROR: {
    icon: <AlertTriangle size={40} strokeWidth={1.5} />,
    titleKey: 'errors.generic',
    descKey: 'errors.serverErrorRetry',
  },
  projects: {
    icon: <FolderOpen size={40} strokeWidth={1.5} />,
    titleKey: 'empty.noProjects',
    descKey: 'projects.emptyStateDescription',
  },
  contracts: {
    icon: <FileText size={40} strokeWidth={1.5} />,
    titleKey: 'empty.noContracts',
    descKey: 'empty.createFirst',
  },
  documents: {
    icon: <FileText size={40} strokeWidth={1.5} />,
    titleKey: 'empty.noDocuments',
    descKey: 'documents.emptyStateDescription',
  },
  tasks: {
    icon: <ClipboardList size={40} strokeWidth={1.5} />,
    titleKey: 'empty.noTasks',
    descKey: 'empty.createFirst',
  },
  team: {
    icon: <Users size={40} strokeWidth={1.5} />,
    titleKey: 'hr.emptyState',
    descKey: 'empty.createFirst',
  },
  finance: {
    icon: <Wallet size={40} strokeWidth={1.5} />,
    titleKey: 'finance.title',
    descKey: 'empty.createFirst',
  },
  warehouse: {
    icon: <Package size={40} strokeWidth={1.5} />,
    titleKey: 'warehouse.emptyState',
    descKey: 'empty.createFirst',
  },
  fleet: {
    icon: <Truck size={40} strokeWidth={1.5} />,
    titleKey: 'fleet.emptyState',
    descKey: 'empty.createFirst',
  },
  safety: {
    icon: <HardHat size={40} strokeWidth={1.5} />,
    titleKey: 'safety.emptyState',
    descKey: 'empty.createFirst',
  },
  analytics: {
    icon: <BarChart3 size={40} strokeWidth={1.5} />,
    titleKey: 'analytics.title',
    descKey: 'empty.createFirst',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'no-data',
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  const cfg = variantConfig[variant];

  return (
    <div
      className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}
      role="status"
    >
      <div className="text-neutral-300 dark:text-neutral-600 mb-4">{icon ?? cfg.icon}</div>
      <h3 className="text-base font-medium text-neutral-700 dark:text-neutral-300 mb-1">{title ?? t(cfg.titleKey)}</h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">{description ?? t(cfg.descKey)}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="secondary" size="sm" iconLeft={<Plus size={14} />} onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
