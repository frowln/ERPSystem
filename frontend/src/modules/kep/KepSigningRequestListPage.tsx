import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, FilePen, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { kepApi } from '@/api/kep';
import { formatDate } from '@/lib/format';
import type { KepSigningRequest } from './types';

const signingStatusColorMap: Record<string, 'yellow' | 'green' | 'red' | 'gray' | 'orange'> = {
  pending: 'yellow',
  signed: 'green',
  rejected: 'red',
  expired: 'orange',
  cancelled: 'gray',
};

const signingStatusLabels: Record<string, string> = {
  pending: 'Ожидает подписания',
  signed: 'Подписан',
  rejected: 'Отклонён',
  expired: 'Просрочен',
  cancelled: 'Отменён',
};

const signingPriorityColorMap: Record<string, 'gray' | 'blue' | 'orange' | 'red'> = {
  low: 'gray',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
};

const signingPriorityLabels: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критический',
};

const statusFilterOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'PENDING', label: 'Ожидает подписания' },
  { value: 'SIGNED', label: 'Подписан' },
  { value: 'REJECTED', label: 'Отклонён' },
  { value: 'EXPIRED', label: 'Просрочен' },
  { value: 'CANCELLED', label: 'Отменён' },
];

const priorityFilterOptions = [
  { value: '', label: 'Все приоритеты' },
  { value: 'LOW', label: 'Низкий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'HIGH', label: 'Высокий' },
  { value: 'CRITICAL', label: 'Критический' },
];

type TabId = 'all' | 'PENDING' | 'SIGNED' | 'REJECTED';


const KepSigningRequestListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['kep-signing-requests'],
    queryFn: () => kepApi.getSigningRequests(),
  });

  const signMutation = useMutation({
    mutationFn: ({ id, certificateId }: { id: string; certificateId: string }) => kepApi.signRequest(id, certificateId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kep-signing-requests'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => kepApi.rejectRequest(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kep-signing-requests'] }),
  });

  const requests = requestsData?.content ?? [];

  const filteredRequests = useMemo(() => {
    let filtered = requests;

    if (activeTab === 'PENDING') {
      filtered = filtered.filter((r) => r.status === 'PENDING');
    } else if (activeTab === 'SIGNED') {
      filtered = filtered.filter((r) => r.status === 'SIGNED');
    } else if (activeTab === 'REJECTED') {
      filtered = filtered.filter((r) => r.status === 'REJECTED' || r.status === 'EXPIRED');
    }

    if (statusFilter) {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (priorityFilter) {
      filtered = filtered.filter((r) => r.priority === priorityFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.number.toLowerCase().includes(lower) ||
          r.documentName.toLowerCase().includes(lower) ||
          r.signerName.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [requests, activeTab, statusFilter, priorityFilter, search]);

  const tabCounts = useMemo(() => ({
    all: requests.length,
    pending: requests.filter((r) => r.status === 'PENDING').length,
    signed: requests.filter((r) => r.status === 'SIGNED').length,
    rejected: requests.filter((r) => r.status === 'REJECTED' || r.status === 'EXPIRED').length,
  }), [requests]);

  const metrics = useMemo(() => {
    const pending = requests.filter((r) => r.status === 'PENDING').length;
    const signed = requests.filter((r) => r.status === 'SIGNED').length;
    const rejected = requests.filter((r) => r.status === 'REJECTED').length;
    const expired = requests.filter((r) => r.status === 'EXPIRED').length;
    return { total: requests.length, pending, signed, rejected, expired };
  }, [requests]);

  const columns = useMemo<ColumnDef<KepSigningRequest, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'documentName',
        header: 'Документ',
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.documentName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName ?? '---'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 160,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={signingStatusColorMap}
            label={signingStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Приоритет',
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={signingPriorityColorMap}
            label={signingPriorityLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'signerName',
        header: 'Подписант',
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'dueDate',
        header: 'Срок',
        size: 120,
        cell: ({ row }) => {
          const dueDate = row.original.dueDate;
          const isOverdue = dueDate && new Date(dueDate) < new Date() && row.original.status === 'PENDING';
          return (
            <span className={isOverdue ? 'text-danger-600 font-medium tabular-nums' : 'tabular-nums text-neutral-700 dark:text-neutral-300'}>
              {formatDate(dueDate)}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        size: 160,
        cell: ({ row }) => {
          if (row.original.status !== 'PENDING') {
            return (
              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/kep/signing-requests/${row.original.id}`);
                }}
              >
                Открыть
              </Button>
            );
          }
          return (
            <div className="flex gap-1">
              <Button
                variant="primary"
                size="xs"
                iconLeft={<CheckCircle size={12} />}
                onClick={(e) => {
                  e.stopPropagation();
                  signMutation.mutate({ id: row.original.id, certificateId: 'default' });
                }}
              >
                Подписать
              </Button>
              <Button
                variant="danger"
                size="xs"
                iconLeft={<XCircle size={12} />}
                onClick={(e) => {
                  e.stopPropagation();
                  rejectMutation.mutate({ id: row.original.id, reason: 'Отклонено' });
                }}
              >
                Отклонить
              </Button>
            </div>
          );
        },
      },
    ],
    [navigate, signMutation, rejectMutation],
  );

  const handleRowClick = useCallback(
    (req: KepSigningRequest) => navigate(`/kep/signing-requests/${req.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Запросы на подписание КЭП"
        subtitle={`${requests.length} запросов в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'КЭП' },
          { label: 'Запросы на подписание' },
        ]}
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'PENDING', label: 'Ожидающие', count: tabCounts.pending },
          { id: 'SIGNED', label: 'Подписанные', count: tabCounts.signed },
          { id: 'REJECTED', label: 'Отклонённые', count: tabCounts.rejected },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<FilePen size={18} />}
          label="Всего запросов"
          value={metrics.total}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label="Ожидают подписания"
          value={metrics.pending}
          trend={metrics.pending > 0 ? { direction: 'up', value: `${metrics.pending} шт.` } : undefined}
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label="Подписано"
          value={metrics.signed}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label="Отклонено / Просрочено"
          value={metrics.rejected + metrics.expired}
          trend={metrics.rejected + metrics.expired > 0 ? { direction: 'down', value: 'Требуют внимания' } : undefined}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по номеру, документу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-52"
        />
        <Select
          options={priorityFilterOptions}
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-44"
        />
      </div>

      {/* Table */}
      <DataTable<KepSigningRequest>
        data={filteredRequests}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет запросов на подписание"
        emptyDescription="Запросы на подписание КЭП отсутствуют"
      />
    </div>
  );
};

export default KepSigningRequestListPage;
