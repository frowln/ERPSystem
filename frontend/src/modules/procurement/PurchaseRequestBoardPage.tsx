import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, X, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Input, Select } from '@/design-system/components/FormField';
import {
  purchaseRequestStatusLabels,
  purchaseRequestPriorityLabels,
} from '@/design-system/components/StatusBadge';
import { procurementApi } from '@/api/procurement';
import { formatDate, formatMoney } from '@/lib/format';
import { guardDemoModeAction } from '@/lib/demoMode';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';
import { t } from '@/i18n';
import type { PurchaseRequest, PurchaseRequestStatus } from '@/types';

type BoardColumnId =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'ASSIGNED'
  | 'ORDERED'
  | 'DELIVERED'
  | 'CANCELLED';

interface BoardColumn {
  id: BoardColumnId;
  title: string;
  color: string;
  headerBg: string;
  collapsed: boolean;
  statuses: PurchaseRequestStatus[];
  targetStatus?: PurchaseRequestStatus;
}

const shortUuid = (value?: string) => (value ? `${value.slice(0, 8)}…` : '—');

const getDefaultColumns = (): BoardColumn[] => [
  {
    id: 'DRAFT',
    title: `${purchaseRequestStatusLabels.DRAFT} / ${purchaseRequestStatusLabels.REJECTED}`,
    color: 'bg-neutral-400',
    headerBg: 'bg-neutral-50 dark:bg-neutral-800',
    collapsed: false,
    statuses: ['DRAFT', 'REJECTED'],
  },
  {
    id: 'SUBMITTED',
    title: `${purchaseRequestStatusLabels.SUBMITTED} / ${purchaseRequestStatusLabels.IN_APPROVAL}`,
    color: 'bg-blue-500',
    headerBg: 'bg-blue-50 dark:bg-blue-950/30',
    collapsed: false,
    statuses: ['SUBMITTED', 'IN_APPROVAL'],
    targetStatus: 'SUBMITTED',
  },
  {
    id: 'APPROVED',
    title: purchaseRequestStatusLabels.APPROVED,
    color: 'bg-green-500',
    headerBg: 'bg-green-50 dark:bg-green-950/30',
    collapsed: false,
    statuses: ['APPROVED'],
    targetStatus: 'APPROVED',
  },
  {
    id: 'ASSIGNED',
    title: purchaseRequestStatusLabels.ASSIGNED,
    color: 'bg-cyan-500',
    headerBg: 'bg-cyan-50 dark:bg-cyan-950/30',
    collapsed: false,
    statuses: ['ASSIGNED'],
    targetStatus: 'ASSIGNED',
  },
  {
    id: 'ORDERED',
    title: purchaseRequestStatusLabels.ORDERED,
    color: 'bg-purple-500',
    headerBg: 'bg-purple-50 dark:bg-purple-950/30',
    collapsed: false,
    statuses: ['ORDERED'],
    targetStatus: 'ORDERED',
  },
  {
    id: 'DELIVERED',
    title: `${purchaseRequestStatusLabels.DELIVERED} / ${purchaseRequestStatusLabels.CLOSED}`,
    color: 'bg-emerald-500',
    headerBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    collapsed: false,
    statuses: ['DELIVERED', 'CLOSED'],
    targetStatus: 'DELIVERED',
  },
  {
    id: 'CANCELLED',
    title: purchaseRequestStatusLabels.CANCELLED,
    color: 'bg-red-500',
    headerBg: 'bg-red-50 dark:bg-red-950/30',
    collapsed: false,
    statuses: ['CANCELLED'],
    targetStatus: 'CANCELLED',
  },
];

