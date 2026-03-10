import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, FolderOpen } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { bimApi, type DesignPackage } from '@/api/bim';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';

const statusColorMap: Record<string, 'green' | 'yellow' | 'blue' | 'gray' | 'red' | 'purple'> = {
  draft: 'gray',
  issued: 'blue',
  in_review: 'yellow',
  approved: 'green',
  rejected: 'red',
  superseded: 'purple',
};
const getStatusLabels = (): Record<string, string> => ({
  draft: t('bim.packageStatusDraft'),
  issued: t('bim.packageStatusIssued'),
  in_review: t('bim.packageStatusInReview'),
  approved: t('bim.packageStatusApproved'),
  rejected: t('bim.packageStatusRejected'),
  superseded: t('bim.packageStatusSuperseded'),
});

const getSectionLabels = (): Record<string, string> => ({
  AR: t('bim.sectionAR'),
  KR: t('bim.sectionKR'),
  OV: t('bim.sectionOV'),
  VK: t('bim.sectionVK'),
  ES: t('bim.sectionES'),
  SS: t('bim.sectionSS'),
  GP: t('bim.sectionGP'),
});

const DesignPackagePage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState('');

  const navigate = useNavigate();
  const { data: packagesData, isLoading } = useQuery({
    queryKey: ['design-packages'],
    queryFn: () => bimApi.getDesignPackages(),
  });

  const packages = packagesData?.content ?? [];

  const filtered = useMemo(() => {
    let result = packages;
    if (activeTab !== 'all') result = result.filter((p) => p.status === activeTab);
    if (sectionFilter) result = result.filter((p) => p.section === sectionFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(lower) || p.code.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [packages, activeTab, sectionFilter, search]);

  const tabCounts = useMemo(() => ({
    all: packages.length,
    in_review: packages.filter((p) => p.status === 'IN_REVIEW').length,
    approved: packages.filter((p) => p.status === 'APPROVED').length,
    rejected: packages.filter((p) => p.status === 'REJECTED').length,
  }), [packages]);

  const columns = useMemo<ColumnDef<DesignPackage, unknown>[]>(() => {
    const secLabels = getSectionLabels();
    const stLabels = getStatusLabels();
    return [
    {
      accessorKey: 'code',
      header: t('bim.colCipher'),
      size: 100,
      cell: ({ getValue }) => <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'name',
      header: t('bim.colPackageName'),
      size: 280,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'section',
      header: t('bim.colSection'),
      size: 180,
      cell: ({ getValue }) => <span className="text-neutral-600">{secLabels[getValue<string>()] ?? getValue<string>()}</span>,
    },
    {
      accessorKey: 'revision',
      header: t('bim.colRevision'),
      size: 80,
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'sheetsCount',
      header: t('bim.colSheets'),
      size: 80,
      cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span>,
    },
    {
      accessorKey: 'status',
      header: t('bim.colPackageStatus'),
      size: 130,
      cell: ({ getValue }) => (
        <StatusBadge status={getValue<string>()} colorMap={statusColorMap} label={stLabels[getValue<string>()]} />
      ),
    },
    {
      accessorKey: 'reviewer',
      header: t('bim.colReviewerPackage'),
      size: 160,
    },
    {
      accessorKey: 'issueDate',
      header: t('bim.colIssueDate'),
      size: 120,
      cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
    },
  ]; }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('bim.packagesTitle')}
        subtitle={t('bim.packagesSubtitle', { count: String(packages.length) })}
        breadcrumbs={[
          { label: t('bim.breadcrumbHome'), href: '/' },
          { label: t('bim.breadcrumbBim') },
          { label: t('bim.breadcrumbPackages') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/bim/packages/new')}>{t('bim.newPackage')}</Button>
        }
        tabs={[
          { id: 'all', label: t('bim.tabAll'), count: tabCounts.all },
          { id: 'IN_REVIEW', label: t('bim.tabInReview'), count: tabCounts.in_review },
          { id: 'APPROVED', label: t('bim.tabApproved'), count: tabCounts.approved },
          { id: 'REJECTED', label: t('bim.tabRejected'), count: tabCounts.rejected },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('bim.searchPackagePlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          options={[
            { value: '', label: t('bim.filterAllSections') },
            ...Object.entries(getSectionLabels()).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="w-56"
        />
      </div>

      <DataTable<DesignPackage>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('bim.emptyPackagesTitle')}
        emptyDescription={t('bim.emptyPackagesDescription')}
      />
    </div>
  );
};

export default DesignPackagePage;
