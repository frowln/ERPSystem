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
import type { PayrollTemplate, PayrollTemplateType } from './types';

const typeLabels: Record<PayrollTemplateType, string> = {
  SALARY: 'Оклад',
  HOURLY: 'Почасовая',
  PIECE_RATE: 'Сдельная',
  MIXED: 'Смешанная',
};

const activeColorMap: Record<string, BadgeColor> = {
  true: 'green',
  false: 'gray',
};

const typeFilterOptions = [
  { value: '', label: 'Все типы' },
  { value: 'SALARY', label: 'Оклад' },
  { value: 'HOURLY', label: 'Почасовая' },
  { value: 'PIECE_RATE', label: 'Сдельная' },
  { value: 'MIXED', label: 'Смешанная' },
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

  const columns = useMemo<ColumnDef<PayrollTemplate, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Код',
        size: 130,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Название',
        size: 250,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Тип',
        size: 130,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{typeLabels[getValue<PayrollTemplateType>()] ?? getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'baseSalary',
        header: 'Базовый оклад',
        size: 160,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">
            {getValue<number>() > 0 ? formatMoney(getValue<number>()) : '---'}
          </span>
        ),
      },
      {
        accessorKey: 'hourlyRate',
        header: 'Часовая ставка',
        size: 150,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">
            {getValue<number>() > 0 ? formatMoney(getValue<number>()) : '---'}
          </span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Статус',
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={String(getValue<boolean>())}
            colorMap={activeColorMap}
            label={getValue<boolean>() ? 'Активен' : 'Неактивен'}
          />
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (template: PayrollTemplate) => navigate(`/payroll/templates/${template.id}/edit`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Шаблоны расчёта зарплаты"
        subtitle={`${templates.length} шаблонов в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Зарплата', href: '/payroll' },
          { label: 'Шаблоны' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/payroll/calculate')}>
              Расчёт зарплаты
            </Button>
            <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/payroll/templates/new')}>
              Новый шаблон
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по коду, названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={typeFilterOptions}
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
            label: 'Удалить',
            icon: <Trash2 size={13} />,
            variant: 'danger',
            onClick: async (rows) => {
              const ids = rows.map((r) => r.id);
              const isConfirmed = await confirm({
                title: `Удалить ${ids.length} шаблон(ов)?`,
                description: 'Операция необратима. Выбранные шаблоны расчета будут удалены.',
                confirmLabel: 'Удалить',
                cancelLabel: 'Отмена',
              });
              if (!isConfirmed) return;
              deleteMutation.mutate(ids);
            },
          },
        ]}
        emptyTitle="Нет шаблонов"
        emptyDescription="Создайте первый шаблон расчёта зарплаты"
      />
    </div>
  );
};

export default PayrollTemplateListPage;
