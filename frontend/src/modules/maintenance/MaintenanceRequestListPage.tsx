import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Wrench, Clock, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  maintenanceRequestStatusColorMap,
  maintenanceRequestStatusLabels,
  maintenancePriorityColorMap,
  maintenancePriorityLabels,
  maintenanceTypeColorMap,
  maintenanceTypeLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { maintenanceApi } from '@/api/maintenance';
import { formatDate, formatMoneyCompact } from '@/lib/format';
import toast from 'react-hot-toast';
import type { MaintenanceRequest } from './types';

type TabId = 'all' | 'NEW' | 'IN_PROGRESS' | 'REPAIRED';

const statusFilterOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'NEW', label: 'Новая' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'REPAIRED', label: 'Отремонтировано' },
  { value: 'SCRAP', label: 'Списание' },
  { value: 'CANCELLED', label: 'Отменена' },
];

const typeFilterOptions = [
  { value: '', label: 'Все типы' },
  { value: 'CORRECTIVE', label: 'Корректирующее' },
  { value: 'PREVENTIVE', label: 'Превентивное' },
  { value: 'PREDICTIVE', label: 'Предиктивное' },
];

const MaintenanceRequestListPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: requestData, isLoading } = useQuery({
    queryKey: ['maintenance-requests'],
    queryFn: () => maintenanceApi.getRequests(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      maintenanceApi.updateRequestStatus(id, status as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] }),
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await maintenanceApi.deleteRequest(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      toast.success('Заявка(и) удалены');
    },
    onError: () => {
      toast.error('Ошибка при удалении');
    },
  });

  const requests = requestData?.content ?? [];

  const filteredRequests = useMemo(() => {
    let filtered = requests;
    if (activeTab !== 'all') {
      filtered = filtered.filter((r) => r.status === activeTab);
    }
    if (typeFilter) {
      filtered = filtered.filter((r) => r.maintenanceType === typeFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.number.toLowerCase().includes(lower) ||
          r.name.toLowerCase().includes(lower) ||
          r.equipmentName.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [requests, activeTab, typeFilter, search]);

  const tabCounts = useMemo(() => ({
    all: requests.length,
    new: requests.filter((r) => r.status === 'NEW').length,
    in_progress: requests.filter((r) => r.status === 'IN_PROGRESS').length,
    repaired: requests.filter((r) => r.status === 'REPAIRED').length,
  }), [requests]);

  const metrics = useMemo(() => {
    const totalCost = requests.reduce((s, r) => s + (r.cost ?? 0), 0);
    const urgentCount = requests.filter((r) => r.priority === 'URGENT' || r.priority === 'HIGH').length;
    const completedCount = requests.filter((r) => r.status === 'REPAIRED').length;
    return { total: requests.length, totalCost, urgentCount, completedCount };
  }, [requests]);

  const columns = useMemo<ColumnDef<MaintenanceRequest, unknown>[]>(
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
        accessorKey: 'name',
        header: 'Заявка',
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.equipmentName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={maintenanceRequestStatusColorMap}
            label={maintenanceRequestStatusLabels[getValue<string>()] ?? getValue<string>()}
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
            colorMap={maintenancePriorityColorMap}
            label={maintenancePriorityLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'maintenanceType',
        header: 'Тип',
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={maintenanceTypeColorMap}
            label={maintenanceTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'COST',
        header: 'Стоимость',
        size: 130,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return (
            <span className="tabular-nums text-sm text-neutral-700 dark:text-neutral-300">
              {val ? formatMoneyCompact(val) : '---'}
            </span>
          );
        },
      },
      {
        accessorKey: 'assignedToName',
        header: 'Исполнитель',
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        id: 'statusAction',
        header: 'Действие',
        size: 150,
        cell: ({ row }) => {
          const r = row.original;
          if (r.status === 'NEW') {
            return (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); statusMutation.mutate({ id: r.id, status: 'IN_PROGRESS' }); }}>
                Начать работу
              </Button>
            );
          }
          if (r.status === 'IN_PROGRESS') {
            return (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); statusMutation.mutate({ id: r.id, status: 'REPAIRED' }); }}>
                Завершить
              </Button>
            );
          }
          return null;
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Дата',
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 text-xs">{formatDate(getValue<string>())}</span>
        ),
      },
    ],
    [statusMutation],
  );

  const handleRowClick = useCallback(
    (request: MaintenanceRequest) => navigate(`/maintenance/requests/${request.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Заявки на обслуживание"
        subtitle={`${requests.length} заявок`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Обслуживание' },
          { label: 'Заявки' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/maintenance/requests/new')}>
            Новая заявка
          </Button>
        }
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'NEW', label: 'Новые', count: tabCounts.new },
          { id: 'IN_PROGRESS', label: 'В работе', count: tabCounts.in_progress },
          { id: 'REPAIRED', label: 'Выполнено', count: tabCounts.repaired },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Wrench size={18} />} label="Всего заявок" value={metrics.total} />
        <MetricCard icon={<AlertTriangle size={18} />} label="Срочные" value={metrics.urgentCount} />
        <MetricCard icon={<CheckCircle size={18} />} label="Выполнено" value={metrics.completedCount} />
        <MetricCard icon={<Clock size={18} />} label="Общие затраты" value={formatMoneyCompact(metrics.totalCost)} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по номеру, названию, оборудованию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={typeFilterOptions}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable<MaintenanceRequest>
        data={filteredRequests ?? []}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        bulkActions={[
          {
            label: 'Удалить',
            icon: <Trash2 size={13} />,
            variant: 'danger',
            onClick: async (rows) => {
              const ids = rows.map((r) => r.id);
              const isConfirmed = await confirm({
                title: `Удалить ${ids.length} заявк(у/и)?`,
                description: 'Операция необратима. Выбранные заявки будут удалены.',
                confirmLabel: 'Удалить',
                cancelLabel: 'Отмена',
              });
              if (!isConfirmed) return;
              deleteRequestMutation.mutate(ids);
            },
          },
        ]}
        emptyTitle="Нет заявок на обслуживание"
        emptyDescription="Создайте первую заявку для начала работы"
      />
    </div>
  );
};

export default MaintenanceRequestListPage;
