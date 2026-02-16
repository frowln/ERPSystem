import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, FolderTree, Layers } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { designApi } from '@/api/design';
import { formatDate } from '@/lib/format';
import type { DesignSection } from './types';
import type { PaginatedResponse } from '@/types';

const versionStatusColorMap: Record<string, 'gray' | 'yellow' | 'green' | 'purple' | 'red' | 'blue'> = {
  draft: 'gray',
  in_review: 'yellow',
  approved: 'green',
  superseded: 'purple',
  rejected: 'red',
  archived: 'blue',
};

const versionStatusLabels: Record<string, string> = {
  draft: 'Черновик',
  in_review: 'На проверке',
  approved: 'Утверждён',
  superseded: 'Замещён',
  rejected: 'Отклонён',
  archived: 'В архиве',
};

const DesignSectionListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: sectionsData, isLoading } = useQuery<PaginatedResponse<DesignSection>>({
    queryKey: ['design-sections'],
    queryFn: () => designApi.getSections(),
  });

  const sections = sectionsData?.content ?? [];

  const filteredSections = useMemo(() => {
    if (!search) return sections;
    const lower = search.toLowerCase();
    return sections.filter(
      (s) =>
        s.code.toLowerCase().includes(lower) ||
        s.name.toLowerCase().includes(lower) ||
        s.projectName.toLowerCase().includes(lower) ||
        (s.leadDesignerName ?? '').toLowerCase().includes(lower),
    );
  }, [sections, search]);

  const totalVersions = useMemo(() => sections.reduce((s, sec) => s + sec.versionCount, 0), [sections]);

  const columns = useMemo<ColumnDef<DesignSection, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Код',
        size: 90,
        cell: ({ getValue }) => (
          <span className="font-mono font-medium text-primary-600">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Наименование',
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'leadDesignerName',
        header: 'Главный проектировщик',
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'versionCount',
        header: 'Версий',
        size: 90,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'latestVersion',
        header: 'Последняя',
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-700 dark:text-neutral-300">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'latestVersionStatus',
        header: 'Статус',
        size: 130,
        cell: ({ getValue }) => {
          const status = getValue<string>();
          if (!status) return <span className="text-neutral-400">---</span>;
          return (
            <StatusBadge
              status={status}
              colorMap={versionStatusColorMap}
              label={versionStatusLabels[status] ?? status}
            />
          );
        },
      },
      {
        accessorKey: 'updatedAt',
        header: 'Обновлено',
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (section: DesignSection) => navigate(`/design/sections/${section.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Разделы проектной документации"
        subtitle={`${sections.length} разделов в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Проектирование' },
          { label: 'Разделы' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />}>
            Новый раздел
          </Button>
        }
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <MetricCard
          icon={<FolderTree size={18} />}
          label="Всего разделов"
          value={sections.length}
        />
        <MetricCard
          icon={<Layers size={18} />}
          label="Всего версий"
          value={totalVersions}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по коду, названию, проекту..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<DesignSection>
        data={filteredSections}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет разделов"
        emptyDescription="Создайте первый раздел проектной документации"
      />
    </div>
  );
};

export default DesignSectionListPage;
