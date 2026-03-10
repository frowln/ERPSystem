import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, Square, Clock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { tasksApi, type TaskTimeEntry } from '@/api/tasks';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface Props {
  taskId: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const TaskTimerWidget: React.FC<Props> = ({ taskId }) => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const { data: entries = [] } = useQuery<TaskTimeEntry[]>({
    queryKey: ['time-entries', taskId],
    queryFn: () => tasksApi.getTimeEntries(taskId),
  });

  const runningEntry = entries.find((e) => e.isRunning && e.userId === user?.id);

  useEffect(() => {
    if (runningEntry) {
      const start = new Date(runningEntry.startedAt).getTime();
      const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
      tick();
      intervalRef.current = setInterval(tick, 1000);
      return () => clearInterval(intervalRef.current);
    }
    setElapsed(0);
    return () => clearInterval(intervalRef.current);
  }, [runningEntry]);

  const startMutation = useMutation({
    mutationFn: () => tasksApi.startTimer(taskId, user?.id ?? '', user?.fullName ?? user?.email ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries', taskId] });
      toast.success(t('taskTimer.started'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => tasksApi.stopTimer(taskId, user?.id ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries', taskId] });
      toast.success(t('taskTimer.stopped'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const totalSeconds = entries
    .filter((e) => !e.isRunning)
    .reduce((sum: number, e) => sum + (e.durationSeconds ?? e.durationMinutes * 60), 0) + (runningEntry ? elapsed : 0);

  return (
    <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
      <Clock className="h-4 w-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('taskTimer.totalTime')}</p>
        <p className="text-sm font-mono font-medium text-neutral-900 dark:text-neutral-100">
          {formatDuration(totalSeconds)}
        </p>
      </div>
      {runningEntry ? (
        <button
          onClick={() => stopMutation.mutate()}
          disabled={stopMutation.isPending}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50',
          )}
        >
          <Square className="h-3 w-3" />
          <span className="font-mono">{formatDuration(elapsed)}</span>
        </button>
      ) : (
        <button
          onClick={() => startMutation.mutate()}
          disabled={startMutation.isPending}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50',
          )}
        >
          <Play className="h-3 w-3" />
          {t('taskTimer.start')}
        </button>
      )}
    </div>
  );
};
