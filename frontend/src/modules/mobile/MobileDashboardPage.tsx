import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Smartphone,
  FileText,
  Camera,
  RefreshCw,
  CloudOff,
  Clock,
  ArrowRight,
  ListChecks,
  AlertTriangle,
  RefreshCcw,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { mobileApi } from '@/api/mobile';
import { formatRelativeTime } from '@/lib/format';
import { guardDemoModeAction } from '@/lib/demoMode';
import type { FieldReport, MobileTask, OfflineSyncStatus } from './types';
import {
  loadMobileSubmissionQueue,
  loadStoredMobilePhotoFiles,
  removeStoredMobilePhotoFiles,
  saveMobileSubmissionQueue,
  type QueueItemStatus,
  type QueuedMobileSubmission,
} from './draftStore';
import { useMobileSubmissionQueue } from './useMobileSubmissionQueue';
import toast from 'react-hot-toast';
import { isAxiosError } from 'axios';

const reportStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow'> = {
  DRAFT: 'gray',
  SUBMITTED: 'blue',
  REVIEWED: 'yellow',
  APPROVED: 'green',
};

const reportStatusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  SUBMITTED: 'Отправлен',
  REVIEWED: 'На проверке',
  APPROVED: 'Утверждён',
};

const taskStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red'> = {
  ASSIGNED: 'blue',
  IN_PROGRESS: 'yellow',
  COMPLETED: 'green',
  CANCELLED: 'gray',
};

const taskStatusLabels: Record<string, string> = {
  ASSIGNED: 'Назначена',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Выполнена',
  CANCELLED: 'Отменена',
};

const normalizeSyncError = (error: unknown): { status: Extract<QueueItemStatus, 'FAILED' | 'CONFLICT'>; message: string } => {
  if (isAxiosError(error)) {
    const statusCode = error.response?.status;
    if (statusCode === 409) {
      return {
        status: 'CONFLICT',
        message: 'Конфликт версии данных. Требуется ручное решение.',
      };
    }

    const responseMessage = typeof error.response?.data === 'string'
      ? error.response.data
      : undefined;

    return {
      status: 'FAILED',
      message: responseMessage || error.message || 'Ошибка синхронизации с сервером',
    };
  }

  return {
    status: 'FAILED',
    message: 'Неизвестная ошибка синхронизации',
  };
};

const MobileDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();

  const [syncingQueue, setSyncingQueue] = useState(false);
  const localQueue = useMobileSubmissionQueue();

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const {
    data: reportsData,
    isLoading: reportsLoading,
    isError: reportsError,
  } = useQuery({
    queryKey: ['mobile-field-reports', 'dashboard'],
    queryFn: () => mobileApi.getFieldReports({ size: 200 }),
    retry: 0,
  });

  const {
    data: tasksData,
    isLoading: tasksLoading,
    isError: tasksError,
  } = useQuery({
    queryKey: ['mobile-tasks', 'dashboard'],
    queryFn: () => mobileApi.getMobileTasks({ size: 200 }),
    retry: 0,
  });

  const {
    data: remoteSyncStatus,
    isError: syncStatusError,
  } = useQuery({
    queryKey: ['mobile-sync-status'],
    queryFn: () => mobileApi.getSyncStatus(),
    retry: 0,
    refetchInterval: 60_000,
  });

  const queueStats = useMemo(() => {
    const conflicts = localQueue.filter((item) => item.status === 'CONFLICT').length;
    const failed = localQueue.filter((item) => item.status === 'FAILED').length;
    const queued = localQueue.filter((item) => item.status === 'QUEUED').length;
    const photoCount = localQueue.reduce((sum, item) => sum + item.photos.length, 0);
    return { conflicts, failed, queued, photoCount };
  }, [localQueue]);

  const syncStatus = useMemo<OfflineSyncStatus>(() => {
    const remoteFailed = remoteSyncStatus?.failedItems ?? 0;

    return {
      pendingReports: remoteSyncStatus?.pendingReports ?? queueStats.queued,
      pendingPhotos: remoteSyncStatus?.pendingPhotos ?? queueStats.photoCount,
      lastSyncAt: remoteSyncStatus?.lastSyncAt,
      isOnline,
      syncInProgress: remoteSyncStatus?.syncInProgress ?? syncingQueue,
      failedItems: remoteFailed + queueStats.failed + queueStats.conflicts,
    };
  }, [isOnline, queueStats.conflicts, queueStats.failed, queueStats.photoCount, queueStats.queued, remoteSyncStatus, syncingQueue]);

  const reports = useMemo<FieldReport[]>(
    () => [...(reportsData?.content ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [reportsData],
  );

  const tasks = useMemo<MobileTask[]>(() => tasksData?.content ?? [], [tasksData]);

  const activeTasks = useMemo(() =>
    tasks.filter((task) => task.status === 'ASSIGNED' || task.status === 'IN_PROGRESS'),
  [tasks]);

  const recentReports = useMemo(() => reports.slice(0, 4), [reports]);

  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      todayReports: reports.filter((report) => report.reportDate === today).length,
      pendingTasks: activeTasks.length,
      pendingSync: syncStatus.pendingReports + syncStatus.pendingPhotos + localQueue.length,
      completedToday: tasks.filter((task) => task.status === 'COMPLETED').length,
    };
  }, [activeTasks.length, localQueue.length, reports, syncStatus.pendingPhotos, syncStatus.pendingReports, tasks]);

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => mobileApi.completeTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-tasks'] });
      toast.success('Задача обновлена');
    },
    onError: () => {
      toast.error('Не удалось обновить задачу');
    },
  });

  const handleSync = useCallback(async () => {
    if (syncingQueue) return;
    if (guardDemoModeAction('Синхронизация данных')) return;
    if (!isOnline) {
      toast.error('Синхронизация недоступна офлайн');
      return;
    }

    setSyncingQueue(true);
    const queue = loadMobileSubmissionQueue();
    const remaining: QueuedMobileSubmission[] = [];
    let syncedCount = 0;
    let conflictCount = 0;

    for (const item of queue) {
      if (item.status === 'CONFLICT') {
        remaining.push(item);
        continue;
      }

      try {
        let reportId = item.remoteId;
        if (reportId) {
          await mobileApi.updateFieldReport(reportId, item.payload);
        } else {
          const created = await mobileApi.createFieldReport(item.payload);
          reportId = created.id;
        }
        if (!reportId) {
          throw new Error('Missing report id for sync submission');
        }

        const photos = await loadStoredMobilePhotoFiles(item.photos);
        for (const photoFile of photos) {
          await mobileApi.uploadPhoto(reportId, photoFile);
        }

        await mobileApi.submitFieldReport(reportId);
        try {
          await removeStoredMobilePhotoFiles(item.photos);
        } catch {
          toast.error(`Отчёт синхронизирован, но локальные фото не очищены: ${item.payload.title}`);
        }
        syncedCount += 1;
      } catch (error) {
        const mappedError = normalizeSyncError(error);
        if (mappedError.status === 'CONFLICT') {
          conflictCount += 1;
        }
        remaining.push({
          ...item,
          status: mappedError.status,
          attempts: item.attempts + 1,
          lastError: mappedError.message,
          lastTriedAt: new Date().toISOString(),
        });
      }
    }

    saveMobileSubmissionQueue(remaining);

    try {
      await mobileApi.triggerSync();
    } catch {
      // Backend sync trigger can fail independently from local queue processing.
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['mobile-field-reports'] }),
      queryClient.invalidateQueries({ queryKey: ['mobile-sync-status'] }),
      queryClient.invalidateQueries({ queryKey: ['mobile-tasks'] }),
    ]);

    if (syncedCount > 0) {
      toast.success(`Синхронизировано отчетов: ${syncedCount}`);
    }
    if (remaining.length > 0) {
      toast.error(`Не удалось синхронизировать: ${remaining.length}`);
    }
    if (conflictCount > 0) {
      toast.error(`Конфликтов синхронизации: ${conflictCount}`);
    }
    if (syncedCount === 0 && remaining.length === 0) {
      toast.success('Синхронизация завершена');
    }

    setSyncingQueue(false);
  }, [isOnline, queryClient, syncingQueue]);

  const markQueueItemForRetry = useCallback((id: string, asNew = false) => {
    const nextQueue: QueuedMobileSubmission[] = localQueue.map((item) => {
      if (item.id !== id) return item;
      const { remoteId, lastError: _lastError, lastTriedAt: _lastTriedAt, ...rest } = item;
      return {
        ...rest,
        ...(asNew ? {} : remoteId ? { remoteId } : {}),
        status: 'QUEUED',
      };
    });
    saveMobileSubmissionQueue(nextQueue);
    toast.success(asNew ? 'Элемент будет отправлен как новый' : 'Элемент добавлен в повторную синхронизацию');
  }, [localQueue]);

  const removeQueueItem = useCallback(async (id: string) => {
    const target = localQueue.find((item) => item.id === id);
    if (!target) return;

    const isConfirmed = await confirm({
      title: 'Удалить элемент из очереди синхронизации?',
      description: 'Операция необратима. Локальные данные отчета и фото будут удалены.',
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      confirmVariant: 'danger',
      items: [target.payload.title],
    });
    if (!isConfirmed) return;

    const nextQueue = localQueue.filter((item) => item.id !== id);
    saveMobileSubmissionQueue(nextQueue);
    try {
      await removeStoredMobilePhotoFiles(target.photos);
    } catch {
      toast.error('Элемент удален, но локальные фото очистить не удалось');
    }
    toast.success('Элемент удален из локальной очереди');
  }, [confirm, localQueue]);

  const dataUnavailable = reportsError || tasksError || syncStatusError;

  const showSyncBanner =
    syncStatus.pendingReports > 0
    || syncStatus.pendingPhotos > 0
    || syncStatus.failedItems > 0
    || localQueue.length > 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Мобильная панель"
        subtitle="Полевые данные и задачи"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Мобильное приложение' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              iconLeft={<RefreshCw size={16} />}
              onClick={handleSync}
              loading={syncingQueue}
            >
              Синхронизировать
            </Button>
            <Button iconLeft={<FileText size={16} />} onClick={() => navigate('/mobile/reports/new')}>
              Новый отчёт
            </Button>
          </div>
        }
      />

      {dataUnavailable && (
        <div className="mb-4 rounded-xl border border-warning-200 bg-warning-50 p-3 text-sm text-warning-800">
          Часть мобильных данных сейчас недоступна. Отображаются только данные, полученные с сервера и из локальной очереди.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<FileText size={18} />}
          label="Отчётов сегодня"
          value={reportsLoading ? '---' : metrics.todayReports}
        />
        <MetricCard
          icon={<ListChecks size={18} />}
          label="Активных задач"
          value={tasksLoading ? '---' : metrics.pendingTasks}
          trend={{ direction: 'neutral', value: `${metrics.completedToday} выполнено` }}
        />
        <MetricCard
          icon={<CloudOff size={18} />}
          label="Ожидают синхронизации"
          value={metrics.pendingSync}
          trend={{ direction: metrics.pendingSync > 0 ? 'down' : 'neutral', value: metrics.pendingSync > 0 ? 'Требуется синхронизация' : 'Все синхронизировано' }}
        />
        <MetricCard
          icon={<Smartphone size={18} />}
          label="Статус связи"
          value={isOnline ? 'Онлайн' : 'Офлайн'}
          trend={{ direction: isOnline ? 'neutral' : 'down', value: syncStatus.lastSyncAt ? `Синхр: ${formatRelativeTime(syncStatus.lastSyncAt)}` : '---' }}
        />
      </div>

      {showSyncBanner && (
        <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw size={18} className="text-warning-600" />
            <div>
              <p className="text-sm font-medium text-warning-800">Ожидают синхронизации</p>
              <p className="text-xs text-warning-600 mt-0.5">
                {syncStatus.pendingReports > 0 && `${syncStatus.pendingReports} отчёт(ов)`}
                {syncStatus.pendingReports > 0 && syncStatus.pendingPhotos > 0 && ', '}
                {syncStatus.pendingPhotos > 0 && `${syncStatus.pendingPhotos} фото`}
                {localQueue.length > 0 && `, ${localQueue.length} отчёт(ов) в локальной очереди`}
                {queueStats.photoCount > 0 && ` (${queueStats.photoCount} фото)`}
                {syncStatus.failedItems > 0 && ` | ${syncStatus.failedItems} с ошибкой`}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={handleSync} loading={syncingQueue}>
            Синхронизировать
          </Button>
        </div>
      )}

      {(queueStats.conflicts > 0 || queueStats.failed > 0) && (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-danger-600" />
            <p className="text-sm font-semibold text-danger-800">Требуется решение конфликтов синхронизации</p>
          </div>
          <div className="space-y-3">
            {localQueue
              .filter((item) => item.status === 'CONFLICT' || item.status === 'FAILED')
              .map((item) => (
                <div key={item.id} className="rounded-lg border border-danger-200 bg-white dark:bg-neutral-900 p-3">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{item.payload.title}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Статус: {item.status === 'CONFLICT' ? 'Конфликт' : 'Ошибка'} |
                    Попыток: {item.attempts} |
                    Фото: {item.photos.length}
                  </p>
                  {item.lastError && (
                    <p className="text-xs text-danger-700 mt-1">{item.lastError}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button
                      size="xs"
                      variant="secondary"
                      iconLeft={<RefreshCcw size={12} />}
                      onClick={() => markQueueItemForRetry(item.id)}
                    >
                      Повторить
                    </Button>
                    {item.status === 'CONFLICT' && (
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => markQueueItemForRetry(item.id, true)}
                      >
                        Отправить как новый
                      </Button>
                    )}
                    <Button
                      size="xs"
                      variant="danger"
                      iconLeft={<Trash2 size={12} />}
                      onClick={() => void removeQueueItem(item.id)}
                    >
                      Удалить из очереди
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Мои задачи</h3>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
              {activeTasks.length} активных
            </span>
          </div>

          {activeTasks.length === 0 ? (
            <div className="text-sm text-neutral-500 dark:text-neutral-400">Активных задач нет</div>
          ) : (
            <div className="space-y-3">
              {activeTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{task.title}</p>
                    <StatusBadge
                      status={task.status}
                      colorMap={taskStatusColorMap}
                      label={taskStatusLabels[task.status]}
                    />
                  </div>
                  {task.description && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-neutral-400">
                    <span>{task.projectName ?? '---'}</span>
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {`до ${task.dueDate}`}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      loading={completeTaskMutation.isPending}
                      onClick={() => {
                        if (guardDemoModeAction('Обновление задачи')) return;
                        completeTaskMutation.mutate(task.id);
                      }}
                    >
                      Отметить выполненной
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Последние отчёты</h3>
            <Button
              variant="ghost"
              size="xs"
              iconRight={<ArrowRight size={14} />}
              onClick={() => navigate('/mobile/reports')}
            >
              Все отчёты
            </Button>
          </div>

          {recentReports.length === 0 ? (
            <div className="text-sm text-neutral-500 dark:text-neutral-400">Отчётов пока нет</div>
          ) : (
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => navigate(`/mobile/reports/${report.id}`)}
                  className="p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-neutral-400">{report.number}</span>
                    <StatusBadge
                      status={report.status}
                      colorMap={reportStatusColorMap}
                      label={reportStatusLabels[report.status]}
                    />
                  </div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{report.title}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {report.authorName} &middot; {formatRelativeTime(report.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="xs"
                iconLeft={<Camera size={14} />}
                onClick={() => navigate('/mobile/photos')}
              >
                Фотогалерея
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDashboardPage;
