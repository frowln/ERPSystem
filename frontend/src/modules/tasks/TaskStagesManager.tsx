import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/api/tasks';
import type { TaskStage, CreateTaskStageRequest } from '@/api/tasks';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { X, Plus, GripVertical, Trash2, Edit2, Check, Palette, AlertCircle } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { Select } from '@/design-system/components/FormField';
import { useProjectOptions } from '@/hooks/useSelectOptions';
import toast from 'react-hot-toast';

interface TaskStagesManagerProps {
  projectId?: string;
  open: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#6b7280',
];

const QUERY_KEY = (projectId: string) => ['task-stages', projectId] as const;

function TaskStagesManager({ projectId: propProjectId, open, onClose }: TaskStagesManagerProps) {
  const queryClient = useQueryClient();
  const panelRef = useRef<HTMLDivElement>(null);

  const [selectedProjectId, setSelectedProjectId] = useState(propProjectId ?? '');
  const projectId = propProjectId || selectedProjectId;
  const hasProject = !!projectId;

  const { options: projectOptionsRaw } = useProjectOptions();

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [newIsClosed, setNewIsClosed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIsClosed, setEditIsClosed] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  useEffect(() => {
    if (propProjectId) setSelectedProjectId(propProjectId);
  }, [propProjectId]);

  // Auto-select first project if none selected and options available
  useEffect(() => {
    if (!propProjectId && !selectedProjectId && projectOptionsRaw.length > 0) {
      setSelectedProjectId(projectOptionsRaw[0].value);
    }
  }, [propProjectId, selectedProjectId, projectOptionsRaw]);

  const { data: stages = [], isLoading } = useQuery({
    queryKey: QUERY_KEY(projectId),
    queryFn: () => tasksApi.getStages(projectId),
    enabled: open && hasProject,
  });

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(projectId) }),
    [queryClient, projectId],
  );

  const createMutation = useMutation({
    mutationFn: (req: CreateTaskStageRequest) => tasksApi.createStage(req),
    onSuccess: () => {
      invalidate();
      setNewName('');
      setNewColor(PRESET_COLORS[0]);
      setNewIsClosed(false);
      toast.success(t('taskStages.stageCreated'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ stageId, data }: { stageId: string; data: { name?: string; color?: string; isClosed?: boolean } }) =>
      tasksApi.updateStage(stageId, data),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      toast.success(t('common.saved'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const deleteMutation = useMutation({
    mutationFn: (stageId: string) => tasksApi.deleteStage(stageId),
    onSuccess: () => {
      invalidate();
      toast.success(t('common.deleted'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const reorderMutation = useMutation({
    mutationFn: (stageIds: string[]) => tasksApi.reorderStages(projectId, stageIds),
    onSuccess: () => invalidate(),
    onError: () => toast.error(t('common.error')),
  });

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed || !hasProject) return;
    createMutation.mutate({ projectId, name: trimmed, color: newColor, isClosed: newIsClosed });
  };

  const handleDelete = (stageId: string) => {
    if (!window.confirm(t('taskStages.deleteConfirm'))) return;
    deleteMutation.mutate(stageId);
  };

  const handleEditSave = (stageId: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    updateMutation.mutate({ stageId, data: { name: trimmed, color: editColor, isClosed: editIsClosed } });
  };

  const startEdit = (stage: TaskStage) => {
    setEditingId(stage.id);
    setEditName(stage.name);
    setEditColor(stage.color ?? PRESET_COLORS[0]);
    setEditIsClosed(stage.isClosed ?? false);
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx || !hasProject) { setDragIdx(null); setDragOverIdx(null); return; }
    const reordered = [...stages];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    reorderMutation.mutate(reordered.map((s) => s.id));
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('taskStages.title')}
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-md',
          'flex flex-col',
          'bg-white dark:bg-neutral-900',
          'shadow-xl border-l border-neutral-200 dark:border-neutral-700',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Palette size={18} className="text-neutral-500 dark:text-neutral-400" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t('taskStages.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Project selector */}
        <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 block">
            {t('taskBoard.headerProject')}
          </label>
          {propProjectId ? (
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              {projectOptionsRaw.find((o) => o.value === propProjectId)?.label ?? propProjectId}
            </p>
          ) : (
            <Select
              options={projectOptionsRaw.length > 0
                ? projectOptionsRaw
                : [{ value: '', label: t('common.loading') }]
              }
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            />
          )}
          {!hasProject && (
            <p className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle size={12} />
              {t('taskStages.selectProjectHint')}
            </p>
          )}
        </div>

        {/* Stage List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
          {!hasProject && (
            <div className="text-center py-8">
              <Palette size={32} className="mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t('taskStages.selectProjectHint')}
              </p>
            </div>
          )}

          {hasProject && isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
          )}

          {hasProject && !isLoading && stages.length === 0 && (
            <div className="text-center py-8">
              <Palette size={32} className="mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t('taskStages.noStagesYet')}
              </p>
            </div>
          )}

          {hasProject && stages.map((stage, idx) => (
            <div
              key={stage.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-lg group',
                'border border-transparent',
                'transition-colors duration-150',
                'hover:bg-neutral-50 dark:hover:bg-neutral-800/60',
                dragOverIdx === idx && 'border-primary-400 bg-primary-50 dark:bg-primary-900/20',
                dragIdx === idx && 'opacity-40',
              )}
            >
              <span className="cursor-grab text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 dark:hover:text-neutral-400 active:cursor-grabbing">
                <GripVertical size={16} />
              </span>

              <span
                className="h-3 w-3 rounded-full shrink-0 ring-1 ring-black/10 dark:ring-white/10"
                style={{ backgroundColor: stage.color }}
              />

              {editingId === stage.id ? (
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditSave(stage.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 min-w-0 h-7 px-2 text-sm rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <button
                      onClick={() => handleEditSave(stage.id)}
                      disabled={updateMutation.isPending}
                      className="p-1 rounded text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 rounded text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 pl-0.5">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setEditColor(color)}
                        className={cn(
                          'h-5 w-5 rounded-full transition-all duration-150 ring-offset-1 ring-offset-white dark:ring-offset-neutral-900',
                          editColor === color ? 'ring-2 ring-primary-500 scale-110' : 'ring-1 ring-black/10 dark:ring-white/10 hover:scale-105',
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none pl-0.5">
                    <input
                      type="checkbox"
                      checked={editIsClosed}
                      onChange={(e) => setEditIsClosed(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('taskStages.closedStage')}</span>
                  </label>
                </div>
              ) : (
                <span className="flex-1 min-w-0 text-sm text-neutral-800 dark:text-neutral-200 truncate">
                  {stage.name}
                </span>
              )}

              {stage.isClosed && editingId !== stage.id && (
                <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400">
                  {t('taskStages.closedStage')}
                </span>
              )}

              {editingId !== stage.id && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(stage)}
                    disabled={updateMutation.isPending}
                    className="p-1 rounded text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors disabled:opacity-50"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(stage.id)}
                    disabled={deleteMutation.isPending}
                    className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Stage Form */}
        <div className="border-t border-neutral-200 dark:border-neutral-700 px-5 py-4 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {t('taskStages.addStage')}
          </p>

          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
            placeholder={t('taskStages.stageName')}
            disabled={!hasProject}
            className="w-full h-9 px-3 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <div className="flex items-center gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setNewColor(color)}
                disabled={!hasProject}
                className={cn(
                  'h-6 w-6 rounded-full transition-all duration-150 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900',
                  newColor === color ? 'ring-2 ring-primary-500 scale-110' : 'ring-1 ring-black/10 dark:ring-white/10 hover:scale-105',
                  !hasProject && 'opacity-50 cursor-not-allowed',
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={newIsClosed}
              onChange={(e) => setNewIsClosed(e.target.checked)}
              disabled={!hasProject}
              className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">{t('taskStages.closedStage')}</span>
          </label>

          <Button
            onClick={handleCreate}
            disabled={!newName.trim() || !hasProject}
            loading={createMutation.isPending}
            iconLeft={<Plus size={16} />}
            fullWidth
            size="sm"
          >
            {t('taskStages.addStage')}
          </Button>
        </div>
      </div>
    </>
  );
}

export default TaskStagesManager;
