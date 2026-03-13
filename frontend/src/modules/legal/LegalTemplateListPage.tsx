import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, FileText, CheckCircle, Tag, Clock } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  legalTemplateStatusColorMap,
  legalTemplateStatusLabels,
  legalTemplateCategoryColorMap,
  legalTemplateCategoryLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { legalApi } from '@/api/legal';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { ContractLegalTemplate } from './types';
import type { PaginatedResponse } from '@/types';

const getCategoryFilterOptions = () => [
  { value: '', label: t('legal.filterAllCategories') },
  { value: 'CONSTRUCTION', label: t('legal.categoryConstruction') },
  { value: 'SUPPLY', label: t('legal.categorySupply') },
  { value: 'SERVICE', label: t('legal.categoryService') },
  { value: 'SUBCONTRACT', label: t('legal.categorySubcontract') },
  { value: 'LEASE', label: t('legal.categoryLease') },
  { value: 'NDA', label: 'NDA' },
  { value: 'OTHER', label: t('legal.categoryOther') },
];

const getStatusFilterOptions = () => [
  { value: '', label: t('legal.filterAllStatuses') },
  { value: 'DRAFT', label: t('legal.statusDraft') },
  { value: 'ACTIVE', label: t('legal.statusActive') },
  { value: 'ARCHIVED', label: t('legal.statusArchived') },
];


const LegalTemplateListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: templateData, isLoading } = useQuery<PaginatedResponse<ContractLegalTemplate>>({
    queryKey: ['legal-templates'],
    queryFn: () => legalApi.getTemplates(),
  });

  const templates = templateData?.content ?? [];

  const filteredTemplates = useMemo(() => {
    let filtered = templates;
    if (categoryFilter) {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }
    if (statusFilter) {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.code.toLowerCase().includes(lower) ||
          t.name.toLowerCase().includes(lower) ||
          t.authorName.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [templates, categoryFilter, statusFilter, search]);

  const metrics = useMemo(() => {
    const active = templates.filter((t) => t.status === 'ACTIVE').length;
    const totalClauses = templates.reduce((s, t) => s + (t.clauseCount ?? 0), 0);
    const categories = new Set(templates.map((t) => t.category)).size;
    return { total: templates.length, active, totalClauses, categories };
  }, [templates]);

  const columns = useMemo<ColumnDef<ContractLegalTemplate, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: t('legal.colCode'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('legal.colTemplate'),
        size: 300,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[280px]">{row.original.name}</p>
            {row.original.description && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate max-w-[280px]">{row.original.description}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: t('legal.colCategory'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={legalTemplateCategoryColorMap}
            label={legalTemplateCategoryLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'status',
        header: t('legal.colStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={legalTemplateStatusColorMap}
            label={legalTemplateStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'version',
        header: t('legal.colVersion'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm text-neutral-700 dark:text-neutral-300">v{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'clauseCount',
        header: t('legal.colClauses'),
        size: 90,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm text-neutral-700 dark:text-neutral-300">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'authorName',
        header: t('legal.colAuthor'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'lastUsedDate',
        header: t('legal.colLastUsed'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 text-xs">{formatDate(getValue<string>())}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (template: ContractLegalTemplate) => navigate(`/legal/templates/${template.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('legal.templatesTitle')}
        subtitle={t('legal.templatesCount', { count: templates.length })}
        breadcrumbs={[
          { label: t('legal.breadcrumbHome'), href: '/' },
          { label: t('legal.breadcrumbLegal') },
          { label: t('legal.breadcrumbTemplates') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/legal/templates/new')}>
            {t('legal.newTemplate')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileText size={18} />} label={t('legal.metricTotalTemplates')} value={metrics.total} />
        <MetricCard icon={<CheckCircle size={18} />} label={t('legal.metricActive')} value={metrics.active} />
        <MetricCard icon={<Tag size={18} />} label={t('legal.metricCategories')} value={metrics.categories} />
        <MetricCard icon={<Clock size={18} />} label={t('legal.metricTotalClauses')} value={metrics.totalClauses} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('legal.searchTemplatePlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getCategoryFilterOptions()}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-48"
        />
        <Select
          options={getStatusFilterOptions()}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        />
      </div>

      <DataTable<ContractLegalTemplate>
        data={filteredTemplates}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('legal.emptyTemplatesTitle')}
        emptyDescription={t('legal.emptyTemplatesDescription')}
      />
    </div>
  );
};

export default LegalTemplateListPage;
