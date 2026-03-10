import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Link2,
  Unlink,
  Plus,
  ArrowRight,
  Search,
  GitBranch,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { Button } from '@/design-system/components/Button';
import { taskDependenciesApi, tasksApi, type CreateTaskDependencyRequest } from '@/api/tasks';
import type { DependencyType, TaskDependencyDto } from '@/types';
import toast from 'react-hot-toast';

interface DependencyEditorModalProps {
  taskId: string;
  taskTitle: string;
  projectId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const DEP_TYPE_OPTIONS: { value: DependencyType; labelKey: string; shortKey: string }[] = [
  { value: 'FINISH_TO_START', labelKey: 'gantt.depType.finishToStart', shortKey: 'gantt.depTypeShort.finishToStart' },
  { value: 'START_TO_START', labelKey: 'gantt.depType.startToStart', shortKey: 'gantt.depTypeShort.startToStart' },
  { value: 'FINISH_TO_FINISH', labelKey: 'gantt.depType.finishToFinish', shortKey: 'gantt.depTypeShort.finishToFinish' },
  { value: 'START_TO_FINISH', labelKey: 'gantt.depType.startToFinish', shortKey: 'gantt.depTypeShort.startToFinish' },
];

function depTypeLabel(depType: DependencyType | undefined): string {
  if (!depType) return 'FS';
  const opt = DEP_TYPE_OPTIONS.find((o) => o.value === depType);
  return opt ? t(opt.labelKey) : depType;
}

export const DependencyEditorModal: React.FC<DependencyEditorModalProps> = ({
  taskId,
  taskTitle,
  projectId,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [addingMode, setAddingMode] = useState<'predecessor' | 'successor' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepType, setSelectedDepType] = useState<DependencyType>('FINISH_TO_START');
  const [lagDays, setLagDays] = useState(0);

  // Fetch dependencies for this task
  const { data: dependencies = [], isLoading: depsLoading } = useQuery({
    queryKey: ['task-dependencies', taskId],
    queryFn: () => taskDependenciesApi.getForTask(taskId),
    enabled: isOpen && Boolean(taskId),
  });

  // Fetch tasks for the search list
  const { data: allTasks } = useQuery({
    queryKey: ['gantt', projectId],
    queryFn: () => tasksApi.getGanttData(projectId),
    enabled: isOpen && addingMode !== null,
  });

  // Split dependencies into predecessors and successors
  const { predecessors, successors } = useMemo(() => {
    const preds: TaskDependencyDto[] = [];
    const succs: TaskDependencyDto[] = [];
    for (const dep of dependencies) {
      // If this task is the successor (taskId matches dep.taskId and dependsOnTaskId is the predecessor)
      // The API returns: taskId = successor, dependsOnTaskId = predecessor
      if (dep.taskId === taskId) {
        // This task depends on dependsOnTaskId -> it's a predecessor
        preds.push(dep);
      } else if (dep.dependsOnTaskId === taskId) {
        // Something depends on this task -> it's a successor
        succs.push(dep);
      }
    }
    return { predecessors: preds, successors: succs };
  }, [dependencies, taskId]);

  // Filter tasks for adding
  const filteredTasks = useMemo(() => {
    if (!allTasks || addingMode === null) return [];
    const existingIds = new Set(dependencies.map((d) => d.taskId === taskId ? d.dependsOnTaskId : d.taskId));
    existingIds.add(taskId);

    return allTasks
      .filter((task) => !existingIds.has(task.id))
      .filter((task) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          task.title.toLowerCase().includes(q) ||
          task.code.toLowerCase().includes(q)
        );
      })
      .slice(0, 20);
  }, [allTasks, addingMode, dependencies, taskId, searchQuery]);

  const createMutation = useMutation({
    mutationFn: (data: CreateTaskDependencyRequest) => taskDependenciesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-dependencies', taskId] });
      queryClient.invalidateQueries({ queryKey: ['gantt'] });
      queryClient.invalidateQueries({ queryKey: ['TASK', taskId] });
      queryClient.invalidateQueries({ queryKey: ['project-dependencies'] });
      toast.success(t('gantt.depCreated'));
      setAddingMode(null);
      setSearchQuery('');
      setLagDays(0);
      setSelectedDepType('FINISH_TO_START');
    },
    onError: () => {
      toast.error(t('gantt.depCreateError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => taskDependenciesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-dependencies', taskId] });
      queryClient.invalidateQueries({ queryKey: ['gantt'] });
      queryClient.invalidateQueries({ queryKey: ['TASK', taskId] });
      queryClient.invalidateQueries({ queryKey: ['project-dependencies'] });
      toast.success(t('gantt.depDeleted'));
    },
    onError: () => {
      toast.error(t('gantt.depDeleteError'));
    },
  });

  const handleAddDependency = useCallback(
    (targetTaskId: string) => {
      if (addingMode === 'predecessor') {
        // This task depends on targetTask (predecessor)
        createMutation.mutate({
          predecessorTaskId: targetTaskId,
          successorTaskId: taskId,
          dependencyType: selectedDepType,
          lagDays,
        });
      } else {
        // targetTask depends on this task (successor)
        createMutation.mutate({
          predecessorTaskId: taskId,
          successorTaskId: targetTaskId,
          dependencyType: selectedDepType,
          lagDays,
        });
      }
    },
    [addingMode, createMutation, lagDays, selectedDepType, taskId],
  );

  const handleDeleteDependency = useCallback(
    (depId: string) => {
      deleteMutation.mutate(depId);
    },
    [deleteMutation],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2 min-w-0">
            <GitBranch className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {t('gantt.editDependencies')}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{taskTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {depsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-neutral-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Predecessors section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <ArrowRight size={14} className="rotate-180 text-orange-500" />
                    {t('gantt.predecessors')}
                    {predecessors.length > 0 && (
                      <span className="text-xs text-neutral-400 font-normal">({predecessors.length})</span>
                    )}
                  </h3>
                  <button
                    onClick={() => {
                      setAddingMode(addingMode === 'predecessor' ? null : 'predecessor');
                      setSearchQuery('');
                    }}
                    className={cn(
                      'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-colors',
                      addingMode === 'predecessor'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                    )}
                  >
                    <Plus size={12} />
                    {t('taskDetail.addDependency')}
                  </button>
                </div>

                {predecessors.length > 0 ? (
                  <div className="space-y-1.5">
                    {predecessors.map((dep) => (
                      <DependencyRow
                        key={dep.id}
                        dep={dep}
                        direction="predecessor"
                        onDelete={handleDeleteDependency}
                        isDeleting={deleteMutation.isPending}
                      />
                    ))}
                  </div>
                ) : (
                  addingMode !== 'predecessor' && (
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 py-2">{t('gantt.noDependencies')}</p>
                  )
                )}
              </div>

              {/* Successors section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <ArrowRight size={14} className="text-blue-500" />
                    {t('gantt.successors')}
                    {successors.length > 0 && (
                      <span className="text-xs text-neutral-400 font-normal">({successors.length})</span>
                    )}
                  </h3>
                  <button
                    onClick={() => {
                      setAddingMode(addingMode === 'successor' ? null : 'successor');
                      setSearchQuery('');
                    }}
                    className={cn(
                      'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-colors',
                      addingMode === 'successor'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                    )}
                  >
                    <Plus size={12} />
                    {t('taskDetail.addDependency')}
                  </button>
                </div>

                {successors.length > 0 ? (
                  <div className="space-y-1.5">
                    {successors.map((dep) => (
                      <DependencyRow
                        key={dep.id}
                        dep={dep}
                        direction="successor"
                        onDelete={handleDeleteDependency}
                        isDeleting={deleteMutation.isPending}
                      />
                    ))}
                  </div>
                ) : (
                  addingMode !== 'successor' && (
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 py-2">{t('gantt.noDependencies')}</p>
                  )
                )}
              </div>

              {/* Add dependency panel */}
              {addingMode !== null && (
                <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 space-y-3 bg-neutral-50 dark:bg-neutral-800/50">
                  <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <AlertTriangle size={12} className="text-amber-500" />
                    {addingMode === 'predecessor'
                      ? t('gantt.clickToCreateDep')
                      : t('gantt.clickToCreateDep')}
                  </div>

                  {/* Dep type & lag */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                        {t('taskDetail.depType')}
                      </label>
                      <select
                        value={selectedDepType}
                        onChange={(e) => setSelectedDepType(e.target.value as DependencyType)}
                        className="w-full h-8 px-2 text-xs border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {DEP_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                        {t('gantt.lagDays')}
                      </label>
                      <input
                        type="number"
                        value={lagDays}
                        onChange={(e) => setLagDays(Number(e.target.value))}
                        min={0}
                        className="w-full h-8 px-2 text-xs border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('gantt.selectTask')}
                      className="w-full h-8 pl-8 pr-3 text-xs border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>

                  {/* Task list */}
                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {filteredTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => handleAddDependency(task.id)}
                        disabled={createMutation.isPending}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                      >
                        <Link2 size={12} className="text-neutral-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-neutral-700 dark:text-neutral-300 truncate">{task.title}</p>
                          <span className="text-[10px] text-neutral-400 font-mono">{task.code}</span>
                        </div>
                        <Plus size={12} className="text-blue-500 flex-shrink-0" />
                      </button>
                    ))}
                    {filteredTasks.length === 0 && (
                      <p className="text-xs text-neutral-400 text-center py-3">{t('gantt.noDependencies')}</p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setAddingMode(null);
                      setSearchQuery('');
                    }}
                    className="w-full text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 py-1"
                  >
                    {t('gantt.cancelLinking')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-200 dark:border-neutral-700 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─── Dependency Row ─── */

interface DependencyRowProps {
  dep: TaskDependencyDto;
  direction: 'predecessor' | 'successor';
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const DependencyRow: React.FC<DependencyRowProps> = React.memo(
  ({ dep, direction, onDelete, isDeleting }) => {
    const title = direction === 'predecessor' ? dep.predecessorTaskTitle : dep.successorTaskTitle;
    const displayTitle = title || dep.dependsOnTaskId;

    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 group">
        <Link2 size={13} className="text-neutral-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-neutral-700 dark:text-neutral-300 truncate">{displayTitle}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded',
              dep.dependencyType === 'FINISH_TO_START'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : dep.dependencyType === 'START_TO_START'
                  ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : dep.dependencyType === 'FINISH_TO_FINISH'
                    ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
            )}>
              {depTypeLabel(dep.dependencyType)}
            </span>
            {(dep.lagDays ?? 0) > 0 && (
              <span className="text-[10px] text-neutral-400">+{dep.lagDays}d</span>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(dep.id)}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-all disabled:opacity-50"
          title={t('gantt.removeDependency')}
        >
          <Unlink size={13} />
        </button>
      </div>
    );
  },
);

DependencyRow.displayName = 'DependencyRow';

export default DependencyEditorModal;
