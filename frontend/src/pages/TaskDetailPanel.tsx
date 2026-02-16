import React, { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Calendar,
  Clock,
  User,
  Tag,
  Link2,
  MessageSquare,
  CheckSquare,
  Activity,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { Button } from '@/design-system/components/Button';
import { EmptyState } from '@/design-system/components/EmptyState';
import {
  StatusBadge,
  taskStatusColorMap,
  taskStatusLabels,
} from '@/design-system/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { AssigneeAvatar } from '@/components/AssigneeAvatar';
import { formatDate, formatRelativeTime } from '@/lib/format';
import { tasksApi, type TaskDetail, type TaskComment, type TaskActivity as TaskActivityType } from '@/api/tasks';
import type { TaskStatus, ProjectTask, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

interface TaskDetailPanelProps {
  taskId: string;
  onClose: () => void;
}

type PanelTab = 'comments' | 'subtasks' | 'activity' | 'dependencies';

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
      queryClient.invalidateQueries({ queryKey: ['TASK', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

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

  return (
    <>
      <div
        className="fixed inset-0 bg-neutral-950/20 z-40 animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 bottom-0 w-[560px] max-w-full bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right overflow-hidden">
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
                className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
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
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono text-neutral-400">{detail.code}</span>
                <StatusBadge
                  status={detail.status}
                  colorMap={taskStatusColorMap}
                  label={taskStatusLabels[detail.status] ?? detail.status}
                />
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-4">
                <h2 className="text-lg font-semibold text-neutral-900">{detail.title}</h2>

                {detail.description && (
                  <div className="mt-3 text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none">
                    {detail.description}
                  </div>
                )}

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 block">
                      {t('taskDetail.priority')}
                    </label>
                    <PriorityBadge priority={detail.priority} size="md" />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 block">
                      {t('taskDetail.project')}
                    </label>
                    <span className="text-sm text-neutral-700">{detail.projectName ?? '—'}</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <User size={10} /> {t('taskDetail.assignee')}
                    </label>
                    {detail.assigneeName ? (
                      <AssigneeAvatar name={detail.assigneeName} size="sm" showName />
                    ) : (
                      <span className="text-sm text-neutral-400">{t('taskDetail.unassigned')}</span>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 block">
                      {t('taskDetail.reporter')}
                    </label>
                    {detail.reporterName ? (
                      <AssigneeAvatar name={detail.reporterName} size="sm" showName />
                    ) : (
                      <span className="text-sm text-neutral-400">—</span>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Calendar size={10} /> {t('taskDetail.plannedDates')}
                    </label>
                    <span className="text-sm text-neutral-700">
                      {formatDate(detail.plannedStartDate)} — {formatDate(detail.plannedEndDate)}
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 block">
                      {t('taskDetail.actualDates')}
                    </label>
                    <span className="text-sm text-neutral-700">
                      {formatDate(detail.actualStartDate)} — {formatDate(detail.actualEndDate)}
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Clock size={10} /> {t('taskDetail.planFactHours')}
                    </label>
                    <span className="text-sm text-neutral-700">
                      {detail.estimatedHours ?? '—'} / {detail.actualHours ?? '—'} {t('taskDetail.hoursUnit')}
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 block">
                      {t('taskDetail.wbsCode')}
                    </label>
                    <span className="text-sm font-mono text-neutral-700">{detail.wbsCode ?? '—'}</span>
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
                          className="px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-200">
                <div className="flex border-b border-neutral-100">
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
                          : 'text-neutral-500 hover:text-neutral-700',
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
                                  <span className="text-sm font-semibold text-neutral-800">
                                    {comment.authorName || t('taskBoard.unassigned')}
                                  </span>
                                  <span className="text-[11px] text-neutral-400">
                                    {formatRelativeTime(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-neutral-600 mt-0.5 whitespace-pre-wrap">
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
                          className="flex-1 h-9 px-3 text-sm bg-neutral-100 border-0 rounded-lg placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
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
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                          >
                            {subtaskStatusIcon(sub.status)}
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  'text-sm',
                                  sub.status === 'DONE'
                                    ? 'text-neutral-400 line-through'
                                    : 'text-neutral-700',
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
                    </div>
                  )}

                  {activeTab === 'activity' && (
                    <div className="space-y-3">
                      {detail.activities.length > 0 ? (
                        detail.activities.map((act: TaskActivityType) => (
                          <div key={act.id} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Activity size={12} className="text-neutral-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-neutral-700">
                                <span className="font-medium">{act.userName}</span>{' '}
                                <span className="text-neutral-500">{act.action}</span>
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
                        <p className="text-sm text-neutral-400 text-center py-4">{t('taskDetail.noActivity')}</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'dependencies' && (
                    <div className="space-y-2">
                      {detail.dependencies.length > 0 ? (
                        detail.dependencies.map((dep) => (
                          <div
                            key={dep.id}
                            className="flex items-center gap-3 p-2.5 rounded-lg bg-neutral-50"
                          >
                            <Link2 size={14} className="text-neutral-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-neutral-700">
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
                        <p className="text-sm text-neutral-400 text-center py-4">{t('taskDetail.noDependencies')}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};
