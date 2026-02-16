import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Send } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { cdeApi } from '@/api/cde';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { Transmittal, TransmittalStatus, TransmittalPurpose } from './types';
import type { PaginatedResponse } from '@/types';

const transmittalStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'orange'> = {
  DRAFT: 'gray',
  ISSUED: 'blue',
  ACKNOWLEDGED: 'yellow',
  RESPONDED: 'green',
  CLOSED: 'gray',
};

const getTransmittalStatusLabels = (): Record<string, string> => ({
  DRAFT: t('cde.statusDraft'),
  ISSUED: t('cde.statusIssued'),
  ACKNOWLEDGED: t('cde.statusAcknowledged'),
  RESPONDED: t('cde.statusResponded'),
  CLOSED: t('cde.statusClosed'),
});

const getPurposeLabels = (): Record<string, string> => ({
  FOR_INFORMATION: t('cde.purposeForInformation'),
  FOR_REVIEW: t('cde.purposeForReview'),
  FOR_APPROVAL: t('cde.purposeForApproval'),
  FOR_CONSTRUCTION: t('cde.purposeForConstruction'),
  AS_BUILT: t('cde.purposeAsBuilt'),
});

const TransmittalListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('');

  const { data: transmittalsData, isLoading } = useQuery<PaginatedResponse<Transmittal>>({
    queryKey: ['transmittals'],
    queryFn: () => cdeApi.getTransmittals(),
  });

  const transmittals = transmittalsData?.content ?? [];

  const filtered = useMemo(() => {
    let result = transmittals;
    if (statusFilter) result = result.filter((t) => t.status === statusFilter);
    if (purposeFilter) result = result.filter((t) => t.purpose === purposeFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.number.toLowerCase().includes(lower) ||
          t.subject.toLowerCase().includes(lower) ||
          t.fromOrgName.toLowerCase().includes(lower) ||
          t.toOrgName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [transmittals, statusFilter, purposeFilter, search]);

  const transmittalStatusLabels = getTransmittalStatusLabels();
  const purposeLabels = getPurposeLabels();

  const columns = useMemo<ColumnDef<Transmittal, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('cde.transmittals.colNumber'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'subject',
        header: t('cde.transmittals.colSubject'),
        size: 300,
        cell: ({ getValue }) => (
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</p>
        ),
      },
      {
        accessorKey: 'purpose',
        header: t('cde.transmittals.colPurpose'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{purposeLabels[getValue<string>()] ?? getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('cde.transmittals.colStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={transmittalStatusColorMap}
            label={transmittalStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'fromOrgName',
        header: t('cde.transmittals.colFrom'),
        size: 180,
      },
      {
        accessorKey: 'toOrgName',
        header: t('cde.transmittals.colTo'),
        size: 180,
      },
      {
        accessorKey: 'issuedDate',
        header: t('cde.transmittals.colIssuedDate'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'itemCount',
        header: t('cde.transmittals.colItemCount'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600">{getValue<number>()}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (t: Transmittal) => navigate(`/cde/transmittals/${t.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('cde.transmittals.title')}
        subtitle={`${transmittals.length} ${t('cde.transmittals.subtitleSuffix')}`}
        breadcrumbs={[
          { label: t('cde.breadcrumbHome'), href: '/' },
          { label: t('cde.breadcrumbCDE'), href: '/cde/documents' },
          { label: t('cde.transmittals.breadcrumbTransmittals') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />}>
            {t('cde.transmittals.createTransmittal')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Send size={18} />} label={t('cde.transmittals.metricTotal')} value={transmittals.length} />
        <MetricCard label={t('cde.transmittals.metricIssued')} value={transmittals.filter((t) => t.status === 'ISSUED').length} subtitle={t('cde.transmittals.metricIssuedSubtitle')} />
        <MetricCard label={t('cde.transmittals.metricResponded')} value={transmittals.filter((t) => t.status === 'RESPONDED').length} />
        <MetricCard label={t('cde.transmittals.metricClosed')} value={transmittals.filter((t) => t.status === 'CLOSED').length} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('cde.transmittals.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('cde.transmittals.filterAllStatuses') },
            ...Object.entries(transmittalStatusLabels).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        />
        <Select
          options={[
            { value: '', label: t('cde.transmittals.filterAllPurposes') },
            ...Object.entries(purposeLabels).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={purposeFilter}
          onChange={(e) => setPurposeFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable<Transmittal>
        data={filtered}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('cde.transmittals.emptyTitle')}
        emptyDescription={t('cde.transmittals.emptyDescription')}
      />
    </div>
  );
};

export default TransmittalListPage;
