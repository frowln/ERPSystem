import React, { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Calendar,
  Clock,
  User,
  Users,
  UserPlus,
  Eye,
  Tag,
  Link2,
  MessageSquare,
  CheckSquare,
  Activity,
  Send,
  Shield,
  ArrowRightLeft,
  Trash2,
  Globe,
  Lock,
  Building2,
  Pencil,
  Plus,
  Info,
  Star,
} from 'lucide-react';
import { Paperclip } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { Button } from '@/design-system/components/Button';
import { EmptyState } from '@/design-system/components/EmptyState';
import { FileAttachmentPanel } from '@/design-system/components/FileAttachmentPanel';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import {
  StatusBadge,
  taskStatusColorMap,
  taskStatusLabels,
} from '@/design-system/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { AssigneeAvatar } from '@/components/AssigneeAvatar';
import { formatDate, formatRelativeTime } from '@/lib/format';
import { tasksApi, taskFavoritesApi, type TaskDetail, type TaskComment, type TaskActivity as TaskActivityType, type TaskParticipant, type ParticipantRole } from '@/api/tasks';
import type { TaskStatus, TaskPriority, ProjectTask, PaginatedResponse } from '@/types';
import { useUserOptions, useProjectOptions } from '@/hooks/useSelectOptions';
import toast from 'react-hot-toast';

interface TaskDetailPanelProps {
  taskId: string;
  onClose: () => void;
}

type PanelTab = 'comments' | 'subtasks' | 'files' | 'activity' | 'dependencies';

const visibilityConfig = {
  PARTICIPANTS_ONLY: { icon: Lock, label: () => t('taskDetail.visibilityParticipants'), color: 'text-amber-600 dark:text-amber-400' },
  PROJECT: { icon: Building2, label: () => t('taskDetail.visibilityProject'), color: 'text-blue-600 dark:text-blue-400' },
  ORGANIZATION: { icon: Globe, label: () => t('taskDetail.visibilityOrganization'), color: 'text-green-600 dark:text-green-400' },
} as const;

