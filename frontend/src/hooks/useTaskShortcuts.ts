import { useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { t } from '@/i18n';
import { tasksApi } from '@/api/tasks';
import { useAuthStore } from '@/stores/authStore';
import type { TaskStatus, TaskPriority, ProjectTask, PaginatedResponse } from '@/types';
import type { TaskDetail } from '@/api/tasks';

const STATUS_CYCLE: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITY_CYCLE: TaskPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'];

function isInputTarget(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  );
}

interface UseTaskShortcutsOptions {
  taskId: string | null;
  onEdit?: (taskId: string) => void;
  onClose?: () => void;
}

/**
 * Linear-style single-letter keyboard shortcuts for task management.
 *
 * S — cycle status
 * P — cycle priority
 * I — assign to self
 * E — open task detail / edit
 * Delete/Backspace — delete task (with confirmation)
 */
export function useTaskShortcuts({ taskId, onEdit, onClose }: UseTaskShortcutsOptions) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksApi.changeStatus(id, status),
    onSuccess: (updatedTask) => {
      toast.success(t('toast.statusChanged'));
      queryClient.setQueryData<TaskDetail>(['TASK', updatedTask.id], (prev) =>
        prev ? { ...prev, ...updatedTask, comments: prev.comments, activities: prev.activities, dependencies: prev.dependencies, subtasks: prev.subtasks, tags: updatedTask.tags.length > 0 ? updatedTask.tags : prev.tags } : updatedTask,
      );
      queryClient.setQueryData<PaginatedResponse<ProjectTask>>(['tasks'], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          content: prev.content.map((task) =>
            task.id === updatedTask.id ? { ...task, status: updatedTask.status } : task,
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['TASK', updatedTask.id] });
    },
    onError: () => {
      toast.error(t('errors.serverErrorRetry'));
    },
  });

  const changePriorityMutation = useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: TaskPriority }) =>
      tasksApi.updateTask(id, { priority }),
    onSuccess: (updatedTask) => {
      toast.success(t('toast.priorityChanged'));
      queryClient.setQueryData<TaskDetail>(['TASK', updatedTask.id], (prev) =>
        prev ? { ...prev, ...updatedTask, comments: prev.comments, activities: prev.activities, dependencies: prev.dependencies, subtasks: prev.subtasks, tags: updatedTask.tags.length > 0 ? updatedTask.tags : prev.tags } : updatedTask,
      );
      queryClient.setQueryData<PaginatedResponse<ProjectTask>>(['tasks'], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          content: prev.content.map((task) =>
            task.id === updatedTask.id ? { ...task, priority: updatedTask.priority } : task,
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['TASK', updatedTask.id] });
    },
    onError: () => {
      toast.error(t('errors.serverErrorRetry'));
    },
  });

  const assignSelfMutation = useMutation({
    mutationFn: (id: string) => {
      if (!user) throw new Error('No user');
      return tasksApi.assignTask(id, user.id, user.fullName ?? `${user.firstName} ${user.lastName}`);
    },
    onSuccess: (updatedTask) => {
      toast.success(t('toast.assignedToMe'));
      queryClient.setQueryData<TaskDetail>(['TASK', updatedTask.id], (prev) =>
        prev ? { ...prev, ...updatedTask, comments: prev.comments, activities: prev.activities, dependencies: prev.dependencies, subtasks: prev.subtasks, tags: updatedTask.tags.length > 0 ? updatedTask.tags : prev.tags } : updatedTask,
      );
      queryClient.setQueryData<PaginatedResponse<ProjectTask>>(['tasks'], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          content: prev.content.map((task) =>
            task.id === updatedTask.id ? { ...task, assigneeName: updatedTask.assigneeName } : task,
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['TASK', updatedTask.id] });
    },
    onError: () => {
      toast.error(t('errors.serverErrorRetry'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.bulkDelete([id]),
    onSuccess: (_data, id) => {
      toast.success(t('toast.taskDeleted'));
      queryClient.setQueryData<PaginatedResponse<ProjectTask>>(['tasks'], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          content: prev.content.filter((task) => task.id !== id),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose?.();
    },
    onError: () => {
      toast.error(t('errors.serverErrorRetry'));
    },
  });

  const getTaskFromCache = useCallback(
    (id: string): ProjectTask | undefined => {
      const detail = queryClient.getQueryData<TaskDetail>(['TASK', id]);
      if (detail) return detail;
      const list = queryClient.getQueryData<PaginatedResponse<ProjectTask>>(['tasks']);
      return list?.content.find((task) => task.id === id);
    },
    [queryClient],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!taskId) return;
      if (isInputTarget(e)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();

      switch (key) {
        case 's': {
          e.preventDefault();
          const task = getTaskFromCache(taskId);
          if (!task) return;
          const currentIdx = STATUS_CYCLE.indexOf(task.status);
          const nextIdx = currentIdx < 0 ? 0 : (currentIdx + 1) % STATUS_CYCLE.length;
          changeStatusMutation.mutate({ id: taskId, status: STATUS_CYCLE[nextIdx] });
          break;
        }

        case 'p': {
          e.preventDefault();
          const task = getTaskFromCache(taskId);
          if (!task) return;
          const currentIdx = PRIORITY_CYCLE.indexOf(task.priority);
          const nextIdx = currentIdx < 0 ? 0 : (currentIdx + 1) % PRIORITY_CYCLE.length;
          changePriorityMutation.mutate({ id: taskId, priority: PRIORITY_CYCLE[nextIdx] });
          break;
        }

        case 'i': {
          e.preventDefault();
          if (!user) return;
          assignSelfMutation.mutate(taskId);
          break;
        }

        case 'e': {
          e.preventDefault();
          onEdit?.(taskId);
          break;
        }

        case 'delete':
        case 'backspace': {
          e.preventDefault();
          const confirmed = window.confirm(t('toast.confirmDeleteTask'));
          if (confirmed) {
            deleteMutation.mutate(taskId);
          }
          break;
        }
      }
    },
    [
      taskId,
      getTaskFromCache,
      changeStatusMutation,
      changePriorityMutation,
      assignSelfMutation,
      deleteMutation,
      user,
      onEdit,
    ],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
