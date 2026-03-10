import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { t } from '@/i18n';

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

const getContractTypeLabels = (): Record<string, string> => ({
  permanent: t('hrRussian.contracts.typePermanent'),
  fixed_term: t('hrRussian.contracts.typeFixedTerm'),
  part_time: t('hrRussian.contracts.typePartTime'),
  civil: t('hrRussian.contracts.typeCivil'),
});

const statusColorMap: Record<string, 'green' | 'yellow' | 'blue' | 'gray' | 'red'> = {
  active: 'green',
  trial: 'yellow',
  suspended: 'orange' as 'yellow',
  terminated: 'gray',
  expired: 'red',
};

const getStatusLabels = (): Record<string, string> => ({
  active: t('hrRussian.contracts.statusActive'),
  trial: t('hrRussian.contracts.statusTrial'),
  suspended: t('hrRussian.contracts.statusSuspended'),
  terminated: t('hrRussian.contracts.statusTerminated'),
  expired: t('hrRussian.contracts.statusExpired'),
});


const EmploymentContractListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState('');

  const navigate = useNavigate();
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

  const columns = useMemo<ColumnDef<EmploymentContract, unknown>[]>(() => {
    const contractTypeLabels = getContractTypeLabels();
    const statusLabels = getStatusLabels();
    return [
      {
        accessorKey: 'number',
        header: t('hrRussian.contracts.colNumber'),
        size: 120,
        cell: ({ getValue }) => <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'employeeName',
        header: t('hrRussian.contracts.colEmployee'),
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
        header: t('hrRussian.contracts.colDepartment'),
        size: 160,
      },
      {
        accessorKey: 'contractType',
        header: t('hrRussian.contracts.colType'),
        size: 130,
        cell: ({ getValue }) => <span className="text-neutral-600">{contractTypeLabels[getValue<string>()]}</span>,
      },
      {
        accessorKey: 'status',
        header: t('hrRussian.contracts.colStatus'),
        size: 150,
        cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={statusColorMap} label={statusLabels[getValue<string>()]} />,
      },
      {
        accessorKey: 'startDate',
        header: t('hrRussian.contracts.colStartDate'),
        size: 110,
        cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
      },
      {
        accessorKey: 'salary',
        header: t('hrRussian.contracts.colSalary'),
        size: 130,
        cell: ({ getValue }) => <span className="tabular-nums font-medium text-right block">{formatMoney(getValue<number>())}</span>,
      },
    ];
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('hrRussian.contracts.title')}
        subtitle={t('hrRussian.contracts.subtitleContracts', { count: String(contracts.length) })}
        breadcrumbs={[
          { label: t('hrRussian.contracts.breadcrumbHome'), href: '/' },
          { label: t('hrRussian.contracts.breadcrumbHr') },
          { label: t('hrRussian.contracts.breadcrumbContracts') },
        ]}
        actions={<Button iconLeft={<Plus size={16} />} onClick={() => navigate('/hr-russian/contracts/new')}>{t('hrRussian.contracts.newContract')}</Button>}
        tabs={[
          { id: 'all', label: t('hrRussian.contracts.tabAll'), count: contracts.length },
          { id: 'ACTIVE', label: t('hrRussian.contracts.tabActive'), count: contracts.filter((c) => c.status === 'ACTIVE').length },
          { id: 'TRIAL', label: t('hrRussian.contracts.tabTrial'), count: contracts.filter((c) => c.status === 'TRIAL').length },
          { id: 'TERMINATED', label: t('hrRussian.contracts.tabTerminated'), count: contracts.filter((c) => c.status === 'TERMINATED').length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard icon={<FileSignature size={18} />} label={t('hrRussian.contracts.metricTotal')} value={contracts.length} />
        <MetricCard icon={<FileSignature size={18} />} label={t('hrRussian.contracts.metricActive')} value={activeCount} />
        <MetricCard icon={<FileSignature size={18} />} label={t('hrRussian.contracts.metricTrial')} value={contracts.filter((c) => c.status === 'TRIAL').length} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('hrRussian.contracts.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          options={[
            { value: '', label: t('hrRussian.contracts.allTypes') },
            ...Object.entries(getContractTypeLabels()).map(([v, l]) => ({ value: v, label: l })),
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
        emptyTitle={t('hrRussian.contracts.emptyTitle')}
        emptyDescription={t('hrRussian.contracts.emptyDescription')}
      />
    </div>
  );
};

export default EmploymentContractListPage;
