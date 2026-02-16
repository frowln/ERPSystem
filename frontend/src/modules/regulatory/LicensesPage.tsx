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
import { t } from '@/i18n';

const getLicenseTypeLabels = (): Record<string, string> => ({
  sro_construction: t('regulatory.licTypeSroConstruction'),
  sro_design: t('regulatory.licTypeSroDesign'),
  sro_engineering: t('regulatory.licTypeSroEngineering'),
  special_permit: t('regulatory.licTypeSpecialPermit'),
  other: t('regulatory.licTypeOther'),
});

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
        header: t('regulatory.colNumber'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('regulatory.colName'),
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
        header: t('regulatory.colType'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-700 dark:text-neutral-300">{getLicenseTypeLabels()[getValue<string>()] ?? getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('regulatory.colStatus'),
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
        header: t('regulatory.colValidUntil'),
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
        header: t('regulatory.colMaxContractAmount'),
        size: 150,
        cell: ({ getValue }) => {
          const val = getValue<number | undefined>();
          return <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{val ? formatMoney(val) : '---'}</span>;
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
    (license: License) => navigate(`/regulatory/licenses/${license.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('regulatory.licensesTitle')}
        subtitle={t('regulatory.licensesSubtitle', { count: String(licenses.length) })}
        breadcrumbs={[
          { label: t('regulatory.breadcrumbHome'), href: '/' },
          { label: t('regulatory.breadcrumbRegulatory'), href: '/regulatory' },
          { label: t('regulatory.btnLicenses') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/regulatory/licenses/new')}>
            {t('regulatory.btnAddLicense')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('regulatory.tabAll'), count: tabCounts.all },
          { id: 'ACTIVE', label: t('regulatory.metricActiveLicenses'), count: tabCounts.active },
          { id: 'EXPIRING_SOON', label: t('regulatory.tabExpiringSoon'), count: tabCounts.expiring_soon },
          { id: 'EXPIRED', label: t('regulatory.tabExpired'), count: tabCounts.expired },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Award size={18} />} label={t('regulatory.metricTotalLicenses')} value={licenses.length} />
        <MetricCard icon={<CheckCircle size={18} />} label={t('regulatory.metricActiveLicenses')} value={tabCounts.active} />
        <MetricCard icon={<Clock size={18} />} label={t('regulatory.metricExpiringLicenses')} value={tabCounts.expiring_soon}
          trend={tabCounts.expiring_soon > 0 ? { direction: 'down', value: t('regulatory.trendNeedRenewal') } : undefined} />
        <MetricCard icon={<AlertTriangle size={18} />} label={t('regulatory.metricExpiredLicenses')} value={tabCounts.expired} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('regulatory.searchLicensePlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
        emptyTitle={t('regulatory.emptyLicenses')}
        emptyDescription={t('regulatory.emptyLicensesDesc')}
      />
    </div>
  );
};

export default LicensesPage;