function subtaskStatusIcon(status: TaskStatus) {
  if (status === 'DONE') return <CheckSquare size={14} className="text-green-500" />;
  if (status === 'IN_PROGRESS') return <CheckSquare size={14} className="text-yellow-500" />;
  return <CheckSquare size={14} className="text-neutral-300" />;
}

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  taskId,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<PanelTab>('comments');
  const [newComment, setNewComment] = useState('');
  const [progress, setProgress] = useState(0);
  const [isFavorite, setIsFavorite] = useState(() => taskFavoritesApi.isFavorite(taskId));

  // Participant add modal
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [addPartUserId, setAddPartUserId] = useState('');
  const [addPartRole, setAddPartRole] = useState<ParticipantRole>('CO_EXECUTOR');

  // Delegation modal
  const [showDelegate, setShowDelegate] = useState(false);
  const [delegateUserId, setDelegateUserId] = useState('');
  const [delegateComment, setDelegateComment] = useState('');

  // Edit task modal
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'NORMAL' as TaskPriority,
    status: 'TODO' as TaskStatus,
    plannedStartDate: '',
    plannedEndDate: '',
    assigneeId: '',
    projectId: '',
  });

  // Create subtask inline
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const { options: userOptionsRaw } = useUserOptions();
  const { options: projectOptionsRaw } = useProjectOptions();

  const {
    data: detail,
    isLoading,
    isError,
    refetch,
  } = useQuery<TaskDetail>({
    queryKey: ['TASK', taskId],
    queryFn: () => tasksApi.getTask(taskId),
    enabled: Boolean(taskId),
  });

  const { data: subtasks = [] } = useQuery<ProjectTask[]>({
    queryKey: ['TASK_SUBTASKS', taskId],
    queryFn: () => tasksApi.getSubtasks(taskId),
    enabled: Boolean(taskId),
  });

  useEffect(() => {
    setProgress(detail?.progress ?? 0);
  }, [detail?.id, detail?.progress]);

  useEffect(() => {
    setIsFavorite(taskFavoritesApi.isFavorite(taskId));
  }, [taskId]);

  const handleToggleFavorite = useCallback(() => {
    const added = taskFavoritesApi.toggle(taskId);
    setIsFavorite(added);
    toast.success(added ? t('taskCard.addedToFavorites') : t('taskCard.removedFromFavorites'));
  }, [taskId]);

  const invalidateTask = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['TASK', taskId] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }, [queryClient, taskId]);

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => tasksApi.addComment(taskId, content),
    onSuccess: (comment) => {
      queryClient.setQueryData<TaskDetail>(['TASK', taskId], (previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          comments: [...previous.comments, comment],
        };
      });
      setNewComment('');
    },
    onError: () => {
      toast.error(t('errors.serverErrorRetry'));
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: (nextProgress: number) => tasksApi.updateProgress(taskId, nextProgress),
    onMutate: async (nextProgress) => {
      await queryClient.cancelQueries({ queryKey: ['TASK', taskId] });
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      const previousDetail = queryClient.getQueryData<TaskDetail>(['TASK', taskId]);
      const previousList = queryClient.getQueryData<PaginatedResponse<ProjectTask>>(['tasks']);

      if (previousDetail) {
        queryClient.setQueryData<TaskDetail>(['TASK', taskId], {
          ...previousDetail,
          progress: nextProgress,
        });
      }

      if (previousList) {
        queryClient.setQueryData<PaginatedResponse<ProjectTask>>(['tasks'], {
          ...previousList,
          content: previousList.content.map((task) =>
            task.id === taskId ? { ...task, progress: nextProgress } : task,
          ),
        });
      }

      return { previousDetail, previousList };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(['TASK', taskId], context.previousDetail);
      }
      if (context?.previousList) {
        queryClient.setQueryData(['tasks'], context.previousList);
      }
      toast.error(t('errors.serverErrorRetry'));
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<TaskDetail>(['TASK', taskId], (previous) => {
        if (!previous) return updatedTask;
        return {
          ...previous,
          ...updatedTask,
          comments: previous.comments,
          subtasks: previous.subtasks,
          activities: previous.activities,
          dependencies: previous.dependencies,
          tags: updatedTask.tags.length > 0 ? updatedTask.tags : previous.tags,
        };
      });

      queryClient.setQueryData<PaginatedResponse<ProjectTask>>(['tasks'], (previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          content: previous.content.map((task) =>
            task.id === taskId
              ? {
                ...task,
                progress: updatedTask.progress,
                status: updatedTask.status,
              }
              : task,
          ),
        };
      });
    },
    onSettled: () => {
      invalidateTask();
    },
  });

  const addParticipantMutation = useMutation({
    mutationFn: (data: { userId: string; userName: string; role: ParticipantRole }) =>
      tasksApi.addParticipant(taskId, data),
    onSuccess: () => {
      toast.success(t('taskDetail.participantAdded'));
      setShowAddParticipant(false);
      setAddPartUserId('');
      setAddPartRole('CO_EXECUTOR');
      invalidateTask();
    },
  });

  const removeParticipantMutation = useMutation({
    mutationFn: (data: { userId: string; role: ParticipantRole }) =>
      tasksApi.removeParticipant(taskId, data.userId, data.role),
    onSuccess: () => {
      toast.success(t('taskDetail.participantRemoved'));
      invalidateTask();
    },
  });

  const delegateMutation = useMutation({
    mutationFn: (data: { delegateToId: string; delegateToName: string; comment?: string }) =>
      tasksApi.delegateTask(taskId, data.delegateToId, data.delegateToName, data.comment),
    onSuccess: () => {
      toast.success(t('taskDetail.delegateSuccess'));
      setShowDelegate(false);
      setDelegateUserId('');
      setDelegateComment('');
      invalidateTask();
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: (data: Parameters<typeof tasksApi.updateTask>[1]) =>
      tasksApi.updateTask(taskId, data),
    onSuccess: () => {
      toast.success(t('common.saved'));
      setShowEdit(false);
      invalidateTask();
    },
    onError: () => {
      toast.error(t('errors.serverErrorRetry'));
    },
  });

  const createSubtaskMutation = useMutation({
    mutationFn: (title: string) =>
      tasksApi.createTask({
        title,
        parentTaskId: taskId,
        projectId: detail?.projectId,
        status: 'TODO',
        priority: 'NORMAL',
      }),
    onSuccess: () => {
      toast.success(t('taskDetail.subtaskCreated'));
      setNewSubtaskTitle('');
      setShowSubtaskForm(false);
      queryClient.invalidateQueries({ queryKey: ['TASK_SUBTASKS', taskId] });
      invalidateTask();
    },
    onError: () => {
      toast.error(t('errors.serverErrorRetry'));
    },
  });

  const openEditModal = useCallback(() => {
    if (!detail) return;
    setEditForm({
      title: detail.title,
      description: detail.description ?? '',
      priority: detail.priority,
      status: detail.status,
      plannedStartDate: detail.plannedStartDate ?? '',
      plannedEndDate: detail.plannedEndDate ?? '',
      assigneeId: detail.assigneeId ?? '',
      projectId: detail.projectId ?? '',
    });
    setShowEdit(true);
  }, [detail]);

  const handleSaveEdit = useCallback(() => {
    const assigneeName = editForm.assigneeId
      ? userOptionsRaw.find((o) => o.value === editForm.assigneeId)?.label
      : undefined;
    updateTaskMutation.mutate({
      title: editForm.title.trim(),
      description: editForm.description.trim() || undefined,
      priority: editForm.priority,
      status: editForm.status,
      plannedStartDate: editForm.plannedStartDate || undefined,
      plannedEndDate: editForm.plannedEndDate || undefined,
      assigneeId: editForm.assigneeId || undefined,
      assigneeName,
      projectId: editForm.projectId || undefined,
    });
  }, [editForm, userOptionsRaw, updateTaskMutation]);

  const handleCreateSubtask = useCallback(() => {
    const title = newSubtaskTitle.trim();
    if (!title) return;
    createSubtaskMutation.mutate(title);
  }, [newSubtaskTitle, createSubtaskMutation]);

  const handleAddComment = useCallback(() => {
    const content = newComment.trim();
    if (!content || addCommentMutation.isPending) return;
    addCommentMutation.mutate(content);
  }, [addCommentMutation, newComment]);

  const handleProgressCommit = useCallback(() => {
    if (!detail) return;
    if (progress === detail.progress || updateProgressMutation.isPending) return;
    updateProgressMutation.mutate(progress);
  }, [detail, progress, updateProgressMutation]);

  const handleAddParticipant = useCallback(() => {
    if (!addPartUserId) return;
    const emp = userOptionsRaw.find((o) => o.value === addPartUserId);
    addParticipantMutation.mutate({
      userId: addPartUserId,
      userName: emp?.label ?? '',
      role: addPartRole,
    });
  }, [addPartUserId, addPartRole, userOptionsRaw, addParticipantMutation]);

  const handleDelegate = useCallback(() => {
    if (!delegateUserId) return;
    const emp = userOptionsRaw.find((o) => o.value === delegateUserId);
    delegateMutation.mutate({
      delegateToId: delegateUserId,
      delegateToName: emp?.label ?? '',
      comment: delegateComment.trim() || undefined,
    });
  }, [delegateUserId, delegateComment, userOptionsRaw, delegateMutation]);

  const participantsByRole = (role: ParticipantRole) =>
    (detail?.participants ?? []).filter((p) => p.role === role);

  return (
    <>
      <div
        className="fixed inset-0 bg-neutral-950/20 z-40 animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 bottom-0 w-[560px] max-w-full bg-white dark:bg-neutral-900 shadow-2xl z-50 flex flex-col animate-slide-in-right overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <div className="w-4 h-4 border-2 border-neutral-200 border-t-primary-600 rounded-full animate-spin" />
              {t('common.loading')}
            </div>
          </div>
        ) : isError || !detail ? (
          <div className="p-5">
            <div className="flex items-center justify-end mb-2">
              <button
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>
            <EmptyState
              variant="ERROR"
              actionLabel={t('errors.tryAgain')}
              onAction={() => refetch()}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono text-neutral-400">{detail.code}</span>
                <StatusBadge
                  status={detail.status}
                  colorMap={taskStatusColorMap}
                  label={taskStatusLabels[detail.status] ?? detail.status}
                />
                {/* Visibility badge */}
                {detail.visibility && (() => {
                  const vis = visibilityConfig[detail.visibility] ?? visibilityConfig.PARTICIPANTS_ONLY;
                  const VisIcon = vis.icon;
                  return (
                    <span className={cn('flex items-center gap-1 text-[10px]', vis.color)} title={t('taskDetail.visibilityHint')}>
                      <VisIcon size={11} />
                      {vis.label()}
                    </span>
                  );
                })()}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleToggleFavorite}
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    isFavorite
                      ? 'text-amber-400 hover:text-amber-500'
                      : 'text-neutral-400 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30',
                  )}
                  title={isFavorite ? t('taskCard.removeFavorite') : t('taskCard.addFavorite')}
                >
                  <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={openEditModal}
                  className="p-1.5 text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-md transition-colors"
                  title={t('taskDetail.editTask')}
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                  aria-label={t('common.close')}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-4">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{detail.title}</h2>

                {detail.description && (
                  <div className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none">
                    {detail.description}
                  </div>
                )}

                {/* ─── Participants section (4-role model) ─── */}
                <div className="mt-5 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={12} /> {t('taskDetail.participants')}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {detail.delegatedToName && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                          <ArrowRightLeft size={10} />
                          {t('taskDetail.delegatedTo', { name: detail.delegatedToName })}
                        </span>
                      )}
                      <button
                        onClick={() => setShowDelegate(true)}
                        className="p-1 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                        title={t('taskDetail.delegateTask')}
                      >
                        <ArrowRightLeft size={13} />
                      </button>
                      <button
                        onClick={() => setShowAddParticipant(true)}
                        className="p-1 text-neutral-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                        title={t('taskDetail.addParticipant')}
                      >
                        <UserPlus size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Постановщик (Creator) */}
                  <ParticipantRow
                    icon={User}
                    iconColor="text-green-600 dark:text-green-400"
                    label={t('taskDetail.roleCreator')}
                  >
                    {detail.reporterName ? (
                      <AssigneeAvatar name={detail.reporterName} size="sm" showName />
                    ) : (
                      <span className="text-sm text-neutral-400 dark:text-neutral-500">—</span>
                    )}
                  </ParticipantRow>

                  {/* Ответственный (Responsible) */}
                  <ParticipantRow
                    icon={Shield}
                    iconColor="text-blue-600 dark:text-blue-400"
                    label={t('taskDetail.roleResponsible')}
                  >
                    {participantsByRole('RESPONSIBLE').length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {participantsByRole('RESPONSIBLE').map((p) => (
                          <ParticipantChip
                            key={p.id}
                            participant={p}
                            onRemove={() => removeParticipantMutation.mutate({ userId: p.userId, role: p.role })}
                          />
                        ))}
                      </div>
                    ) : detail.assigneeName ? (
                      <AssigneeAvatar name={detail.assigneeName} size="sm" showName />
                    ) : (
                      <span className="text-sm text-neutral-400 dark:text-neutral-500 italic">{t('taskDetail.unassigned')}</span>
                    )}
                  </ParticipantRow>

                  {/* Соисполнители (Co-executors) */}
                  <ParticipantRow
                    icon={Users}
                    iconColor="text-amber-600 dark:text-amber-400"
                    label={t('taskDetail.roleCoExecutors')}
                    empty={participantsByRole('CO_EXECUTOR').length === 0}
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {participantsByRole('CO_EXECUTOR').map((p) => (
                        <ParticipantChip
                          key={p.id}
                          participant={p}
                          onRemove={() => removeParticipantMutation.mutate({ userId: p.userId, role: p.role })}
                        />
                      ))}
                    </div>
                  </ParticipantRow>

                  {/* Наблюдатели (Observers) */}
                  <ParticipantRow
                    icon={Eye}
                    iconColor="text-neutral-400 dark:text-neutral-500"
                    label={t('taskDetail.roleObservers')}
                    empty={participantsByRole('OBSERVER').length === 0}
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {participantsByRole('OBSERVER').map((p) => (
                        <ParticipantChip
                          key={p.id}
                          participant={p}
                          onRemove={() => removeParticipantMutation.mutate({ userId: p.userId, role: p.role })}
                        />
                      ))}
                    </div>
                  </ParticipantRow>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1 block">
                      {t('taskDetail.priority')}
                    </label>
                    <PriorityBadge priority={detail.priority} size="md" />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1 block">
                      {t('taskDetail.project')}
                    </label>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{detail.projectName ?? '—'}</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Calendar size={10} /> {t('taskDetail.plannedDates')}
                    </label>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      {formatDate(detail.plannedStartDate)} — {formatDate(detail.plannedEndDate)}
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1 block">
                      {t('taskDetail.actualDates')}
                    </label>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      {formatDate(detail.actualStartDate)} — {formatDate(detail.actualEndDate)}
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Clock size={10} /> {t('taskDetail.planFactHours')}
                    </label>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      {detail.estimatedHours ?? '—'} / {detail.actualHours ?? '—'} {t('taskDetail.hoursUnit')}
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1 block">
                      {t('taskDetail.wbsCode')}
                    </label>
                    <span className="text-sm font-mono text-neutral-700 dark:text-neutral-300">{detail.wbsCode ?? '—'}</span>
                  </div>
                </div>

                <div className="mt-5">
                  <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">
                    {t('taskDetail.progress')} — {progress}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    onMouseUp={handleProgressCommit}
                    onTouchEnd={handleProgressCommit}
                    onBlur={handleProgressCommit}
                    disabled={updateProgressMutation.isPending}
                    className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-primary-600 disabled:cursor-not-allowed"
                  />
                </div>

                {detail.tags.length > 0 && (
                  <div className="mt-4">
                    <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Tag size={10} /> {t('taskDetail.tags')}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex border-b border-neutral-100 dark:border-neutral-800">
                  {(
                    [
                      {
                        id: 'comments',
                        label: t('taskDetail.tabComments'),
                        icon: MessageSquare,
                        count: detail.comments.length,
                      },
                      {
                        id: 'subtasks',
                        label: t('taskDetail.tabSubtasks'),
                        icon: CheckSquare,
                        count: subtasks.length,
                      },
                      {
                        id: 'files',
                        label: t('taskDetail.tabFiles'),
                        icon: Paperclip,
                        count: 0,
                      },
                      {
                        id: 'activity',
                        label: t('taskDetail.tabActivity'),
                        icon: Activity,
                        count: detail.activities.length,
                      },
                      {
                        id: 'dependencies',
                        label: t('taskDetail.tabDependencies'),
                        icon: Link2,
                        count: detail.dependencies.length,
                      },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap',
                        activeTab === tab.id
                          ? 'text-primary-600 border-b-2 border-primary-600 -mb-px'
                          : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
                      )}
                    >
                      <tab.icon size={13} />
                      {tab.label}
                      {tab.count > 0 && (
                        <span className="ml-0.5 text-[10px] text-neutral-400">({tab.count})</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="px-5 py-4">
                  {activeTab === 'comments' && (
                    <div>
                      {detail.comments.length > 0 ? (
                        <div className="space-y-4 mb-4">
                          {detail.comments.map((comment: TaskComment) => (
                            <div key={comment.id} className="flex gap-3">
                              <AssigneeAvatar name={comment.authorName || t('taskBoard.unassigned')} size="sm" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                                    {comment.authorName || t('taskBoard.unassigned')}
                                  </span>
                                  <span className="text-[11px] text-neutral-400">
                                    {formatRelativeTime(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5 whitespace-pre-wrap">
                                  {comment.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-400 text-center py-4">{t('taskDetail.noComments')}</p>
                      )}

                      <div className="flex gap-2 mt-3">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                          placeholder={t('taskDetail.writeComment')}
                          className="flex-1 h-9 px-3 text-sm bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-100 border-0 rounded-lg placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800"
                        />
                        <Button
                          size="sm"
                          onClick={handleAddComment}
                          iconLeft={<Send size={13} />}
                          disabled={addCommentMutation.isPending || newComment.trim().length === 0}
                        >
                          {t('taskDetail.send')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'subtasks' && (
                    <div className="space-y-2">
                      {subtasks.length > 0 ? (
                        subtasks.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            {subtaskStatusIcon(sub.status)}
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  'text-sm',
                                  sub.status === 'DONE'
                                    ? 'text-neutral-400 line-through'
                                    : 'text-neutral-700 dark:text-neutral-300',
                                )}
                              >
                                {sub.title}
                              </p>
                              <span className="text-[10px] text-neutral-400 font-mono">{sub.code}</span>
                            </div>
                            {sub.assigneeName && (
                              <AssigneeAvatar name={sub.assigneeName} size="xs" />
                            )}
                            {sub.progress > 0 && sub.progress < 100 && (
                              <span className="text-[10px] text-neutral-400 tabular-nums">
                                {sub.progress}%
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-neutral-400 text-center py-4">{t('taskDetail.noSubtasks')}</p>
                      )}

                      {/* Add subtask form */}
                      {showSubtaskForm ? (
                        <div className="flex gap-2 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                          <input
                            type="text"
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateSubtask()}
                            placeholder={t('taskDetail.subtaskTitle')}
                            autoFocus
                            className="flex-1 h-9 px-3 text-sm bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-100 border-0 rounded-lg placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800"
                          />
                          <Button
                            size="sm"
                            onClick={handleCreateSubtask}
                            disabled={!newSubtaskTitle.trim() || createSubtaskMutation.isPending}
                            loading={createSubtaskMutation.isPending}
                          >
                            {t('common.create')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setShowSubtaskForm(false); setNewSubtaskTitle(''); }}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowSubtaskForm(true)}
                          className="flex items-center gap-1.5 w-full px-2.5 py-2 text-xs font-medium text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors mt-1"
                        >
                          <Plus size={13} />
                          {t('taskDetail.addSubtaskBtn')}
                        </button>
                      )}
                    </div>
                  )}

                  {activeTab === 'files' && (
                    <FileAttachmentPanel entityType="TASK" entityId={taskId} />
                  )}

                  {activeTab === 'activity' && (
                    <div className="space-y-3">
                      {detail.activities.length > 0 ? (
                        detail.activities.map((act: TaskActivityType) => (
                          <div key={act.id} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Activity size={12} className="text-neutral-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                <span className="font-medium">{act.userName}</span>{' '}
                                <span className="text-neutral-500 dark:text-neutral-400">{act.action}</span>
                                {act.detail && (
                                  <span className="text-neutral-400 ml-1">({act.detail})</span>
                                )}
                              </p>
                              <span className="text-[10px] text-neutral-400">
                                {formatRelativeTime(act.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                            <Activity size={18} className="text-neutral-300 dark:text-neutral-600" />
                          </div>
                          <p className="text-sm text-neutral-400 dark:text-neutral-500">{t('taskDetail.noActivity')}</p>
                          <p className="text-xs text-neutral-300 dark:text-neutral-600 mt-1">{t('taskDetail.noActivityHint')}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'dependencies' && (
                    <div className="space-y-2">
                      {detail.dependencies.length > 0 ? (
                        detail.dependencies.map((dep) => (
                          <div
                            key={dep.id}
                            className="flex items-center gap-3 p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800"
                          >
                            <Link2 size={14} className="text-neutral-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                {dep.dependsOnTaskTitle || dep.dependsOnTaskId}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono text-neutral-400">
                                  {dep.dependsOnTaskCode || dep.dependsOnTaskId}
                                </span>
                                <span className="text-[10px] text-neutral-400">
                                  {dep.type === 'finish_to_start'
                                    ? t('taskDetail.depFinishToStart')
                                    : dep.type === 'start_to_start'
                                      ? t('taskDetail.depStartToStart')
                                      : t('taskDetail.depFinishToFinish')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                            <Link2 size={18} className="text-neutral-300 dark:text-neutral-600" />
                          </div>
                          <p className="text-sm text-neutral-400 dark:text-neutral-500">{t('taskDetail.noDependencies')}</p>
                          <p className="text-xs text-neutral-300 dark:text-neutral-600 mt-1">{t('taskDetail.noDependenciesHint')}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Add Participant Modal ─── */}
      <Modal
        open={showAddParticipant}
        onClose={() => setShowAddParticipant(false)}
        title={t('taskDetail.addParticipantTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddParticipant(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAddParticipant}
              loading={addParticipantMutation.isPending}
              disabled={!addPartUserId}
            >
              {t('common.add')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('taskDetail.selectUser')} required>
            <Select
              options={[
                { value: '', label: t('taskDetail.selectUser') },
                ...userOptionsRaw,
              ]}
              value={addPartUserId}
              onChange={(e) => setAddPartUserId(e.target.value)}
            />
          </FormField>
          <FormField label={t('taskDetail.selectRole')} required>
            <Select
              options={[
                { value: 'RESPONSIBLE', label: t('taskDetail.roleResponsible') },
                { value: 'CO_EXECUTOR', label: t('taskDetail.roleCoExecutor') },
                { value: 'OBSERVER', label: t('taskDetail.roleObserver') },
              ]}
              value={addPartRole}
              onChange={(e) => setAddPartRole(e.target.value as ParticipantRole)}
            />
          </FormField>
        </div>
      </Modal>

      {/* ─── Delegate Modal ─── */}
      <Modal
        open={showDelegate}
        onClose={() => setShowDelegate(false)}
        title={t('taskDetail.delegateTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDelegate(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleDelegate}
              loading={delegateMutation.isPending}
              disabled={!delegateUserId}
            >
              {t('taskDetail.delegateTask')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('taskDetail.delegateHint')}
          </p>
          <FormField label={t('taskDetail.selectUser')} required>
            <Select
              options={[
                { value: '', label: t('taskDetail.selectUser') },
                ...userOptionsRaw,
              ]}
              value={delegateUserId}
              onChange={(e) => setDelegateUserId(e.target.value)}
            />
          </FormField>
          <FormField label={t('taskDetail.delegateComment')}>
            <Textarea
              value={delegateComment}
              onChange={(e) => setDelegateComment(e.target.value)}
              rows={3}
            />
          </FormField>
        </div>
      </Modal>

      {/* ─── Edit Task Modal ─── */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title={t('taskDetail.editTask')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEdit(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSaveEdit}
              loading={updateTaskMutation.isPending}
              disabled={!editForm.title.trim()}
            >
              {t('common.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('taskBoard.headerTitle')} required>
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </FormField>
          <FormField label={t('common.description')}>
            <Textarea
              value={editForm.description}
              onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('taskBoard.headerProject')}>
              <Select
                options={[
                  { value: '', label: t('common.notSelected') },
                  ...projectOptionsRaw,
                ]}
                value={editForm.projectId}
                onChange={(e) => setEditForm((prev) => ({ ...prev, projectId: e.target.value }))}
              />
            </FormField>
            <FormField label={t('taskBoard.headerAssignee')}>
              <Select
                options={[
                  { value: '', label: t('taskBoard.unassigned') },
                  ...userOptionsRaw,
                ]}
                value={editForm.assigneeId}
                onChange={(e) => setEditForm((prev) => ({ ...prev, assigneeId: e.target.value }))}
              />
            </FormField>
            <FormField label={t('taskBoard.headerPriority')}>
              <Select
                options={[
                  { value: 'LOW', label: t('taskBoard.priorityLow') },
                  { value: 'NORMAL', label: t('taskBoard.priorityNormal') },
                  { value: 'HIGH', label: t('taskBoard.priorityHigh') },
                  { value: 'URGENT', label: t('taskBoard.priorityUrgent') },
                  { value: 'CRITICAL', label: t('taskBoard.priorityCritical') },
                ]}
                value={editForm.priority}
                onChange={(e) => setEditForm((prev) => ({ ...prev, priority: e.target.value as TaskPriority }))}
              />
            </FormField>
            <FormField label={t('taskBoard.headerStatus')}>
              <Select
                options={[
                  { value: 'BACKLOG', label: t('taskBoard.columnBacklog') },
                  { value: 'TODO', label: t('taskBoard.columnTodo') },
                  { value: 'IN_PROGRESS', label: t('taskBoard.columnInProgress') },
                  { value: 'IN_REVIEW', label: t('taskBoard.columnInReview') },
                  { value: 'DONE', label: t('taskBoard.columnDone') },
                  { value: 'CANCELLED', label: t('common.cancelled') },
                ]}
                value={editForm.status}
                onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value as TaskStatus }))}
              />
            </FormField>
            <FormField label={t('common.startDate')}>
              <Input
                type="date"
                value={editForm.plannedStartDate}
                onChange={(e) => setEditForm((prev) => ({ ...prev, plannedStartDate: e.target.value }))}
              />
            </FormField>
            <FormField label={t('taskBoard.headerDeadline')}>
              <Input
                type="date"
                value={editForm.plannedEndDate}
                onChange={(e) => setEditForm((prev) => ({ ...prev, plannedEndDate: e.target.value }))}
              />
            </FormField>
          </div>
        </div>
      </Modal>
    </>
  );
};

/* ─── Helper components ─── */

function ParticipantRow({
  icon: Icon,
  iconColor,
  label,
  children,
  empty,
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  if (empty) return null;
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <Icon size={13} className={cn(iconColor, 'flex-shrink-0')} />
      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 w-24 flex-shrink-0 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function ParticipantChip({
  participant,
  onRemove,
}: {
  participant: TaskParticipant;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 group">
      <AssigneeAvatar name={participant.userName} size="sm" showName />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-red-500 transition-all"
        title={t('taskDetail.removeParticipant')}
      >
        <Trash2 size={11} />
      </button>
    </span>
  );
}