const priorityColors: Record<PurchaseRequest['priority'], string> = {
  LOW: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300',
  MEDIUM: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  HIGH: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  CRITICAL: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

const canTransition = (from: PurchaseRequestStatus, to: PurchaseRequestStatus): boolean => {
  switch (from) {
    case 'DRAFT':
      return to === 'SUBMITTED' || to === 'CANCELLED';
    case 'SUBMITTED':
      return to === 'APPROVED' || to === 'CANCELLED';
    case 'IN_APPROVAL':
      return to === 'APPROVED' || to === 'CANCELLED';
    case 'APPROVED':
      return to === 'ASSIGNED' || to === 'CANCELLED';
    case 'ASSIGNED':
      return to === 'ORDERED' || to === 'CANCELLED';
    case 'ORDERED':
      return to === 'DELIVERED' || to === 'CANCELLED';
    default:
      return false;
  }
};

const PurchaseRequestBoardPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [columns, setColumns] = useState<BoardColumn[]>(() => getDefaultColumns());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<PurchaseRequestStatus | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<BoardColumnId | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  const {
    data: requestsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['purchase-requests', 'board'],
    queryFn: () => procurementApi.getPurchaseRequests({ page: 0, size: 400, sort: 'createdAt,desc' }),
  });

  const requests = requestsData?.content ?? [];

  const transitionMutation = useMutation({
    mutationFn: async ({
      request,
      targetStatus,
    }: {
      request: PurchaseRequest;
      targetStatus: PurchaseRequestStatus;
    }) => {
      switch (targetStatus) {
        case 'SUBMITTED':
          return procurementApi.submitPurchaseRequest(request.id);
        case 'APPROVED':
          return procurementApi.approvePurchaseRequestStatus(request.id);
        case 'ASSIGNED': {
          const assignedToId = request.assignedToId ?? request.requestedById ?? currentUserId;
          if (!assignedToId) {
            throw new Error(t('procurement.requestBoard.errorNoAssignee'));
          }
          return procurementApi.assignPurchaseRequest(request.id, assignedToId);
        }
        case 'ORDERED':
          return procurementApi.markPurchaseRequestOrdered(request.id);
        case 'DELIVERED':
          return procurementApi.markPurchaseRequestDelivered(request.id);
        case 'CANCELLED':
          return procurementApi.cancelPurchaseRequest(request.id);
        default:
          throw new Error(`Unsupported transition target: ${targetStatus}`);
      }
    },
    onMutate: ({ request, targetStatus }) => {
      setPendingRequestId(request.id);
      toast.loading(`${t('procurement.requestBoard.toastTransitioning')} "${purchaseRequestStatusLabels[targetStatus] ?? targetStatus}"...`, {
        id: 'purchase-request-board-transition',
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-requests', 'board'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-request', variables.request.id] });
      toast.success(`${t('procurement.requestBoard.toastStatusChanged')}: ${purchaseRequestStatusLabels[variables.targetStatus] ?? variables.targetStatus}`, {
        id: 'purchase-request-board-transition',
      });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : t('procurement.requestBoard.errorTransitionFailed');
      toast.error(message, { id: 'purchase-request-board-transition' });
    },
    onSettled: () => {
      setPendingRequestId(null);
    },
  });

  const filtered = useMemo(() => {
    let result = requests;

    if (filterStatus) {
      result = result.filter((item) => item.status === filterStatus);
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (normalizedQuery) {
      result = result.filter((item) => {
        const haystack = [
          item.name,
          item.projectName ?? '',
          item.projectId,
          item.requestedByName,
          item.assignedToName ?? '',
          item.status,
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      });
    }

    return result;
  }, [filterStatus, requests, searchQuery]);

  const byColumn = useMemo(() => {
    const grouped: Record<BoardColumnId, PurchaseRequest[]> = {
      DRAFT: [],
      SUBMITTED: [],
      APPROVED: [],
      ASSIGNED: [],
      ORDERED: [],
      DELIVERED: [],
      CANCELLED: [],
    };

    for (const item of filtered) {
      const column = columns.find((candidate) => candidate.statuses.includes(item.status));
      if (!column) {
        continue;
      }
      grouped[column.id].push(item);
    }

    return grouped;
  }, [columns, filtered]);

  const hasFilters = Boolean(filterStatus || searchQuery.trim());

  const toggleCol = useCallback((id: BoardColumnId) => {
    setColumns((prev) => prev.map((column) => (column.id === id ? { ...column, collapsed: !column.collapsed } : column)));
  }, []);

  const onDragStart = useCallback((event: React.DragEvent, requestId: string) => {
    event.dataTransfer.setData('text/plain', requestId);
    event.dataTransfer.effectAllowed = 'move';
    setDraggedId(requestId);
  }, []);

  const onDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverCol(null);
  }, []);

  const onDrop = useCallback((event: React.DragEvent, columnId: BoardColumnId) => {
    event.preventDefault();

    if (transitionMutation.isPending) {
      toast.error(t('procurement.requestBoard.errorWaitTransition'));
      return;
    }

    if (!draggedId) {
      return;
    }

    const request = requests.find((item) => item.id === draggedId);
    const targetColumn = columns.find((column) => column.id === columnId);
    const currentColumn = columns.find((column) => request && column.statuses.includes(request.status));

    setDraggedId(null);
    setDragOverCol(null);

    if (!request || !targetColumn) {
      return;
    }

    if (currentColumn?.id === targetColumn.id) {
      return;
    }

    if (!targetColumn.targetStatus) {
      toast.error(t('procurement.requestBoard.errorColumnUnavailable'));
      return;
    }

    if (!canTransition(request.status, targetColumn.targetStatus)) {
      toast.error(
        `${t('procurement.requestBoard.errorTransitionUnavailable')}: ${purchaseRequestStatusLabels[request.status] ?? request.status} → ${purchaseRequestStatusLabels[targetColumn.targetStatus] ?? targetColumn.targetStatus}`,
      );
      return;
    }

    transitionMutation.mutate({ request, targetStatus: targetColumn.targetStatus });
  }, [columns, draggedId, requests, transitionMutation]);

  return (
    <div className="animate-fade-in" onDragEnd={onDragEnd}>
      <PageHeader
        title={t('procurement.requestBoard.title')}
        subtitle={`${requests.length} ${t('procurement.requestBoard.subtitleRequests')}`}
        breadcrumbs={[
          { label: t('procurement.requestBoard.breadcrumbHome'), href: '/' },
          { label: t('procurement.requestBoard.breadcrumbProcurement'), href: '/procurement' },
          { label: t('procurement.requestBoard.breadcrumbBoard') },
        ]}
        actions={(
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Filter size={14} />}
              onClick={() => setShowFilters((prev) => !prev)}
              className={hasFilters ? 'border-primary-300 text-primary-600' : ''}
            >
              {t('procurement.requestBoard.filters')}
            </Button>
            <Button
              iconLeft={<Plus size={16} />}
              onClick={() => {
                if (guardDemoModeAction(t('procurement.requestBoard.demoCreateRequest'))) {
                  return;
                }
                navigate('/procurement/new');
              }}
            >
              {t('procurement.requestBoard.newRequest')}
            </Button>
          </div>
        )}
      />

      {showFilters && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 animate-fade-in flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder={t('procurement.requestBoard.searchPlaceholder')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            options={[
              { value: '', label: t('procurement.requestBoard.allStatuses') },
              ...Object.entries(purchaseRequestStatusLabels).map(([value, label]) => ({ value, label })),
            ]}
            value={filterStatus}
            onChange={(event) => setFilterStatus((event.target.value as PurchaseRequestStatus) || '')}
            className="w-64"
          />
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<X size={14} />}
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('');
              }}
            >
              {t('procurement.requestBoard.reset')}
            </Button>
          )}
        </div>
      )}

      {isError && (
        <div className="mb-4 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700 flex items-center justify-between gap-3">
          <span>{t('procurement.requestBoard.errorLoadFailed')}</span>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>{t('common.refresh')}</Button>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 260px)' }}>
        {columns.map((column) => {
          const columnItems = byColumn[column.id] ?? [];
          const isOver = dragOverCol === column.id;

          return (
            <div
              key={column.id}
              className={cn(
                'flex flex-col min-w-[280px] w-[280px] rounded-xl border transition-all duration-200',
                isOver ? 'border-primary-400 bg-primary-50/30 shadow-md' : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50',
                column.collapsed && 'min-w-[48px] w-[48px]',
              )}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverCol(column.id);
              }}
              onDrop={(event) => onDrop(event, column.id)}
            >
              <div
                className={cn('flex items-center gap-2 px-3 py-2.5 rounded-t-xl cursor-pointer select-none', column.headerBg)}
                onClick={() => toggleCol(column.id)}
              >
                {column.collapsed ? <ChevronRight size={14} className="text-neutral-400" /> : <ChevronDown size={14} className="text-neutral-400" />}
                {!column.collapsed && (
                  <>
                    <span className={cn('w-2 h-2 rounded-full flex-shrink-0', column.color)} />
                    <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex-1 truncate">{column.title}</span>
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-200">
                      {columnItems.length}
                    </span>
                  </>
                )}
              </div>

              {!column.collapsed && (
                <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
                  {columnItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-xs text-neutral-400">{t('procurement.requestBoard.noRequests')}</p>
                      <p className="text-[10px] text-neutral-300 mt-0.5">{t('procurement.requestBoard.dragHere')}</p>
                    </div>
                  ) : (
                    columnItems.map((item) => {
                      const isPending = transitionMutation.isPending && pendingRequestId === item.id;

                      return (
                        <div
                          key={item.id}
                          draggable={!isPending}
                          onDragStart={(event) => onDragStart(event, item.id)}
                          onClick={() => navigate(`/procurement/${item.id}`)}
                          className={cn(
                            'bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 cursor-pointer hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600 transition-all',
                            draggedId === item.id && 'opacity-50 shadow-lg',
                            isPending && 'opacity-60 pointer-events-none',
                          )}
                        >
                          <div className="flex items-center justify-between mb-1.5 gap-2">
                            <span className="text-[10px] font-mono text-neutral-400">{item.name}</span>
                            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', priorityColors[item.priority])}>
                              {purchaseRequestPriorityLabels[item.priority] ?? item.priority}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2 line-clamp-2">
                            {item.projectName || `${t('procurement.requestBoard.project')} ${shortUuid(item.projectId)}`}
                          </h4>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('procurement.requestBoard.initiator')}: {item.requestedByName}</p>
                          <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                            {formatMoney(item.totalAmount ?? 0)}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate max-w-[140px]">
                              {item.assignedToName || t('procurement.requestBoard.notAssigned')}
                            </span>
                            <span className="text-[10px] text-neutral-400">{formatDate(item.requestDate)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {column.collapsed && (
                <div className="flex-1 flex items-center justify-center py-4">
                  <span
                    className="text-xs font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap"
                    style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
                  >
                    {column.title} ({columnItems.length})
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isLoading && (
        <p className="mt-2 text-xs text-neutral-500">{t('procurement.requestBoard.loadingBoard')}</p>
      )}
    </div>
  );
};

export default PurchaseRequestBoardPage;
