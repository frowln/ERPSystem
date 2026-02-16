import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { formatDate } from '@/lib/format';
import { ptoApi } from '@/api/pto';

interface WorkPermit {
  id: string;
  number: string;
  type: string;
  status: string;
  location: string;
  projectName: string;
  issuer: string;
  contractor: string;
  startDate: string;
  endDate: string;
  description: string;
}


const permitTypeLabels: Record<string, string> = {
  general: 'Общий допуск',
  hot_work: 'Огневые работы',
  height_work: 'Работы на высоте',
  confined_space: 'Замкнутые пространства',
  electrical: 'Электромонтажные',
  excavation: 'Земляные работы',
  crane: 'Крановые работы',
};

const statusColorMap: Record<string, 'green' | 'yellow' | 'blue' | 'gray' | 'red'> = {
  active: 'green',
  pending: 'yellow',
  expired: 'red',
  closed: 'gray',
  suspended: 'orange' as 'red',
};
const statusLabels: Record<string, string> = {
  active: 'Действует',
  pending: 'Ожидает',
  expired: 'Просрочен',
  closed: 'Закрыт',
  suspended: 'Приостановлен',
};

const WorkPermitListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ['work-permits'],
    queryFn: () => ptoApi.getWorkPermits(),
  });

  const permits: WorkPermit[] = (paginatedData?.content ?? []).map((wp) => ({
    id: wp.id,
    number: wp.number,
    type: wp.type,
    status: wp.status,
    location: wp.location,
    projectName: wp.projectName,
    issuer: wp.issuer,
    contractor: wp.contractor,
    startDate: wp.startDate,
    endDate: wp.endDate,
    description: wp.description,
  }));

  const filtered = useMemo(() => {
    let result = permits;
    if (activeTab !== 'all') result = result.filter((p) => p.status === activeTab);
    if (typeFilter) result = result.filter((p) => p.type === typeFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (p) => p.number.toLowerCase().includes(lower) || p.description.toLowerCase().includes(lower) || p.contractor.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [permits, activeTab, typeFilter, search]);

  const activeCount = permits.filter((p) => p.status === 'ACTIVE').length;
  const expiredCount = permits.filter((p) => p.status === 'EXPIRED').length;

  const columns = useMemo<ColumnDef<WorkPermit, unknown>[]>(() => [
    {
      accessorKey: 'number',
      header: '№',
      size: 120,
      cell: ({ getValue }) => <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'description',
      header: 'Описание',
      size: 260,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.description}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.location} - {row.original.projectName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Тип',
      size: 170,
      cell: ({ getValue }) => <span className="text-neutral-600">{permitTypeLabels[getValue<string>()] ?? getValue<string>()}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      size: 130,
      cell: ({ getValue }) => (
        <StatusBadge status={getValue<string>()} colorMap={statusColorMap} label={statusLabels[getValue<string>()]} />
      ),
    },
    {
      accessorKey: 'contractor',
      header: 'Подрядчик',
      size: 160,
    },
    {
      accessorKey: 'startDate',
      header: 'Начало',
      size: 110,
      cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
    },
    {
      accessorKey: 'endDate',
      header: 'Окончание',
      size: 110,
      cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
    },
  ], []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Наряд-допуски"
        subtitle={`${permits.length} наряд-допусков`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'ПТО' },
          { label: 'Наряд-допуски' },
        ]}
        actions={<Button iconLeft={<Plus size={16} />}>Новый наряд-допуск</Button>}
        tabs={[
          { id: 'all', label: 'Все', count: permits.length },
          { id: 'ACTIVE', label: 'Действующие', count: activeCount },
          { id: 'PENDING', label: 'Ожидающие' },
          { id: 'EXPIRED', label: 'Просроченные', count: expiredCount },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard icon={<ShieldCheck size={18} />} label="Всего допусков" value={permits.length} />
        <MetricCard icon={<ShieldCheck size={18} />} label="Действующих" value={activeCount} />
        <MetricCard icon={<ShieldCheck size={18} />} label="Просрочено" value={expiredCount} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          options={[
            { value: '', label: 'Все типы' },
            ...Object.entries(permitTypeLabels).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-52"
        />
      </div>

      <DataTable<WorkPermit>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет наряд-допусков"
        emptyDescription="Создайте первый наряд-допуск"
      />
    </div>
  );
};

export default WorkPermitListPage;
