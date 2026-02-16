import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge, type BadgeColor } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { payrollApi } from './api';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import type { PayrollTemplate, PayrollTemplateType } from './types';

const getTypeLabels = (): Record<PayrollTemplateType, string> => ({
  SALARY: t('payroll.templateList.typeSalary'),
  HOURLY: t('payroll.templateList.typeHourly'),
  PIECE_RATE: t('payroll.templateList.typePieceRate'),
  MIXED: t('payroll.templateList.typeMixed'),
});

const activeColorMap: Record<string, BadgeColor> = {
  true: 'green',
  false: 'gray',
};

const getTypeFilterOptions = () => [
  { value: '', label: t('payroll.templateList.allTypes') },
  { value: 'SALARY', label: t('payroll.templateList.typeSalary') },
  { value: 'HOURLY', label: t('payroll.templateList.typeHourly') },
  { value: 'PIECE_RATE', label: t('payroll.templateList.typePieceRate') },
  { value: 'MIXED', label: t('payroll.templateList.typeMixed') },
];

const PayrollTemplateListPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await payrollApi.deleteTemplate(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-templates'] });
    },
  });

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['payroll-templates'],
    queryFn: () => payrollApi.getTemplates(),
  });

  const templates = (templatesData?.content && templatesData.content.length > 0)
    ? templatesData.content
    : [];

  const filtered = useMemo(() => {
    let result = templates;
    if (typeFilter) {
      result = result.filter((t) => t.type === typeFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(lower) ||
          t.code.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [templates, typeFilter, search]);

  const typeLabels = getTypeLabels();

  const columns = useMemo<ColumnDef<PayrollTemplate, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: t('payroll.templateList.colCode'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('payroll.templateList.colName'),
        size: 250,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'type',
        header: t('payroll.templateList.colType'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{typeLabels[getValue<PayrollTemplateType>()] ?? getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'baseSalary',
        header: t('payroll.templateList.colBaseSalary'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">
            {getValue<number>() > 0 ? formatMoney(getValue<number>()) : '---'}
          </span>
        ),
      },
      {
        accessorKey: 'hourlyRate',
        header: t('payroll.templateList.colHourlyRate'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">
            {getValue<number>() > 0 ? formatMoney(getValue<number>()) : '---'}
          </span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: t('payroll.templateList.colStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={String(getValue<boolean>())}
            colorMap={activeColorMap}
            label={getValue<boolean>() ? t('payroll.templateList.statusActive') : t('payroll.templateList.statusInactive')}
          />
        ),
      },
    ],
    [typeLabels],
  );

  const handleRowClick = useCallback(
    (template: PayrollTemplate) => navigate(`/payroll/templates/${template.id}/edit`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('payroll.templateList.title')}
        subtitle={t('payroll.templateList.subtitle', { count: templates.length })}
        breadcrumbs={[
          { label: t('payroll.templateList.breadcrumbHome'), href: '/' },
          { label: t('payroll.templateList.breadcrumbPayroll'), href: '/payroll' },
          { label: t('payroll.templateList.breadcrumbTemplates') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/payroll/calculate')}>
              {t('payroll.templateList.calculatePayroll')}
            </Button>
            <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/payroll/templates/new')}>
              {t('payroll.templateList.newTemplate')}
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('payroll.templateList.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getTypeFilterOptions()}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-44"
        />
      </div>

      {/* Table */}
      <DataTable<PayrollTemplate>
        data={filtered}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        bulkActions={[
          {
            label: t('payroll.templateList.bulkDelete'),
            icon: <Trash2 size={13} />,
            variant: 'danger',
            onClick: async (rows) => {
              const ids = rows.map((r) => r.id);
              const isConfirmed = await confirm({
                title: t('payroll.templateList.confirmDeleteTitle', { count: ids.length }),
                description: t('payroll.templateList.confirmDeleteDescription'),
                confirmLabel: t('payroll.templateList.confirmDeleteBtn'),
                cancelLabel: t('common.cancel'),
              });
              if (!isConfirmed) return;
              deleteMutation.mutate(ids);
            },
          },
        ]}
        emptyTitle={t('payroll.templateList.emptyTitle')}
        emptyDescription={t('payroll.templateList.emptyDescription')}
      />
    </div>
  );
};

export default PayrollTemplateListPage;
