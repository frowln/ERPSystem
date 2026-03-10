import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { bimApi, type Clash } from '@/api/bim';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';

const severityColorMap: Record<string, 'red' | 'orange' | 'yellow' | 'gray'> = {
  critical: 'red',
  major: 'orange',
  minor: 'yellow',
  info: 'gray',
};
const getSeverityLabels = (): Record<string, string> => ({
  critical: t('bim.severityCritical'),
  major: t('bim.severityMajor'),
  minor: t('bim.severityMinor'),
  info: t('bim.severityInfo'),
});

const clashStatusColorMap: Record<string, 'red' | 'yellow' | 'blue' | 'green' | 'gray'> = {
  new: 'red',
  in_progress: 'yellow',
  resolved: 'green',
  approved: 'blue',
  ignored: 'gray',
};
const getClashStatusLabels = (): Record<string, string> => ({
  new: t('bim.clashStatusNew'),
  in_progress: t('bim.clashStatusInProgress'),
  resolved: t('bim.clashStatusResolved'),
  approved: t('bim.clashStatusApproved'),
  ignored: t('bim.clashStatusIgnored'),
});

const ClashDetectionPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState('');

  const { data: clashesData, isLoading } = useQuery({
    queryKey: ['clashes'],
    queryFn: () => bimApi.getClashes(),
  });

  const clashes = clashesData?.content ?? [];

  const filtered = useMemo(() => {
    let result = clashes;
    if (activeTab === 'OPEN') result = result.filter((c) => c.status === 'NEW' || c.status === 'IN_PROGRESS');
    else if (activeTab !== 'all') result = result.filter((c) => c.status === activeTab);
    if (severityFilter) result = result.filter((c) => c.severity === severityFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (c) => c.description.toLowerCase().includes(lower) || c.code.toLowerCase().includes(lower) || c.location.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [clashes, activeTab, severityFilter, search]);

  const openCount = clashes.filter((c) => c.status === 'NEW' || c.status === 'IN_PROGRESS').length;
  const resolvedCount = clashes.filter((c) => c.status === 'RESOLVED' || c.status === 'APPROVED').length;
  const criticalCount = clashes.filter((c) => c.severity === 'CRITICAL' && c.status !== 'RESOLVED' && c.status !== 'APPROVED' && c.status !== 'IGNORED').length;

  const columns = useMemo<ColumnDef<Clash, unknown>[]>(() => {
    const sevLabels = getSeverityLabels();
    const statusLabels = getClashStatusLabels();
    return [
    {
      accessorKey: 'code',
      header: t('bim.colClashCode'),
      size: 80,
      cell: ({ getValue }) => <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'description',
      header: t('bim.colDescription'),
      size: 280,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.description}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.location}</p>
        </div>
      ),
    },
    {
      accessorKey: 'severity',
      header: t('bim.colSeverity'),
      size: 130,
      cell: ({ getValue }) => (
        <StatusBadge status={getValue<string>()} colorMap={severityColorMap} label={sevLabels[getValue<string>()]} />
      ),
    },
    {
      accessorKey: 'status',
      header: t('bim.colClashStatus'),
      size: 120,
      cell: ({ getValue }) => (
        <StatusBadge status={getValue<string>()} colorMap={clashStatusColorMap} label={statusLabels[getValue<string>()]} />
      ),
    },
    {
      id: 'disciplines',
      header: t('bim.colDisciplines'),
      size: 120,
      cell: ({ row }) => (
        <span className="text-sm text-neutral-600">{row.original.discipline1} / {row.original.discipline2}</span>
      ),
    },
    {
      accessorKey: 'assignedTo',
      header: t('bim.colAssignedTo'),
      size: 140,
      cell: ({ getValue }) => getValue<string>() || <span className="text-neutral-400">{t('bim.notAssigned')}</span>,
    },
    {
      accessorKey: 'detectedDate',
      header: t('bim.colDetectedDate'),
      size: 110,
      cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
    },
  ]; }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('bim.clashTitle')}
        subtitle={t('bim.clashSubtitle', { count: String(clashes.length) })}
        breadcrumbs={[
          { label: t('bim.breadcrumbHome'), href: '/' },
          { label: t('bim.breadcrumbBim') },
          { label: t('bim.breadcrumbClashes') },
        ]}
        actions={
          <Button variant="secondary" iconLeft={<AlertTriangle size={16} />} onClick={() => toast(t('common.operationStarted'))}>{t('bim.runCheck')}</Button>
        }
        tabs={[
          { id: 'all', label: t('bim.tabAll'), count: clashes.length },
          { id: 'OPEN', label: t('bim.tabOpen'), count: openCount },
          { id: 'RESOLVED', label: t('bim.tabResolved'), count: resolvedCount },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard icon={<AlertTriangle size={18} />} label={t('bim.metricOpenClashes')} value={openCount} />
        <MetricCard icon={<XCircle size={18} />} label={t('bim.metricCriticalOpen')} value={criticalCount} />
        <MetricCard icon={<CheckCircle size={18} />} label={t('bim.metricResolved')} value={resolvedCount} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('bim.searchClashPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          options={[
            { value: '', label: t('bim.filterAllSeverities') },
            ...Object.entries(getSeverityLabels()).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable<Clash>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('bim.emptyClashTitle')}
        emptyDescription={t('bim.emptyClashDescription')}
      />
    </div>
  );
};

export default ClashDetectionPage;
