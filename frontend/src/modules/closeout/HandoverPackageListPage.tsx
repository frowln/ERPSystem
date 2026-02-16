import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Package, Send, CheckCircle2, FileText } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { EmptyState } from '@/design-system/components/EmptyState';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { closeoutApi } from '@/api/closeout';
import { formatDate } from '@/lib/format';
import type { HandoverPackage, HandoverStatus } from './types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange'> = {
  DRAFT: 'gray',
  PREPARED: 'yellow',
  SUBMITTED: 'blue',
  ACCEPTED: 'green',
  REJECTED: 'red',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  PREPARED: 'Подготовлен',
  SUBMITTED: 'Передан',
  ACCEPTED: 'Принят',
  REJECTED: 'Отклонён',
};

type TabId = 'all' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';

const HandoverPackageListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['handover-packages'],
    queryFn: () => closeoutApi.getHandoverPackages(),
  });

  const packages = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = packages;
    if (activeTab === 'SUBMITTED') result = result.filter((p) => p.status === 'SUBMITTED');
    else if (activeTab === 'ACCEPTED') result = result.filter((p) => p.status === 'ACCEPTED');
    else if (activeTab === 'REJECTED') result = result.filter((p) => p.status === 'REJECTED');

    if (statusFilter) result = result.filter((p) => p.status === statusFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.packageNumber.toLowerCase().includes(lower) ||
          p.title.toLowerCase().includes(lower) ||
          p.recipientName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [packages, activeTab, statusFilter, search]);

  const counts = useMemo(() => ({
    all: packages.length,
    submitted: packages.filter((p) => p.status === 'SUBMITTED').length,
    accepted: packages.filter((p) => p.status === 'ACCEPTED').length,
    rejected: packages.filter((p) => p.status === 'REJECTED').length,
  }), [packages]);

  const totalDocs = useMemo(() => packages.reduce((sum, p) => sum + p.documentCount, 0), [packages]);

  const columns = useMemo<ColumnDef<HandoverPackage, unknown>[]>(
    () => [
      {
        accessorKey: 'packageNumber',
        header: '\u2116',
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Пакет документов',
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.title}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={statusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'recipientName',
        header: 'Получатель',
        size: 180,
        cell: ({ row }) => (
          <div>
            <p className="text-neutral-700 dark:text-neutral-300">{row.original.recipientName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.recipientOrg}</p>
          </div>
        ),
      },
      {
        accessorKey: 'documentCount',
        header: 'Документов',
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-600">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'handoverDate',
        header: 'Дата передачи',
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 80,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => { e.stopPropagation(); navigate(`/closeout/handover/${row.original.id}`); }}
          >
            Открыть
          </Button>
        ),
      },
    ],
    [navigate],
  );

  const handleRowClick = useCallback(
    (pkg: HandoverPackage) => navigate(`/closeout/handover/${pkg.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Передача документации"
        subtitle={`${packages.length} пакетов в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Завершение', href: '/closeout' },
          { label: 'Передача' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />}>
            Новый пакет
          </Button>
        }
        tabs={[
          { id: 'all', label: 'Все', count: counts.all },
          { id: 'SUBMITTED', label: 'Переданные', count: counts.submitted },
          { id: 'ACCEPTED', label: 'Принятые', count: counts.accepted },
          { id: 'REJECTED', label: 'Отклонённые', count: counts.rejected },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {isError && packages.length === 0 ? (
        <EmptyState
          variant="ERROR"
          title="Не удалось загрузить пакеты передачи"
          description="Проверьте соединение и повторите попытку"
          actionLabel="Повторить"
          onAction={() => { void refetch(); }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard icon={<Package size={18} />} label="Всего пакетов" value={counts.all} />
            <MetricCard icon={<Send size={18} />} label="Передано" value={counts.submitted} subtitle="ожидают приёмки" />
            <MetricCard icon={<CheckCircle2 size={18} />} label="Принято" value={counts.accepted} />
            <MetricCard icon={<FileText size={18} />} label="Всего документов" value={totalDocs} />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input placeholder="Поиск по номеру, названию..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select
              options={[
                { value: '', label: 'Все статусы' },
                ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-48"
            />
          </div>

          <DataTable<HandoverPackage>
            data={filtered ?? []}
            columns={columns}
            loading={isLoading}
            onRowClick={handleRowClick}
            enableRowSelection
            enableColumnVisibility
            enableDensityToggle
            enableExport
            pageSize={20}
            emptyTitle="Нет пакетов передачи"
            emptyDescription="Создайте первый пакет документов для передачи"
          />
        </>
      )}
    </div>
  );
};

export default HandoverPackageListPage;
