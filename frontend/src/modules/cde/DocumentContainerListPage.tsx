import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, FileText, FileCheck, Share2, Archive } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { cdeApi } from '@/api/cde';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { DocumentContainer, LifecycleState, Classification } from './types';
import type { PaginatedResponse } from '@/types';

const lifecycleStateColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  WIP: 'yellow',
  SHARED: 'blue',
  PUBLISHED: 'green',
  ARCHIVED: 'gray',
};

const getLifecycleStateLabels = (): Record<string, string> => ({
  WIP: t('cde.lifecycleWIP'),
  SHARED: t('cde.lifecycleShared'),
  PUBLISHED: t('cde.lifecyclePublished'),
  ARCHIVED: t('cde.lifecycleArchived'),
});

const getClassificationLabels = (): Record<string, string> => ({
  PROJECT: t('cde.classificationProject'),
  DESIGN: t('cde.classificationDesign'),
  CONSTRUCTION: t('cde.classificationConstruction'),
  OPERATIONS: t('cde.classificationOperations'),
  SAFETY: t('cde.classificationSafety'),
  QUALITY: t('cde.classificationQuality'),
  FINANCIAL: t('cde.classificationFinancial'),
});

const getDisciplineLabels = (): Record<string, string> => ({
  ARCHITECTURE: t('cde.disciplineArchitecture'),
  STRUCTURAL: t('cde.disciplineStructural'),
  MEP: t('cde.disciplineMEP'),
  CIVIL: t('cde.disciplineCivil'),
  ELECTRICAL: t('cde.disciplineElectrical'),
  PLUMBING: t('cde.disciplinePlumbing'),
  FIRE_PROTECTION: t('cde.disciplineFireProtection'),
  GENERAL: t('cde.disciplineGeneral'),
});

type TabId = 'all' | 'WIP' | 'SHARED' | 'PUBLISHED' | 'ARCHIVED';

const DocumentContainerListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');

  const { data: documentsData, isLoading } = useQuery<PaginatedResponse<DocumentContainer>>({
    queryKey: ['cde-documents'],
    queryFn: () => cdeApi.getContainers(),
  });

  const documents = documentsData?.content ?? [];

  const filtered = useMemo(() => {
    let result = documents;

    if (activeTab === 'WIP') result = result.filter((d) => d.lifecycleState === 'WIP');
    else if (activeTab === 'SHARED') result = result.filter((d) => d.lifecycleState === 'SHARED');
    else if (activeTab === 'PUBLISHED') result = result.filter((d) => d.lifecycleState === 'PUBLISHED');
    else if (activeTab === 'ARCHIVED') result = result.filter((d) => d.lifecycleState === 'ARCHIVED');

    if (stateFilter) result = result.filter((d) => d.lifecycleState === stateFilter);
    if (classFilter) result = result.filter((d) => d.classification === classFilter);

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(lower) ||
          d.documentNumber.toLowerCase().includes(lower) ||
          d.authorName.toLowerCase().includes(lower),
      );
    }

    return result;
  }, [documents, activeTab, stateFilter, classFilter, search]);

  const counts = useMemo(() => ({
    all: documents.length,
    wip: documents.filter((d) => d.lifecycleState === 'WIP').length,
    shared: documents.filter((d) => d.lifecycleState === 'SHARED').length,
    published: documents.filter((d) => d.lifecycleState === 'PUBLISHED').length,
    archived: documents.filter((d) => d.lifecycleState === 'ARCHIVED').length,
  }), [documents]);

  const lifecycleStateLabels = getLifecycleStateLabels();
  const classificationLabels = getClassificationLabels();
  const disciplineLabels = getDisciplineLabels();

  const columns = useMemo<ColumnDef<DocumentContainer, unknown>[]>(
    () => [
      {
        accessorKey: 'documentNumber',
        header: t('cde.documents.colNumber'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'title',
        header: t('cde.documents.colTitle'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.title}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'classification',
        header: t('cde.documents.colClassification'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{classificationLabels[getValue<string>()] ?? getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'lifecycleState',
        header: t('cde.documents.colState'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={lifecycleStateColorMap}
            label={lifecycleStateLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'DISCIPLINE',
        header: t('cde.documents.colDiscipline'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{disciplineLabels[getValue<string>()] ?? getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'currentRevision',
        header: t('cde.documents.colRevision'),
        size: 90,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs font-medium text-primary-600">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'authorName',
        header: t('cde.documents.colAuthor'),
        size: 150,
      },
      {
        accessorKey: 'updatedAt',
        header: t('cde.documents.colUpdated'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (doc: DocumentContainer) => navigate(`/cde/documents/${doc.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('cde.documents.title')}
        subtitle={`${documents.length} ${t('cde.documents.subtitleSuffix')}`}
        breadcrumbs={[
          { label: t('cde.breadcrumbHome'), href: '/' },
          { label: t('cde.breadcrumbCDE') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />}>
            {t('cde.documents.uploadDocument')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('cde.documents.tabAll'), count: counts.all },
          { id: 'WIP', label: t('cde.documents.tabWIP'), count: counts.wip },
          { id: 'SHARED', label: t('cde.documents.tabShared'), count: counts.shared },
          { id: 'PUBLISHED', label: t('cde.documents.tabPublished'), count: counts.published },
          { id: 'ARCHIVED', label: t('cde.documents.tabArchived'), count: counts.archived },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<FileText size={18} />}
          label={t('cde.documents.metricTotal')}
          value={counts.all}
        />
        <MetricCard
          icon={<FileText size={18} />}
          label={t('cde.documents.metricWIP')}
          value={counts.wip}
          subtitle={t('cde.documents.metricWIPSubtitle')}
        />
        <MetricCard
          icon={<Share2 size={18} />}
          label={t('cde.documents.metricShared')}
          value={counts.shared}
        />
        <MetricCard
          icon={<FileCheck size={18} />}
          label={t('cde.documents.metricPublished')}
          value={counts.published}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('cde.documents.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('cde.documents.filterAllStates') },
            ...Object.entries(lifecycleStateLabels).map(([value, label]) => ({ value, label })),
          ]}
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="w-48"
        />
        <Select
          options={[
            { value: '', label: t('cde.documents.filterAllClassifications') },
            ...Object.entries(classificationLabels).map(([value, label]) => ({ value, label })),
          ]}
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Table */}
      <DataTable<DocumentContainer>
        data={filtered}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('cde.documents.emptyTitle')}
        emptyDescription={t('cde.documents.emptyDescription')}
      />
    </div>
  );
};

export default DocumentContainerListPage;
