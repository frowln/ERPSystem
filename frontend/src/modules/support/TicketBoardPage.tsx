import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, X, Plus, ChevronDown, ChevronRight, List } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { EmptyState } from '@/design-system/components/EmptyState';
import { Input, Select } from '@/design-system/components/FormField';
import { supportApi } from '@/api/support';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { SupportTicket, TicketStatus } from './types';
const TicketCreateModal = React.lazy(() => import('./TicketCreateModal'));
import { t } from '@/i18n';

type BoardColumnId = TicketStatus;

interface BoardColumn {
  id: BoardColumnId;
  title: string;
  color: string;
  headerBg: string;
  collapsed: boolean;
}

const getDefaultColumns = (): BoardColumn[] => [
  { id: 'OPEN', title: t('support.colOpen'), color: 'bg-primary-500', headerBg: 'bg-primary-50 dark:bg-primary-900/20', collapsed: false },
  { id: 'ASSIGNED', title: t('support.colAssigned'), color: 'bg-cyan-500', headerBg: 'bg-cyan-50 dark:bg-cyan-900/20', collapsed: false },
  { id: 'IN_PROGRESS', title: t('support.colInProgress'), color: 'bg-warning-500', headerBg: 'bg-warning-50 dark:bg-warning-900/20', collapsed: false },
  { id: 'WAITING_RESPONSE', title: t('support.colWaitingResponse'), color: 'bg-orange-500', headerBg: 'bg-orange-50 dark:bg-orange-900/20', collapsed: false },
  { id: 'RESOLVED', title: t('support.colResolved'), color: 'bg-success-500', headerBg: 'bg-success-50 dark:bg-success-900/20', collapsed: false },
  { id: 'CLOSED', title: t('support.colClosed'), color: 'bg-neutral-400', headerBg: 'bg-neutral-50 dark:bg-neutral-800', collapsed: false },
];

const getPriorityLabels = (): Record<string, string> => ({
  LOW: t('support.priorityLow'),
  MEDIUM: t('support.priorityMedium'),
  HIGH: t('support.priorityHigh'),
  CRITICAL: t('support.priorityCritical'),
});

const priorityColors: Record<string, string> = {
  LOW: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
  MEDIUM: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  HIGH: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
  CRITICAL: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
};

const getCategoryLabels = (): Record<string, string> => ({
  TECHNICAL: t('support.catTechnical'),
  ACCESS: t('support.catAccess'),
  DOCUMENTS: t('support.catDocuments'),
  EQUIPMENT: t('support.catEquipment'),
  SAFETY: t('support.catSafety'),
  SCHEDULE: t('support.catSchedule'),
  OTHER: t('support.catOther'),
  BUG: t('support.catBug'),
  QUESTION: t('support.catQuestion'),
  FEATURE_REQUEST: t('support.catFeatureRequest'),
});

function categoryLabel(value?: string): string {
  if (!value) return t('support.catNone');
  return getCategoryLabels()[value] ?? value;
}

const TicketBoardPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [items, setItems] = useState<SupportTicket[]>([]);
  const [columns, setColumns] = useState<BoardColumn[]>(getDefaultColumns());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<BoardColumnId | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const {
    data: ticketData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['support-tickets', { page: 0, size: 300 }],
    queryFn: () => supportApi.getTickets({ page: 0, size: 300 }),
  });

  useEffect(() => {
    if (!ticketData) return;
    setItems(ticketData.content);
  }, [ticketData]);

  const statusMutation = useMutation({
    mutationFn: (payload: { ticketId: string; status: TicketStatus; assigneeId?: string }) => (
      supportApi.changeTicketStatus(payload.ticketId, payload.status, { assigneeId: payload.assigneeId })
    ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['support-ticket'] }),
        queryClient.invalidateQueries({ queryKey: ['support-tickets'] }),
        queryClient.invalidateQueries({ queryKey: ['support-dashboard'] }),
      ]);
    },
    onError: () => {
      toast.error(t('support.statusChangeError'));
    },
  });

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (filterStatus) {
      filtered = filtered.filter((item) => item.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => (
        item.number.toLowerCase().includes(query)
        || item.subject.toLowerCase().includes(query)
        || (item.category ?? '').toLowerCase().includes(query)
        || (item.requesterName ?? '').toLowerCase().includes(query)
      ));
    }

    return filtered;
  }, [items, filterStatus, searchQuery]);

  const byColumn = useMemo(() => {
    const map: Record<string, SupportTicket[]> = {};
    for (const column of columns) {
      map[column.id] = filteredItems.filter((item) => item.status === column.id);
    }
    return map;
  }, [filteredItems, columns]);

  const hasFilters = Boolean(filterStatus || searchQuery);

  const onDragStart = useCallback((event: React.DragEvent, id: string) => {
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';
    setDraggedId(id);
  }, []);

  const onDrop = useCallback((event: React.DragEvent, status: BoardColumnId) => {
    event.preventDefault();
    if (!draggedId) return;

    const current = items.find((item) => item.id === draggedId);
    if (!current || current.status === status) {
      setDraggedId(null);
      setDragOverCol(null);
      return;
    }

    if (status === 'ASSIGNED' && !current.assignedToId) {
      toast.error(t('support.cannotAssignNoAssignee'));
      setDraggedId(null);
      setDragOverCol(null);
      return;
    }

    const previousItems = items;
    const nextItems = items.map((item) => (
      item.id === draggedId ? { ...item, status } : item
    ));
    setItems(nextItems);

    statusMutation.mutate(
      { ticketId: draggedId, status, assigneeId: current.assignedToId },
      {
        onError: () => {
          setItems(previousItems);
        },
      },
    );

    setDraggedId(null);
    setDragOverCol(null);
  }, [draggedId, items, statusMutation]);

  const onDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverCol(null);
  }, []);

  const toggleColumn = useCallback((id: BoardColumnId) => {
    setColumns((prev) => prev.map((column) => (
      column.id === id ? { ...column, collapsed: !column.collapsed } : column
    )));
  }, []);

  return (
    <div className="animate-fade-in" onDragEnd={onDragEnd}>
      <PageHeader
        title={t('support.boardTitle')}
        subtitle={t('support.boardSubtitle', { count: String(items.length) })}
        breadcrumbs={[
          { label: t('support.breadcrumbHome'), href: '/' },
          { label: t('support.breadcrumbSupport'), href: '/support/tickets' },
          { label: t('support.breadcrumbBoard') },
        ]}
        actions={(
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Filter size={14} />}
              onClick={() => setShowFilters(!showFilters)}
              className={hasFilters ? 'border-primary-300 text-primary-600' : ''}
            >
              {t('support.btnFilters')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<List size={14} />}
              onClick={() => navigate('/support/tickets')}
            >
              {t('support.btnList')}
            </Button>
            <Button iconLeft={<Plus size={16} />} onClick={() => setCreateModalOpen(true)}>
              {t('support.btnNewTicket')}
            </Button>
          </div>
        )}
      />

      {showFilters && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 animate-fade-in">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder={t('support.searchPlaceholder')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            options={[
              { value: '', label: t('support.allStatuses') },
              ...getDefaultColumns().map((column) => ({ value: column.id, label: column.title })),
            ]}
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            className="w-56"
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
              {t('support.btnReset')}
            </Button>
          )}
        </div>
      )}

      {isError && items.length === 0 ? (
        <EmptyState
          variant="ERROR"
          title={t('support.errorLoadBoard')}
          description={t('support.errorLoadBoardDesc')}
          actionLabel={t('support.btnRetry')}
          onAction={() => { void refetch(); }}
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 260px)' }}>
          {columns.map((column) => {
            const columnItems = byColumn[column.id] ?? [];
            const isOver = dragOverCol === column.id;

            return (
              <div
                key={column.id}
                className={cn(
                  'flex flex-col min-w-[300px] w-[300px] rounded-xl border transition-all duration-200',
                  isOver ? 'border-primary-400 bg-primary-50/30 shadow-md' : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50',
                  column.collapsed && 'min-w-[52px] w-[52px]',
                )}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverCol(column.id);
                }}
                onDrop={(event) => onDrop(event, column.id)}
              >
                <div
                  className={cn('flex items-center gap-2 px-3 py-2.5 rounded-t-xl cursor-pointer select-none', column.headerBg)}
                  onClick={() => toggleColumn(column.id)}
                >
                  {column.collapsed ? (
                    <ChevronRight size={14} className="text-neutral-400" />
                  ) : (
                    <ChevronDown size={14} className="text-neutral-400" />
                  )}
                  {!column.collapsed && (
                    <>
                      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', column.color)} />
                      <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex-1 truncate">{column.title}</span>
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                        {columnItems.length}
                      </span>
                    </>
                  )}
                </div>

                {!column.collapsed && (
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
                    {columnItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-xs text-neutral-400">
                          {isLoading ? t('support.loadingTickets') : t('support.noTickets')}
                        </p>
                        {!isLoading && (
                          <p className="text-[10px] text-neutral-300 mt-0.5">{t('support.dragHint')}</p>
                        )}
                      </div>
                    ) : (
                      columnItems.map((item) => (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(event) => onDragStart(event, item.id)}
                          onClick={() => navigate(`/support/tickets/${item.id}`)}
                          className={cn(
                            'bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 cursor-pointer hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600 transition-all',
                            draggedId === item.id && 'opacity-50 shadow-lg',
                          )}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-mono text-neutral-400">{item.number}</span>
                            <span className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                              priorityColors[item.priority] ?? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600',
                            )}
                            >
                              {getPriorityLabels()[item.priority] ?? item.priority}
                            </span>
                          </div>

                          <h4 className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2 line-clamp-2">{item.subject}</h4>

                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600">
                              {categoryLabel(item.category)}
                            </span>
                          </div>

                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                            {t('support.fromLabel', { name: item.requesterName ?? item.requesterId ?? '—' })}
                          </p>

                          <div className="flex items-center justify-between">
                            {(item.assignedToName ?? item.assignedToId) ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-bold">
                                  {(item.assignedToName ?? item.assignedToId ?? 'U').charAt(0)}
                                </div>
                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate max-w-[120px]">
                                  {item.assignedToName ?? item.assignedToId}
                                </span>
                              </div>
                            ) : (
                              <div />
                            )}
                            <span className="text-[10px] text-neutral-400">{formatRelativeTime(item.createdAt)}</span>
                          </div>
                        </div>
                      ))
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
      )}

      {createModalOpen && (
        <React.Suspense fallback={null}>
          <TicketCreateModal
            open={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default TicketBoardPage;
