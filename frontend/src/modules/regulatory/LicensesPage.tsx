import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Award, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  licenseStatusColorMap,
  licenseStatusLabels,
} from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { regulatoryApi } from '@/api/regulatory';
import { formatDate, formatMoney } from '@/lib/format';
import type { License } from './types';
import type { PaginatedResponse } from '@/types';

const licenseTypeLabels: Record<string, string> = {
  sro_construction: 'СРО Строительство',
  sro_design: 'СРО Проектирование',
  sro_engineering: 'СРО Инженерные изыскания',
  special_permit: 'Спецразрешение',
  other: 'Прочее',
};

type TabId = 'all' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';


const LicensesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data: licenseData, isLoading } = useQuery<PaginatedResponse<License>>({
    queryKey: ['licenses'],
    queryFn: () => regulatoryApi.getLicenses(),
  });

  const licenses = licenseData?.content ?? [];

  const filteredLicenses = useMemo(() => {
    let filtered = licenses;
    if (activeTab !== 'all') filtered = filtered.filter((l) => l.status === activeTab);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.number.toLowerCase().includes(lower) ||
          l.name.toLowerCase().includes(lower) ||
          l.organizationName.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [licenses, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: licenses.length,
    active: licenses.filter((l) => l.status === 'ACTIVE').length,
    expiring_soon: licenses.filter((l) => l.status === 'EXPIRING_SOON').length,
    expired: licenses.filter((l) => l.status === 'EXPIRED').length,
  }), [licenses]);

  const columns = useMemo<ColumnDef<License, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Наименование',
        size: 260,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[240px]">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.organizationName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'licenseType',
        header: 'Тип',
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-700 dark:text-neutral-300">{licenseTypeLabels[getValue<string>()] ?? getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={licenseStatusColorMap}
            label={licenseStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'validUntil',
        header: 'Действует до',
        size: 120,
        cell: ({ row }) => {
          const date = row.original.validUntil;
          const isExpired = new Date(date) < new Date();
          return (
            <span className={isExpired ? 'text-danger-600 font-medium tabular-nums' : 'tabular-nums text-neutral-700 dark:text-neutral-300'}>
              {formatDate(date)}
            </span>
          );
        },
      },
      {
        accessorKey: 'maxContractAmount',
        header: 'Макс. сумма договора',
        size: 150,
        cell: ({ getValue }) => {
          const val = getValue<number | undefined>();
          return <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{val ? formatMoney(val) : '---'}</span>;
        },
      },
      {
        accessorKey: 'responsibleName',
        header: 'Ответственный',
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (license: License) => navigate(`/regulatory/licenses/${license.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Лицензии и допуски СРО"
        subtitle={`${licenses.length} лицензий в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Регуляторика', href: '/regulatory' },
          { label: 'Лицензии' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/regulatory/licenses/new')}>
            Добавить лицензию
          </Button>
        }
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'ACTIVE', label: 'Действующие', count: tabCounts.active },
          { id: 'EXPIRING_SOON', label: 'Истекающие', count: tabCounts.expiring_soon },
          { id: 'EXPIRED', label: 'Истекшие', count: tabCounts.expired },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Award size={18} />} label="Всего лицензий" value={licenses.length} />
        <MetricCard icon={<CheckCircle size={18} />} label="Действующие" value={tabCounts.active} />
        <MetricCard icon={<Clock size={18} />} label="Истекающие" value={tabCounts.expiring_soon}
          trend={tabCounts.expiring_soon > 0 ? { direction: 'down', value: 'Требуют продления' } : undefined} />
        <MetricCard icon={<AlertTriangle size={18} />} label="Истекшие" value={tabCounts.expired} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск по номеру, названию, организации..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable<License>
        data={filteredLicenses}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет лицензий"
        emptyDescription="Добавьте первую лицензию или допуск СРО"
      />
    </div>
  );
};

export default LicensesPage;
