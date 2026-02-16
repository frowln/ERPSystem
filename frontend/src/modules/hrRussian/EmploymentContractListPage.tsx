import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, FileSignature } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { formatDate, formatMoney } from '@/lib/format';
import { hrRussianApi } from '@/api/hrRussian';

interface EmploymentContract {
  id: string;
  number: string;
  employeeName: string;
  position: string;
  department: string;
  contractType: string;
  status: string;
  startDate: string;
  endDate: string | null;
  salary: number;
  trialPeriod: string | null;
}

const contractTypeLabels: Record<string, string> = {
  permanent: 'Бессрочный',
  fixed_term: 'Срочный',
  part_time: 'Совместительство',
  civil: 'ГПХ',
};

const statusColorMap: Record<string, 'green' | 'yellow' | 'blue' | 'gray' | 'red'> = {
  active: 'green',
  trial: 'yellow',
  suspended: 'orange' as 'yellow',
  terminated: 'gray',
  expired: 'red',
};
const statusLabels: Record<string, string> = {
  active: 'Действует',
  trial: 'Испытательный срок',
  suspended: 'Приостановлен',
  terminated: 'Расторгнут',
  expired: 'Истёк',
};


const EmploymentContractListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['employment-contracts'],
    queryFn: () => hrRussianApi.getContracts({ size: 1000 }),
  });

  const contracts: EmploymentContract[] = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = contracts;
    if (activeTab !== 'all') result = result.filter((c) => c.status === activeTab);
    if (typeFilter) result = result.filter((c) => c.contractType === typeFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (c) => c.employeeName.toLowerCase().includes(lower) || c.number.toLowerCase().includes(lower) || c.position.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [contracts, activeTab, typeFilter, search]);

  const activeCount = contracts.filter((c) => c.status === 'ACTIVE' || c.status === 'TRIAL').length;

  const columns = useMemo<ColumnDef<EmploymentContract, unknown>[]>(() => [
    {
      accessorKey: 'number',
      header: '№ договора',
      size: 120,
      cell: ({ getValue }) => <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'employeeName',
      header: 'Сотрудник',
      size: 220,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.employeeName}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.position}</p>
        </div>
      ),
    },
    {
      accessorKey: 'department',
      header: 'Подразделение',
      size: 160,
    },
    {
      accessorKey: 'contractType',
      header: 'Тип',
      size: 130,
      cell: ({ getValue }) => <span className="text-neutral-600">{contractTypeLabels[getValue<string>()]}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      size: 150,
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={statusColorMap} label={statusLabels[getValue<string>()]} />,
    },
    {
      accessorKey: 'startDate',
      header: 'Начало',
      size: 110,
      cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
    },
    {
      accessorKey: 'salary',
      header: 'Оклад',
      size: 130,
      cell: ({ getValue }) => <span className="tabular-nums font-medium text-right block">{formatMoney(getValue<number>())}</span>,
    },
  ], []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Трудовые договоры"
        subtitle={`${contracts.length} договоров`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Кадры РФ' },
          { label: 'Трудовые договоры' },
        ]}
        actions={<Button iconLeft={<Plus size={16} />}>Новый договор</Button>}
        tabs={[
          { id: 'all', label: 'Все', count: contracts.length },
          { id: 'ACTIVE', label: 'Действующие', count: contracts.filter((c) => c.status === 'ACTIVE').length },
          { id: 'TRIAL', label: 'Испытательный срок', count: contracts.filter((c) => c.status === 'TRIAL').length },
          { id: 'TERMINATED', label: 'Расторгнутые', count: contracts.filter((c) => c.status === 'TERMINATED').length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard icon={<FileSignature size={18} />} label="Всего договоров" value={contracts.length} />
        <MetricCard icon={<FileSignature size={18} />} label="Действующих" value={activeCount} />
        <MetricCard icon={<FileSignature size={18} />} label="На испытательном сроке" value={contracts.filter((c) => c.status === 'TRIAL').length} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск по ФИО, номеру, должности..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          options={[
            { value: '', label: 'Все типы' },
            ...Object.entries(contractTypeLabels).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable<EmploymentContract>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет договоров"
        emptyDescription="Создайте первый трудовой договор"
      />
    </div>
  );
};

export default EmploymentContractListPage;
