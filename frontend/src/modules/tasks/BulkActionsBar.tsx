import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, X, Trash2, ArrowRight } from 'lucide-react';
import { t } from '@/i18n';
import { tasksApi } from '@/api/tasks';
import { taskStatusLabels } from '@/design-system/components/StatusBadge';
import type { TaskStatus } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  selectedIds: string[];
  onClear: () => void;
}

const STATUS_VALUES: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

export const BulkActionsBar: React.FC<Props> = ({ selectedIds, onClear }) => {
  const queryClient = useQueryClient();
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const bulkStatusMutation = useMutation({
    mutationFn: ({ status }: { status: TaskStatus }) => tasksApi.bulkChangeStatus(selectedIds, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(t('bulkActions.statusChanged'));
      onClear();
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: () => tasksApi.bulkDelete(selectedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(t('bulkActions.deleted'));
      onClear();
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl shadow-2xl">
      <div className="flex items-center gap-2 pr-3 border-r border-neutral-700 dark:border-neutral-300">
        <CheckSquare className="h-4 w-4" />
        <span className="text-sm font-medium">{t('bulkActions.selected', { count: selectedIds.length })}</span>
      </div>

      <div className="relative">
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
          {t('bulkActions.changeStatus')}
        </button>
        {showStatusMenu && (
          <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 min-w-[160px]">
            {STATUS_VALUES.map((status) => (
              <button
                key={status}
                onClick={() => {
                  bulkStatusMutation.mutate({ status });
                  setShowStatusMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                {taskStatusLabels[status] ?? status}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => bulkDeleteMutation.mutate()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-red-400 hover:bg-red-900/30 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        {t('bulkActions.delete')}
      </button>

      <button
        onClick={onClear}
        className="ml-2 p-1.5 rounded-md hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
