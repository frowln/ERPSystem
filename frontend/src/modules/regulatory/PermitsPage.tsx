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
import { t } from '@/i18n';

type TabId = 'all' | 'ACTIVE' | 'PENDING' | 'EXPIRED';

const getTypeFilterOptions = () => [
  { value: '', label: t('regulatory.typeFilterAll') },
  { value: 'BUILDING_PERMIT', label: t('regulatory.typeBuildingPermit') },
  { value: 'EXCAVATION_PERMIT', label: t('regulatory.typeExcavation') },
  { value: 'ROSTECHNADZOR', label: t('regulatory.typeRostechnadzor') },
  { value: 'FIRE_SAFETY', label: t('regulatory.typeFireSafety') },
  { value: 'ENVIRONMENTAL_PERMIT', label: t('regulatory.typeEnvironmental') },
  { value: 'SANITARY', label: t('regulatory.typeSanitary') },
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
        header: t('regulatory.colNumber'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('regulatory.colName'),
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
        header: t('regulatory.colType'),
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
        header: t('regulatory.colStatus'),
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
        header: t('regulatory.colValidUntil'),
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
        header: t('regulatory.colResponsible'),
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
        title={t('regulatory.permitsTitle')}
        subtitle={t('regulatory.permitsSubtitle', { count: String(permits.length) })}
        breadcrumbs={[
          { label: t('regulatory.breadcrumbHome'), href: '/' },
          { label: t('regulatory.breadcrumbRegulatory'), href: '/regulatory' },
          { label: t('regulatory.btnPermits') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/regulatory/permits/new')}>
            {t('regulatory.btnNewPermitFull')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('regulatory.tabAll'), count: tabCounts.all },
          { id: 'ACTIVE', label: t('regulatory.tabActive'), count: tabCounts.active },
          { id: 'PENDING', label: t('regulatory.tabPending'), count: tabCounts.pending },
          { id: 'EXPIRED', label: t('regulatory.tabExpired'), count: tabCounts.expired },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Shield size={18} />} label={t('regulatory.metricTotalPermits')} value={metrics.total} />
        <MetricCard icon={<CheckCircle size={18} />} label={t('regulatory.metricActive')} value={metrics.active} />
        <MetricCard icon={<Clock size={18} />} label={t('regulatory.metricExpiring90')} value={metrics.expiringSoon}
          trend={metrics.expiringSoon > 0 ? { direction: 'down', value: t('regulatory.trendNeedRenewal') } : undefined} />
        <MetricCard icon={<AlertTriangle size={18} />} label={t('regulatory.metricExpired')} value={metrics.expired}
          trend={metrics.expired > 0 ? { direction: 'down', value: t('regulatory.trendNeedUpdate') } : undefined} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('regulatory.searchPermitPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select options={getTypeFilterOptions()} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-56" />
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
        emptyTitle={t('regulatory.emptyPermits')}
        emptyDescription={t('regulatory.emptyPermitsDesc')}
      />
    </div>
  );
};

export default PermitsPage;
