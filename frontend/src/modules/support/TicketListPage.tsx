import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Search,
  Headphones,
  Clock,
  AlertTriangle,
  CheckCircle,
  LayoutGrid,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { EmptyState } from '@/design-system/components/EmptyState';
import { Input, Select } from '@/design-system/components/FormField';
import { supportApi } from '@/api/support';
import { formatDate, formatRelativeTime } from '@/lib/format';
import type { SupportTicket } from './types';
import { TicketCreateModal } from './TicketCreateModal';
import { t } from '@/i18n';

const ticketStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  OPEN: 'blue',
  ASSIGNED: 'cyan',
  IN_PROGRESS: 'orange',
  WAITING_RESPONSE: 'yellow',
  RESOLVED: 'green',
  CLOSED: 'gray',
};

const getTicketStatusLabels = (): Record<string, string> => ({
  OPEN: t('support.colOpen'),
  ASSIGNED: t('support.colAssigned'),
  IN_PROGRESS: t('support.colInProgress'),
  WAITING_RESPONSE: t('support.colWaitingResponse'),
  RESOLVED: t('support.colResolved'),
  CLOSED: t('support.colClosed'),
});

const ticketPriorityColorMap: Record<string, 'gray' | 'blue' | 'orange' | 'red'> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  CRITICAL: 'red',
};

const getTicketPriorityLabels = (): Record<string, string> => ({
  LOW: t('support.priorityLow'),
  MEDIUM: t('support.priorityMedium'),
  HIGH: t('support.priorityHigh'),
  CRITICAL: t('support.priorityCritical'),
});

const getCategoryLabels = (): Record<string, string> => ({
  TECHNICAL: t('support.catTechnical'),
  ACCESS: t('support.catAccess'),
  DOCUMENTS: t('support.catDocuments'),
  EQUIPMENT: t('support.catEquipment'),
  SAFETY: t('support.catSafety'),
  SCHEDULE: t('support.catSchedule'),
  OTHER: t('support.catOther'),
});

type TabId = 'all' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

const getPriorityFilterOptions = () => [
  { value: '', label: t('support.priorityFilterAll') },
  { value: 'LOW', label: t('support.priorityLow') },
  { value: 'MEDIUM', label: t('support.priorityMedium') },
  { value: 'HIGH', label: t('support.priorityHigh') },
  { value: 'CRITICAL', label: t('support.priorityCritical') },
];

function categoryLabel(category?: string): string {
  if (!category) return '—';
  if (getCategoryLabels()[category]) return getCategoryLabels()[category];
  return category;
}

const TicketListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
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

  const tickets = ticketData?.content ?? [];

  const categoryFilterOptions = useMemo(() => {
    const categoriesFromData = Array.from(
      new Set(tickets.map((ticket) => ticket.category).filter((value): value is string => Boolean(value))),
    ).sort((a, b) => a.localeCompare(b));

    const values = categoriesFromData.length > 0 ? categoriesFromData : Object.keys(getCategoryLabels());
    return [
      { value: '', label: t('support.categoryFilterAll') },
      ...values.map((value) => ({ value, label: categoryLabel(value) })),
    ];
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    let filtered = tickets;

    if (activeTab === 'OPEN') {
      filtered = filtered.filter((ticket) => ticket.status === 'OPEN' || ticket.status === 'ASSIGNED');
    } else if (activeTab === 'IN_PROGRESS') {
      filtered = filtered.filter((ticket) => ticket.status === 'IN_PROGRESS' || ticket.status === 'WAITING_RESPONSE');
    } else if (activeTab === 'RESOLVED') {
      filtered = filtered.filter((ticket) => ticket.status === 'RESOLVED');
    } else if (activeTab === 'CLOSED') {
      filtered = filtered.filter((ticket) => ticket.status === 'CLOSED');
    }

    if (priorityFilter) {
      filtered = filtered.filter((ticket) => ticket.priority === priorityFilter);
    }

    if (categoryFilter) {
      filtered = filtered.filter((ticket) => ticket.category === categoryFilter);
    }

    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter((ticket) => (
        ticket.number.toLowerCase().includes(lowerSearch)
        || ticket.subject.toLowerCase().includes(lowerSearch)
        || (ticket.requesterName ?? '').toLowerCase().includes(lowerSearch)
        || (ticket.requesterId ?? '').toLowerCase().includes(lowerSearch)
      ));
    }

    return filtered;
  }, [tickets, activeTab, priorityFilter, categoryFilter, search]);

  const tabCounts = useMemo(() => ({
    all: tickets.length,
    open: tickets.filter((ticket) => ticket.status === 'OPEN' || ticket.status === 'ASSIGNED').length,
    in_progress: tickets.filter((ticket) => ticket.status === 'IN_PROGRESS' || ticket.status === 'WAITING_RESPONSE').length,
    resolved: tickets.filter((ticket) => ticket.status === 'RESOLVED').length,
    closed: tickets.filter((ticket) => ticket.status === 'CLOSED').length,
  }), [tickets]);

  const metrics = useMemo(() => {
    const openCount = tickets.filter((ticket) => !['RESOLVED', 'CLOSED'].includes(ticket.status)).length;
    const criticalCount = tickets.filter(
      (ticket) => ticket.priority === 'CRITICAL' && !['RESOLVED', 'CLOSED'].includes(ticket.status),
    ).length;
    const resolvedCount = tickets.filter((ticket) => ['RESOLVED', 'CLOSED'].includes(ticket.status)).length;

    return {
      total: tickets.length,
      open: openCount,
      critical: criticalCount,
      resolved: resolvedCount,
    };
  }, [tickets]);

  const columns = useMemo<ColumnDef<SupportTicket, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('support.colNumber'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-600 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'subject',
        header: t('support.colSubject'),
        size: 320,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[300px]">{row.original.subject}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{categoryLabel(row.original.category)}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('support.colStatus'),
        size: 130,
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            colorMap={ticketStatusColorMap}
            label={getTicketStatusLabels()[row.original.status] ?? row.original.statusDisplayName ?? row.original.status}
          />
        ),
      },
      {
        accessorKey: 'priority',
        header: t('support.colPriority'),
        size: 130,
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.priority}
            colorMap={ticketPriorityColorMap}
            label={getTicketPriorityLabels()[row.original.priority] ?? row.original.priorityDisplayName ?? row.original.priority}
          />
        ),
      },
      {
        accessorKey: 'requesterName',
        header: t('support.colRequester'),
        size: 170,
        cell: ({ row }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{row.original.requesterName ?? row.original.requesterId ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'assignedToName',
        header: t('support.colAssigneeCol'),
        size: 170,
        cell: ({ row }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{row.original.assignedToName ?? row.original.assignedToId ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('support.colCreated'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 text-xs">{formatRelativeTime(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'dueDate',
        header: t('support.colDueDate'),
        size: 120,
        cell: ({ row }) => {
          const dueDate = row.original.dueDate;
          const isOverdue = Boolean(
            dueDate
            && new Date(dueDate) < new Date()
            && !['RESOLVED', 'CLOSED'].includes(row.original.status),
          );

          return (
            <span className={isOverdue ? 'text-danger-600 font-medium tabular-nums' : 'tabular-nums text-neutral-700 dark:text-neutral-300'}>
              {formatDate(dueDate)}
            </span>
          );
        },
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (ticket: SupportTicket) => navigate(`/support/tickets/${ticket.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('support.listTitle')}
        subtitle={t('support.listSubtitle', { count: String(tickets.length) })}
        breadcrumbs={[
          { label: t('support.breadcrumbHome'), href: '/' },
          { label: t('support.breadcrumbSupport'), href: '/support/tickets' },
        ]}
        actions={(
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              iconLeft={<LayoutGrid size={16} />}
              onClick={() => navigate('/support/tickets/board')}
            >
              {t('support.btnBoard')}
            </Button>
            <Button iconLeft={<Plus size={16} />} onClick={() => setCreateModalOpen(true)}>
              {t('support.btnNewRequest')}
            </Button>
          </div>
        )}
        tabs={[
          { id: 'all', label: t('support.tabAll'), count: tabCounts.all },
          { id: 'OPEN', label: t('support.tabOpen'), count: tabCounts.open },
          { id: 'IN_PROGRESS', label: t('support.tabInProgress'), count: tabCounts.in_progress },
          { id: 'RESOLVED', label: t('support.tabResolved'), count: tabCounts.resolved },
          { id: 'CLOSED', label: t('support.tabClosed'), count: tabCounts.closed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {isError && tickets.length === 0 ? (
        <EmptyState
          variant="ERROR"
          title={t('support.errorLoadTickets')}
          description={t('support.errorLoadTicketsDesc')}
          actionLabel={t('support.btnRetry')}
          onAction={() => { void refetch(); }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard icon={<Headphones size={18} />} label={t('support.metricTotal')} value={metrics.total} />
            <MetricCard
              icon={<Clock size={18} />}
              label={t('support.metricOpen')}
              value={metrics.open}
              trend={{ direction: metrics.open > 3 ? 'up' : 'neutral', value: t('support.trendItemsCount', { count: String(metrics.open) }) }}
            />
            <MetricCard
              icon={<AlertTriangle size={18} />}
              label={t('support.metricCriticalList')}
              value={metrics.critical}
              trend={{
                direction: metrics.critical > 0 ? 'down' : 'neutral',
                value: metrics.critical > 0 ? t('support.trendNeedAttention') : t('support.trendNone'),
              }}
            />
            <MetricCard icon={<CheckCircle size={18} />} label={t('support.metricResolvedList')} value={metrics.resolved} />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder={t('support.searchTicketPlaceholder')}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              options={getPriorityFilterOptions()}
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="w-48"
            />
            <Select
              options={categoryFilterOptions}
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-56"
            />
          </div>

          <DataTable<SupportTicket>
            data={filteredTickets}
            columns={columns}
            loading={isLoading}
            onRowClick={handleRowClick}
            enableRowSelection
            enableColumnVisibility
            enableDensityToggle
            enableExport
            pageSize={20}
            emptyTitle={t('support.emptyTickets')}
            emptyDescription={t('support.emptyTicketsDesc')}
          />
        </>
      )}

      <TicketCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
};

export default TicketListPage;
