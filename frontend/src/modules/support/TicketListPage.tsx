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

const ticketStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  OPEN: 'blue',
  ASSIGNED: 'cyan',
  IN_PROGRESS: 'orange',
  WAITING_RESPONSE: 'yellow',
  RESOLVED: 'green',
  CLOSED: 'gray',
};

const ticketStatusLabels: Record<string, string> = {
  OPEN: 'Открыта',
  ASSIGNED: 'Назначена',
  IN_PROGRESS: 'В работе',
  WAITING_RESPONSE: 'Ожидание ответа',
  RESOLVED: 'Решена',
  CLOSED: 'Закрыта',
};

const ticketPriorityColorMap: Record<string, 'gray' | 'blue' | 'orange' | 'red'> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  CRITICAL: 'red',
};

const ticketPriorityLabels: Record<string, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  CRITICAL: 'Критический',
};

const categoryLabels: Record<string, string> = {
  TECHNICAL: 'Техническая',
  ACCESS: 'Доступ',
  DOCUMENTS: 'Документы',
  EQUIPMENT: 'Оборудование',
  SAFETY: 'Безопасность',
  SCHEDULE: 'График',
  OTHER: 'Прочее',
};

type TabId = 'all' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

const priorityFilterOptions = [
  { value: '', label: 'Все приоритеты' },
  { value: 'LOW', label: 'Низкий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'HIGH', label: 'Высокий' },
  { value: 'CRITICAL', label: 'Критический' },
];

function categoryLabel(category?: string): string {
  if (!category) return '—';
  if (categoryLabels[category]) return categoryLabels[category];
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

    const values = categoriesFromData.length > 0 ? categoriesFromData : Object.keys(categoryLabels);
    return [
      { value: '', label: 'Все категории' },
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
        header: '\u2116',
        size: 110,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-600 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'subject',
        header: 'Тема',
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
        header: 'Статус',
        size: 130,
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            colorMap={ticketStatusColorMap}
            label={ticketStatusLabels[row.original.status] ?? row.original.statusDisplayName ?? row.original.status}
          />
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Приоритет',
        size: 130,
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.priority}
            colorMap={ticketPriorityColorMap}
            label={ticketPriorityLabels[row.original.priority] ?? row.original.priorityDisplayName ?? row.original.priority}
          />
        ),
      },
      {
        accessorKey: 'requesterName',
        header: 'Заявитель',
        size: 170,
        cell: ({ row }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{row.original.requesterName ?? row.original.requesterId ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'assignedToName',
        header: 'Исполнитель',
        size: 170,
        cell: ({ row }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{row.original.assignedToName ?? row.original.assignedToId ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Создана',
        size: 130,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 text-xs">{formatRelativeTime(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'dueDate',
        header: 'Срок',
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
        title="Заявки поддержки"
        subtitle={`${tickets.length} заявок в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Поддержка', href: '/support/tickets' },
        ]}
        actions={(
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              iconLeft={<LayoutGrid size={16} />}
              onClick={() => navigate('/support/tickets/board')}
            >
              Доска
            </Button>
            <Button iconLeft={<Plus size={16} />} onClick={() => setCreateModalOpen(true)}>
              Новая заявка
            </Button>
          </div>
        )}
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'OPEN', label: 'Открытые', count: tabCounts.open },
          { id: 'IN_PROGRESS', label: 'В работе', count: tabCounts.in_progress },
          { id: 'RESOLVED', label: 'Решённые', count: tabCounts.resolved },
          { id: 'CLOSED', label: 'Закрытые', count: tabCounts.closed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {isError && tickets.length === 0 ? (
        <EmptyState
          variant="ERROR"
          title="Не удалось загрузить заявки поддержки"
          description="Проверьте соединение и попробуйте снова"
          actionLabel="Повторить"
          onAction={() => { void refetch(); }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard icon={<Headphones size={18} />} label="Всего заявок" value={metrics.total} />
            <MetricCard
              icon={<Clock size={18} />}
              label="Открытые"
              value={metrics.open}
              trend={{ direction: metrics.open > 3 ? 'up' : 'neutral', value: `${metrics.open} шт.` }}
            />
            <MetricCard
              icon={<AlertTriangle size={18} />}
              label="Критические"
              value={metrics.critical}
              trend={{
                direction: metrics.critical > 0 ? 'down' : 'neutral',
                value: metrics.critical > 0 ? 'Требуют внимания' : 'Нет',
              }}
            />
            <MetricCard icon={<CheckCircle size={18} />} label="Решённые" value={metrics.resolved} />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Поиск по номеру, теме, заявителю..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              options={priorityFilterOptions}
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
            emptyTitle="Нет заявок поддержки"
            emptyDescription="Создайте первую заявку для начала работы"
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
