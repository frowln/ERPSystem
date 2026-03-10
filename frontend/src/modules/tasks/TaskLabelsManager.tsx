import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Plus, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { tasksApi, type TaskLabel } from '@/api/tasks';
import toast from 'react-hot-toast';

const PRESET_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'];

interface Props {
  taskId?: string;
  mode?: 'manage' | 'assign';
}

export const TaskLabelsManager: React.FC<Props> = ({ taskId, mode = 'manage' }) => {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  const { data: allLabels = [] } = useQuery<TaskLabel[]>({
    queryKey: ['task-labels'],
    queryFn: () => tasksApi.getLabels(),
  });

  const { data: taskLabels = [] } = useQuery<TaskLabel[]>({
    queryKey: ['task-labels', taskId],
    queryFn: () => tasksApi.getTaskLabels(taskId!),
    enabled: !!taskId,
  });

  const createMutation = useMutation({
    mutationFn: () => tasksApi.createLabel({ name: newName, color: newColor }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-labels'] });
      setNewName('');
      setShowCreate(false);
      toast.success(t('taskLabels.created'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.deleteLabel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-labels'] });
      toast.success(t('taskLabels.deleted'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const assignMutation = useMutation({
    mutationFn: (labelId: string) => tasksApi.assignLabel(taskId!, labelId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task-labels', taskId] }),
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const removeMutation = useMutation({
    mutationFn: (labelId: string) => tasksApi.removeLabel(taskId!, labelId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task-labels', taskId] }),
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const assignedIds = new Set(taskLabels.map((l) => l.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          <Tag className="h-4 w-4" />
          {t('taskLabels.title')}
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4 text-neutral-500" />
        </button>
      </div>

      {showCreate && (
        <div className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('taskLabels.namePlaceholder')}
            className="flex-1 px-2 py-1 text-sm border rounded bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100"
          />
          <div className="flex gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={cn('w-5 h-5 rounded-full border-2', newColor === c ? 'border-neutral-900 dark:border-white' : 'border-transparent')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!newName}
            className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {t('common.save')}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {allLabels.map((label) => {
          const isAssigned = assignedIds.has(label.id);
          return (
            <button
              key={label.id}
              onClick={() => {
                if (!taskId) return;
                if (isAssigned) removeMutation.mutate(label.id);
                else assignMutation.mutate(label.id);
              }}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all border',
                isAssigned
                  ? 'border-transparent text-white'
                  : 'border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400',
              )}
              style={isAssigned ? { backgroundColor: label.color } : undefined}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color }} />
              {label.name}
              {mode === 'manage' && !taskId && (
                <span
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(label.id); }}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
        {allLabels.length === 0 && (
          <p className="text-xs text-neutral-400">{t('taskLabels.empty')}</p>
        )}
      </div>
    </div>
  );
};
