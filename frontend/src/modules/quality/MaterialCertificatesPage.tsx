import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Plus, ShieldCheck, FileCheck, AlertTriangle, Clock } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { certificatesApi } from '@/api/certificates';
import { formatDate, formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import type { MaterialCertificate, CertificateType, CertificateStatus } from './types';

const certStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  draft: 'gray',
  valid: 'green',
  expired: 'red',
  revoked: 'red',
  pending_verification: 'yellow',
};

const getCertStatusLabels = (): Record<string, string> => ({
  draft: t('quality.materialCerts.statusDraft'),
  valid: t('quality.materialCerts.statusValid'),
  expired: t('quality.materialCerts.statusExpired'),
  revoked: t('quality.materialCerts.statusRevoked'),
  pending_verification: t('quality.materialCerts.statusPendingVerification'),
});

const certTypeColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  quality: 'blue',
  conformity: 'green',
  origin: 'purple',
  fire_safety: 'red',
  sanitary: 'cyan',
  test_report: 'orange',
  passport: 'yellow',
  other: 'gray',
};

const getCertTypeLabels = (): Record<string, string> => ({
  quality: t('quality.materialCerts.typeQuality'),
  conformity: t('quality.materialCerts.typeConformity'),
  origin: t('quality.materialCerts.typeOrigin'),
  fire_safety: t('quality.materialCerts.typeFireSafety'),
  sanitary: t('quality.materialCerts.typeSanitary'),
  test_report: t('quality.materialCerts.typeTestReport'),
  passport: t('quality.materialCerts.typePassport'),
  other: t('quality.materialCerts.typeOther'),
});

type TabId = 'all' | 'VALID' | 'EXPIRED' | 'PENDING_VERIFICATION';

const getStatusFilterOptions = () => [
  { value: '', label: t('quality.materialCerts.filterAllStatuses') },
  { value: 'DRAFT', label: t('quality.materialCerts.statusDraft') },
  { value: 'VALID', label: t('quality.materialCerts.statusValid') },
  { value: 'EXPIRED', label: t('quality.materialCerts.statusExpired') },
  { value: 'REVOKED', label: t('quality.materialCerts.statusRevoked') },
  { value: 'PENDING_VERIFICATION', label: t('quality.materialCerts.statusPendingVerification') },
];

const getTypeFilterOptions = () => [
  { value: '', label: t('quality.materialCerts.filterAllTypes') },
  { value: 'QUALITY', label: t('quality.materialCerts.typeQuality') },
  { value: 'CONFORMITY', label: t('quality.materialCerts.typeConformity') },
  { value: 'FIRE_SAFETY', label: t('quality.materialCerts.typeFireSafety') },
  { value: 'TEST_REPORT', label: t('quality.materialCerts.typeTestReport') },
  { value: 'PASSPORT', label: t('quality.materialCerts.typePassport') },
  { value: 'OTHER', label: t('quality.materialCerts.typeOther') },
];

const MaterialCertificatesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['material-certificates'],
    queryFn: () => certificatesApi.getCertificates(),
  });

  const certificates = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = certificates;
    if (activeTab !== 'all') result = result.filter((c) => c.status === activeTab);
    if (typeFilter) result = result.filter((c) => c.certificateType === typeFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.number.toLowerCase().includes(lower) ||
          c.name.toLowerCase().includes(lower) ||
          c.materialName.toLowerCase().includes(lower) ||
          c.supplierName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [certificates, activeTab, typeFilter, search]);

  const tabCounts = useMemo(() => ({
    all: certificates.length,
    valid: certificates.filter((c) => c.status === 'VALID').length,
    expired: certificates.filter((c) => c.status === 'EXPIRED').length,
    pending_verification: certificates.filter((c) => c.status === 'PENDING_VERIFICATION').length,
  }), [certificates]);

  const metrics = useMemo(() => ({
    total: certificates.length,
    valid: certificates.filter((c) => c.status === 'VALID').length,
    expired: certificates.filter((c) => c.status === 'EXPIRED').length,
    pending: certificates.filter((c) => c.status === 'PENDING_VERIFICATION').length,
  }), [certificates]);

  const columns = useMemo<ColumnDef<MaterialCertificate, unknown>[]>(
    () => {
      const certStatusLabels = getCertStatusLabels();
      const certTypeLabels = getCertTypeLabels();
      return [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 110,
        cell: ({ getValue }) => <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'name',
        header: t('quality.materialCerts.colName'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.materialName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'certificateType',
        header: t('quality.materialCerts.colType'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={certTypeColorMap}
            label={certTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'status',
        header: t('quality.materialCerts.colStatus'),
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
        accessorKey: 'supplierName',
        header: t('quality.materialCerts.colSupplier'),
        size: 180,
        cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'issuedDate',
        header: t('quality.materialCerts.colIssuedDate'),
        size: 110,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>,
      },
      {
        accessorKey: 'validUntil',
        header: t('quality.materialCerts.colValidUntil'),
        size: 120,
        cell: ({ row }) => {
          const val = row.original.validUntil;
          if (!val) return <span className="text-neutral-400">---</span>;
          const isExpired = new Date(val) < new Date();
          return (
            <span className={`tabular-nums ${isExpired ? 'text-danger-600 font-medium' : 'text-neutral-700 dark:text-neutral-300'}`}>
              {formatDate(val)}
            </span>
          );
        },
      },
      {
        accessorKey: 'lineCount',
        header: t('quality.materialCerts.colParameters'),
        size: 100,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-500 dark:text-neutral-400">{getValue<number>()}</span>,
      },
    ];
    },
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('quality.materialCerts.title')}
        subtitle={t('quality.materialCerts.subtitle', { count: String(certificates.length) })}
        breadcrumbs={[
          { label: t('quality.materialCerts.breadcrumbHome'), href: '/' },
          { label: t('quality.materialCerts.breadcrumbQuality'), href: '/quality' },
          { label: t('quality.materialCerts.breadcrumbCertificates') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />}>{t('quality.materialCerts.btnNewCertificate')}</Button>
        }
        tabs={[
          { id: 'all', label: t('quality.materialCerts.tabAll'), count: tabCounts.all },
          { id: 'VALID', label: t('quality.materialCerts.tabValid'), count: tabCounts.valid },
          { id: 'EXPIRED', label: t('quality.materialCerts.tabExpired'), count: tabCounts.expired },
          { id: 'PENDING_VERIFICATION', label: t('quality.materialCerts.tabPendingVerification'), count: tabCounts.pending_verification },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<ShieldCheck size={18} />} label={t('quality.materialCerts.metricTotal')} value={metrics.total} />
        <MetricCard icon={<FileCheck size={18} />} label={t('quality.materialCerts.metricValid')} value={metrics.valid} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('quality.materialCerts.metricExpired')}
          value={metrics.expired}
          trend={{ direction: metrics.expired > 0 ? 'down' : 'neutral', value: metrics.expired > 0 ? t('quality.materialCerts.trendNeedUpdate') : t('quality.materialCerts.trendNone') }}
        />
        <MetricCard icon={<Clock size={18} />} label={t('quality.materialCerts.metricPending')} value={metrics.pending} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('quality.materialCerts.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select options={getTypeFilterOptions()} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-48" />
      </div>

      <DataTable<MaterialCertificate>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('quality.materialCerts.emptyTitle')}
        emptyDescription={t('quality.materialCerts.emptyDescription')}
      />
    </div>
  );
};

export default MaterialCertificatesPage;
