import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Shield, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  permitStatusColorMap,
  permitStatusLabels,
  permitTypeColorMap,
  permitTypeLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { regulatoryApi } from '@/api/regulatory';
import { formatDate } from '@/lib/format';
import type { RegulatoryPermit } from './types';
import type { PaginatedResponse } from '@/types';

type TabId = 'all' | 'ACTIVE' | 'PENDING' | 'EXPIRED';

const typeFilterOptions = [
  { value: '', label: 'Все типы' },
  { value: 'BUILDING_PERMIT', label: 'Разрешение на строительство' },
  { value: 'EXCAVATION_PERMIT', label: 'Земляные работы' },
  { value: 'ROSTECHNADZOR', label: 'Ростехнадзор' },
  { value: 'FIRE_SAFETY', label: 'Пожарная безопасность' },
  { value: 'ENVIRONMENTAL_PERMIT', label: 'Экологическое' },
  { value: 'SANITARY', label: 'Санитарное' },
];


const PermitsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: permitData, isLoading } = useQuery<PaginatedResponse<RegulatoryPermit>>({
    queryKey: ['permits'],
    queryFn: () => regulatoryApi.getPermits(),
  });

  const permits = permitData?.content ?? [];

  const filteredPermits = useMemo(() => {
    let filtered = permits;
    if (activeTab === 'ACTIVE') filtered = filtered.filter((p) => p.status === 'ACTIVE');
    else if (activeTab === 'PENDING') filtered = filtered.filter((p) => ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(p.status));
    else if (activeTab === 'EXPIRED') filtered = filtered.filter((p) => ['EXPIRED', 'REVOKED'].includes(p.status));
    if (typeFilter) filtered = filtered.filter((p) => p.permitType === typeFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.number.toLowerCase().includes(lower) ||
          p.name.toLowerCase().includes(lower) ||
          (p.projectName ?? '').toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [permits, activeTab, typeFilter, search]);

  const tabCounts = useMemo(() => ({
    all: permits.length,
    active: permits.filter((p) => p.status === 'ACTIVE').length,
    pending: permits.filter((p) => ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(p.status)).length,
    expired: permits.filter((p) => ['EXPIRED', 'REVOKED'].includes(p.status)).length,
  }), [permits]);

  const metrics = useMemo(() => ({
    total: permits.length,
    active: permits.filter((p) => p.status === 'ACTIVE').length,
    expiringSoon: permits.filter((p) => {
      if (p.status !== 'ACTIVE' || !p.validUntil) return false;
      const daysLeft = (new Date(p.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysLeft > 0 && daysLeft <= 90;
    }).length,
    expired: permits.filter((p) => p.status === 'EXPIRED').length,
  }), [permits]);

  const columns = useMemo<ColumnDef<RegulatoryPermit, unknown>[]>(
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
        header: 'Наименование',
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName ?? '---'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'permitType',
        header: 'Тип',
        size: 180,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={permitTypeColorMap}
            label={permitTypeLabels[getValue<string>()] ?? getValue<string>()}
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
            colorMap={permitStatusColorMap}
            label={permitStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'validUntil',
        header: 'Действует до',
        size: 120,
        cell: ({ row }) => {
          const validUntil = row.original.validUntil;
          if (!validUntil) return <span className="text-neutral-400">---</span>;
          const isExpiring = new Date(validUntil) < new Date();
          return (
            <span className={isExpiring ? 'text-danger-600 font-medium tabular-nums' : 'tabular-nums text-neutral-700 dark:text-neutral-300'}>
              {formatDate(validUntil)}
            </span>
          );
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
    (permit: RegulatoryPermit) => navigate(`/regulatory/permits/${permit.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Разрешения и допуски"
        subtitle={`${permits.length} разрешений в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Регуляторика', href: '/regulatory' },
          { label: 'Разрешения' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/regulatory/permits/new')}>
            Новое разрешение
          </Button>
        }
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'ACTIVE', label: 'Действующие', count: tabCounts.active },
          { id: 'PENDING', label: 'На рассмотрении', count: tabCounts.pending },
          { id: 'EXPIRED', label: 'Истекшие', count: tabCounts.expired },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Shield size={18} />} label="Всего разрешений" value={metrics.total} />
        <MetricCard icon={<CheckCircle size={18} />} label="Действующие" value={metrics.active} />
        <MetricCard icon={<Clock size={18} />} label="Истекают в 90 дней" value={metrics.expiringSoon}
          trend={metrics.expiringSoon > 0 ? { direction: 'down', value: 'Требуют продления' } : undefined} />
        <MetricCard icon={<AlertTriangle size={18} />} label="Истекшие" value={metrics.expired}
          trend={metrics.expired > 0 ? { direction: 'down', value: 'Требуют обновления' } : undefined} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск по номеру, названию..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select options={typeFilterOptions} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-56" />
      </div>

      <DataTable<RegulatoryPermit>
        data={filteredPermits}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет разрешений"
        emptyDescription="Добавьте первое разрешение для начала учёта"
      />
    </div>
  );
};

export default PermitsPage;
