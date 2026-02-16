import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, ShieldCheck, AlertTriangle, Clock, KeyRound } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { kepApi } from '@/api/kep';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { KepCertificate } from './types';
import type { PaginatedResponse } from '@/types';

const certStatusColorMap: Record<string, 'green' | 'yellow' | 'red' | 'gray' | 'orange'> = {
  active: 'green',
  expiring_soon: 'yellow',
  expired: 'red',
  revoked: 'red',
  suspended: 'orange',
};

const getCertStatusLabels = (): Record<string, string> => ({
  active: t('kep.certificates.statusActive'),
  expiring_soon: t('kep.certificates.statusExpiringSoon'),
  expired: t('kep.certificates.statusExpired'),
  revoked: t('kep.certificates.statusRevoked'),
  suspended: t('kep.certificates.statusSuspended'),
});

const getStatusFilterOptions = () => [
  { value: '', label: t('kep.certificates.allStatuses') },
  { value: 'ACTIVE', label: t('kep.certificates.statusActive') },
  { value: 'EXPIRING_SOON', label: t('kep.certificates.statusExpiringSoon') },
  { value: 'EXPIRED', label: t('kep.certificates.statusExpired') },
  { value: 'REVOKED', label: t('kep.certificates.statusRevoked') },
  { value: 'SUSPENDED', label: t('kep.certificates.statusSuspended') },
];

type TabId = 'all' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';


const KepCertificateListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: certData, isLoading } = useQuery<PaginatedResponse<KepCertificate>>({
    queryKey: ['kep-certificates'],
    queryFn: () => kepApi.getCertificates(),
  });

  const certificates = certData?.content ?? [];

  const filteredCertificates = useMemo(() => {
    let filtered = certificates;

    if (activeTab === 'ACTIVE') {
      filtered = filtered.filter((c) => c.status === 'ACTIVE');
    } else if (activeTab === 'EXPIRING_SOON') {
      filtered = filtered.filter((c) => c.status === 'EXPIRING_SOON');
    } else if (activeTab === 'EXPIRED') {
      filtered = filtered.filter((c) => c.status === 'EXPIRED' || c.status === 'REVOKED');
    }

    if (statusFilter) {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.ownerName.toLowerCase().includes(lower) ||
          c.serialNumber.toLowerCase().includes(lower) ||
          c.issuerName.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [certificates, activeTab, statusFilter, search]);

  const tabCounts = useMemo(() => ({
    all: certificates.length,
    active: certificates.filter((c) => c.status === 'ACTIVE').length,
    expiring_soon: certificates.filter((c) => c.status === 'EXPIRING_SOON').length,
    expired: certificates.filter((c) => c.status === 'EXPIRED' || c.status === 'REVOKED').length,
  }), [certificates]);

  const metrics = useMemo(() => {
    const active = certificates.filter((c) => c.status === 'ACTIVE').length;
    const expiring = certificates.filter((c) => c.status === 'EXPIRING_SOON').length;
    const expired = certificates.filter((c) => c.status === 'EXPIRED').length;
    return { total: certificates.length, active, expiring, expired };
  }, [certificates]);

  const columns = useMemo<ColumnDef<KepCertificate, unknown>[]>(
    () => [
      {
        accessorKey: 'serialNumber',
        header: 'Серийный номер',
        size: 150,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'ownerName',
        header: 'Владелец',
        size: 200,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.ownerName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.organizationName ?? '---'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'issuerName',
        header: 'Издатель',
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={certStatusColorMap}
            label={certStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'validFrom',
        header: 'Действует с',
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'validTo',
        header: 'Действует до',
        size: 120,
        cell: ({ row }) => {
          const validTo = row.original.validTo;
          const isExpired = validTo && new Date(validTo) < new Date();
          return (
            <span className={isExpired ? 'text-danger-600 font-medium tabular-nums' : 'tabular-nums text-neutral-700 dark:text-neutral-300'}>
              {formatDate(validTo)}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        size: 80,
        cell: ({ row }) => (
          <button
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/kep/certificates/${row.original.id}`);
            }}
          >
            Открыть
          </button>
        ),
      },
    ],
    [navigate],
  );

  const handleRowClick = useCallback(
    (cert: KepCertificate) => navigate(`/kep/certificates/${cert.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Сертификаты КЭП"
        subtitle={`${certificates.length} сертификатов в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'КЭП' },
          { label: 'Сертификаты' },
        ]}
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'ACTIVE', label: 'Действующие', count: tabCounts.active },
          { id: 'EXPIRING_SOON', label: 'Истекающие', count: tabCounts.expiring_soon },
          { id: 'EXPIRED', label: 'Недействительные', count: tabCounts.expired },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<KeyRound size={18} />}
          label="Всего сертификатов"
          value={metrics.total}
        />
        <MetricCard
          icon={<ShieldCheck size={18} />}
          label="Действующие"
          value={metrics.active}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label="Истекающие"
          value={metrics.expiring}
          trend={metrics.expiring > 0 ? { direction: 'down', value: 'Требуют продления' } : undefined}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label="Истёкшие"
          value={metrics.expired}
          trend={metrics.expired > 0 ? { direction: 'down', value: 'Требуют замены' } : undefined}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по владельцу, серийному номеру..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Table */}
      <DataTable<KepCertificate>
        data={filteredCertificates}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет сертификатов КЭП"
        emptyDescription="Сертификаты электронной подписи не найдены"
      />
    </div>
  );
};

export default KepCertificateListPage;
