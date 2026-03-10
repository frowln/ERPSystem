import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Layers } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input } from '@/design-system/components/FormField';
import { cdeApi } from '@/api/cde';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { RevisionSet } from './types';
import type { PaginatedResponse } from '@/types';

const RevisionSetListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: setsData, isLoading } = useQuery<PaginatedResponse<RevisionSet>>({
    queryKey: ['revision-sets'],
    queryFn: () => cdeApi.getRevisionSets(),
  });

  const sets = setsData?.content ?? [];

  const filtered = useMemo(() => {
    if (!search) return sets;
    const lower = search.toLowerCase();
    return sets.filter(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        (s.description?.toLowerCase().includes(lower) ?? false) ||
        (s.issuedByName?.toLowerCase().includes(lower) ?? false) ||
        (s.projectName?.toLowerCase().includes(lower) ?? false),
    );
  }, [sets, search]);

  const issuedCount = useMemo(
    () => sets.filter((s) => s.issuedDate).length,
    [sets],
  );

  const columns = useMemo<ColumnDef<RevisionSet, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('cde.revisionSets.colName'),
        size: 250,
        cell: ({ getValue }) => (
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</p>
        ),
      },
      {
        accessorKey: 'description',
        header: t('cde.revisionSets.colDescription'),
        size: 300,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400 truncate block max-w-[280px]">
            {getValue<string>() || '---'}
          </span>
        ),
      },
      {
        accessorKey: 'revisionCount',
        header: t('cde.revisionSets.colRevisionCount'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'issuedDate',
        header: t('cde.revisionSets.colIssuedDate'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue<string>() ? formatDate(getValue<string>()) : '---'}</span>
        ),
      },
      {
        accessorKey: 'issuedByName',
        header: t('cde.revisionSets.colIssuedBy'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400">{getValue<string>() || '---'}</span>
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('cde.revisionSets.colProject'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400">{getValue<string>() || '---'}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (s: RevisionSet) => navigate(`/cde/revision-sets/${s.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('cde.revisionSets.title')}
        subtitle={`${sets.length} ${t('cde.revisionSets.subtitleSuffix')}`}
        breadcrumbs={[
          { label: t('cde.breadcrumbHome'), href: '/' },
          { label: t('cde.breadcrumbCDE'), href: '/cde/documents' },
          { label: t('cde.revisionSets.breadcrumbRevisionSets') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/cde/revision-sets/new')}>
            {t('cde.revisionSets.createSet')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Layers size={18} />} label={t('cde.revisionSets.metricTotal')} value={sets.length} />
        <MetricCard label={t('cde.revisionSets.metricIssued')} value={issuedCount} subtitle={t('cde.revisionSets.metricIssuedSubtitle')} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('cde.revisionSets.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable<RevisionSet>
        data={filtered}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('cde.revisionSets.emptyTitle')}
        emptyDescription={t('cde.revisionSets.emptyDescription')}
      />
    </div>
  );
};

export default RevisionSetListPage;
