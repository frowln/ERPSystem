import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, XCircle, Play, Eye } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import {
  StatusBadge,
  punchItemStatusColorMap,
  punchItemStatusLabels,
  punchItemPriorityColorMap,
  punchItemPriorityLabels,
  punchCategoryColorMap,
  punchCategoryLabels,
} from '@/design-system/components/StatusBadge';
import { punchlistApi } from '@/api/punchlist';
import { formatDate, formatDateTime } from '@/lib/format';
import type { PunchItem } from './types';
interface HistoryEntry {
  id: string;
  action: string;
  authorName: string;
  comment?: string;
  timestamp: string;
}

const emptyPunchItem: PunchItem = {
  id: '',
  number: '',
  title: '',
  description: '',
  punchListId: '',
  status: 'OPEN',
  priority: 'MEDIUM',
  category: 'OTHER',
  projectId: '',
  location: '',
  assignedToId: '',
  assignedToName: '',
  createdById: '',
  createdByName: '',
  photoUrls: [],
  createdAt: '',
  updatedAt: '',
};

const PunchlistItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: string }) =>
      punchlistApi.changePunchItemStatus(itemId, status as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['punch-item', id] });
      queryClient.invalidateQueries({ queryKey: ['punch-items'] });
    },
  });

  const { data: item } = useQuery({
    queryKey: ['punch-item', id],
    queryFn: () => punchlistApi.getPunchItem(id!),
    enabled: !!id,
  });

  const punchItem = item ?? emptyPunchItem;

  // Build history from the item's timestamps
  const history: HistoryEntry[] = [];
  if (punchItem.createdAt) {
    history.push({
      id: 'h-created',
      action: 'Замечание создано',
      authorName: punchItem.createdByName,
      timestamp: punchItem.createdAt,
    });
  }
  if (punchItem.updatedAt && punchItem.updatedAt !== punchItem.createdAt) {
    history.push({
      id: 'h-updated',
      action: 'Обновлено',
      authorName: punchItem.assignedToName || punchItem.createdByName,
      timestamp: punchItem.updatedAt,
    });
  }
  if (punchItem.approvedDate) {
    history.push({
      id: 'h-approved',
      action: 'Принято',
      authorName: punchItem.approvedByName ?? '',
      timestamp: punchItem.approvedDate,
    });
  }

  const statusActions = useMemo(() => {
    switch (punchItem.status) {
      case 'OPEN':
        return (
          <Button iconLeft={<Play size={16} />} onClick={() => statusMutation.mutate({ itemId: id!, status: 'IN_PROGRESS' })}>
            Взять в работу
          </Button>
        );
      case 'IN_PROGRESS':
        return (
          <Button iconLeft={<Eye size={16} />} onClick={() => statusMutation.mutate({ itemId: id!, status: 'READY_FOR_REVIEW' })}>
            На проверку
          </Button>
        );
      case 'READY_FOR_REVIEW':
        return (
          <div className="flex gap-2">
            <Button variant="secondary" iconLeft={<XCircle size={16} />} onClick={() => statusMutation.mutate({ itemId: id!, status: 'IN_PROGRESS' })}>
              Отклонить
            </Button>
            <Button iconLeft={<CheckCircle size={16} />} onClick={() => statusMutation.mutate({ itemId: id!, status: 'CLOSED' })}>
              Принять
            </Button>
          </div>
        );
      default:
        return null;
    }
  }, [punchItem.status, id, statusMutation]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={punchItem.number}
        subtitle={punchItem.title}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Punch List', href: '/punchlist' },
          { label: 'Замечания', href: '/punchlist/items' },
          { label: punchItem.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/punchlist/items')}>
              Назад
            </Button>
            {statusActions}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Описание замечания</h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{punchItem.description}</p>

            <div className="grid grid-cols-2 gap-y-4 gap-x-8 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Категория</p>
                <div className="mt-1">
                  <StatusBadge status={punchItem.category} colorMap={punchCategoryColorMap} label={punchCategoryLabels[punchItem.category]} />
                </div>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Приоритет</p>
                <div className="mt-1">
                  <StatusBadge status={punchItem.priority} colorMap={punchItemPriorityColorMap} label={punchItemPriorityLabels[punchItem.priority]} />
                </div>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Статус</p>
                <div className="mt-1">
                  <StatusBadge status={punchItem.status} colorMap={punchItemStatusColorMap} label={punchItemStatusLabels[punchItem.status]} />
                </div>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Punch List</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-1">{punchItem.punchListName}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Расположение</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Проект</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-1">{punchItem.projectName}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Полное расположение</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-1">{punchItem.location}</p>
              </div>
              {punchItem.floor && (
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Этаж</p>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100 mt-1">{punchItem.floor}</p>
                </div>
              )}
              {punchItem.room && (
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Помещение</p>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100 mt-1">{punchItem.room}</p>
                </div>
              )}
            </div>
          </div>

          {punchItem.notes && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Примечания</h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">{punchItem.notes}</p>
            </div>
          )}

          {/* History */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">История</h3>
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-neutral-300 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{entry.action}</span>
                      <span className="text-xs text-neutral-400">—</span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{entry.authorName}</span>
                    </div>
                    {entry.comment && (
                      <p className="text-sm text-neutral-600 mt-1 bg-neutral-50 dark:bg-neutral-800 rounded-md p-2">{entry.comment}</p>
                    )}
                    <p className="text-xs text-neutral-400 mt-1 tabular-nums">{formatDateTime(entry.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Ответственные</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Исполнитель</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-1">{punchItem.assignedToName}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Автор</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-1">{punchItem.createdByName}</p>
              </div>
              {punchItem.approvedByName && (
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Принял</p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-1">{punchItem.approvedByName}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Сроки</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Срок устранения</span>
                <span className="text-sm font-medium tabular-nums">
                  {formatDate(punchItem.dueDate)}
                </span>
              </div>
              {punchItem.completedDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">Устранено</span>
                  <span className="text-sm tabular-nums">{formatDate(punchItem.completedDate)}</span>
                </div>
              )}
              {punchItem.approvedDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">Принято</span>
                  <span className="text-sm tabular-nums">{formatDate(punchItem.approvedDate)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Создано</span>
                <span className="text-sm tabular-nums">{formatDate(punchItem.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Фотографии</h3>
            {punchItem.photoUrls.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Фотографии не прикреплены</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {punchItem.photoUrls.map((url, idx) => (
                  <div key={idx} className="aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
                ))}
              </div>
            )}
            <Button variant="secondary" size="sm" className="mt-3 w-full">
              Добавить фото
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PunchlistItemDetailPage;
