import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, ListChecks, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  punchItemStatusColorMap,
  punchItemStatusLabels,
  punchItemPriorityColorMap,
  punchItemPriorityLabels,
  punchCategoryColorMap,
  punchCategoryLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { punchlistApi } from '@/api/punchlist';
import { formatDate } from '@/lib/format';
import type { PunchItem } from './types';
import { PunchItemCreateModal } from './PunchItemCreateModal';

type TabId = 'all' | 'OPEN' | 'IN_PROGRESS' | 'REVIEW' | 'CLOSED';

const priorityFilterOptions = [
  { value: '', label: 'Все приоритеты' },
  { value: 'LOW', label: 'Низкий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'HIGH', label: 'Высокий' },
  { value: 'CRITICAL', label: 'Критический' },
];

const categoryFilterOptions = [
  { value: '', label: 'Все категории' },
  { value: 'STRUCTURAL', label: 'Конструктивные' },
  { value: 'ARCHITECTURAL', label: 'Архитектурные' },
  { value: 'ELECTRICAL', label: 'Электрика' },
  { value: 'PLUMBING', label: 'Водоснабжение' },
  { value: 'FINISHING', label: 'Отделочные' },
  { value: 'FIRE_SAFETY', label: 'Пожарная безопасность' },
];


const PunchlistItemsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: punchListsData } = useQuery({
    queryKey: ['punch-lists-for-items'],
    queryFn: () => punchlistApi.getPunchLists({ size: 1 }),
  });

  const activePunchListId = punchListsData?.content?.[0]?.id ?? '';

  const { data: itemData, isLoading } = useQuery<PunchItem[]>({
    queryKey: ['punch-items', activePunchListId],
    queryFn: () => punchlistApi.getPunchItems(activePunchListId),
    enabled: !!activePunchListId,
  });

  const items = itemData ?? [];

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (activeTab === 'OPEN') filtered = filtered.filter((i) => i.status === 'OPEN');
    else if (activeTab === 'IN_PROGRESS') filtered = filtered.filter((i) => i.status === 'IN_PROGRESS');
    else if (activeTab === 'REVIEW') filtered = filtered.filter((i) => ['READY_FOR_REVIEW', 'APPROVED'].includes(i.status));
    else if (activeTab === 'CLOSED') filtered = filtered.filter((i) => i.status === 'CLOSED');
    if (priorityFilter) filtered = filtered.filter((i) => i.priority === priorityFilter);
    if (categoryFilter) filtered = filtered.filter((i) => i.category === categoryFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.number.toLowerCase().includes(lower) ||
          i.title.toLowerCase().includes(lower) ||
          i.location.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [items, activeTab, priorityFilter, categoryFilter, search]);

  const tabCounts = useMemo(() => ({
    all: items.length,
    open: items.filter((i) => i.status === 'OPEN').length,
    in_progress: items.filter((i) => i.status === 'IN_PROGRESS').length,
    review: items.filter((i) => ['READY_FOR_REVIEW', 'APPROVED'].includes(i.status)).length,
    closed: items.filter((i) => i.status === 'CLOSED').length,
  }), [items]);

  const metrics = useMemo(() => {
    const openCount = items.filter((i) => ['OPEN', 'IN_PROGRESS'].includes(i.status)).length;
    const criticalCount = items.filter((i) => i.priority === 'CRITICAL' && !['CLOSED', 'APPROVED'].includes(i.status)).length;
    const closedCount = items.filter((i) => ['CLOSED', 'APPROVED'].includes(i.status)).length;
    return { total: items.length, openCount, criticalCount, closedCount };
  }, [items]);

  const columns = useMemo<ColumnDef<PunchItem, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 90,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Замечание',
        size: 260,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[240px]">{row.original.title}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.location}</p>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Категория',
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={punchCategoryColorMap}
            label={punchCategoryLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={punchItemStatusColorMap}
            label={punchItemStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Приоритет',
        size: 110,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={punchItemPriorityColorMap}
            label={punchItemPriorityLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'assignedToName',
        header: 'Исполнитель',
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'dueDate',
        header: 'Срок',
        size: 110,
        cell: ({ row }) => {
          const dueDate = row.original.dueDate;
          const isOverdue = dueDate && new Date(dueDate) < new Date() && !['CLOSED', 'APPROVED'].includes(row.original.status);
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
    (item: PunchItem) => navigate(`/punchlist/items/${item.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Замечания (Punch List)"
        subtitle={`${items.length} замечаний в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Punch List', href: '/punchlist' },
          { label: 'Замечания' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => setCreateModalOpen(true)}>
            Новое замечание
          </Button>
        }
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'OPEN', label: 'Открытые', count: tabCounts.open },
          { id: 'IN_PROGRESS', label: 'В работе', count: tabCounts.in_progress },
          { id: 'REVIEW', label: 'На проверке', count: tabCounts.review },
          { id: 'CLOSED', label: 'Закрытые', count: tabCounts.closed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<ListChecks size={18} />} label="Всего замечаний" value={metrics.total} />
        <MetricCard icon={<Clock size={18} />} label="Открытые" value={metrics.openCount} />
        <MetricCard icon={<AlertTriangle size={18} />} label="Критические" value={metrics.criticalCount}
          trend={metrics.criticalCount > 0 ? { direction: 'down', value: 'Требуют внимания' } : undefined} />
        <MetricCard icon={<CheckCircle size={18} />} label="Закрытые" value={metrics.closedCount} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск по номеру, описанию, месту..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select options={priorityFilterOptions} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-44" />
        <Select options={categoryFilterOptions} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-48" />
      </div>

      <DataTable<PunchItem>
        data={filteredItems}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет замечаний"
        emptyDescription="Создайте первое замечание для начала работы"
      />

      <PunchItemCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
};

export default PunchlistItemsPage;
