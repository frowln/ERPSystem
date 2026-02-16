import React, { useState, useMemo } from 'react';
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

const statusColorMap: Record<string, 'green' | 'yellow' | 'blue' | 'gray' | 'red' | 'purple'> = {
  draft: 'gray',
  issued: 'blue',
  in_review: 'yellow',
  approved: 'green',
  rejected: 'red',
  superseded: 'purple',
};
const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  issued: 'Выпущен',
  in_review: 'На проверке',
  approved: 'Утверждён',
  rejected: 'Отклонён',
  superseded: 'Заменён',
};

const sectionLabels: Record<string, string> = {
  AR: 'Архитектурные решения',
  KR: 'Конструкции',
  OV: 'Отопление и вентиляция',
  VK: 'Водоснабжение и канализация',
  ES: 'Электроснабжение',
  SS: 'Слаботочные системы',
  GP: 'Генплан',
};

const DesignPackagePage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState('');

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

  const columns = useMemo<ColumnDef<DesignPackage, unknown>[]>(() => [
    {
      accessorKey: 'code',
      header: 'Шифр',
      size: 100,
      cell: ({ getValue }) => <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>,
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
      accessorKey: 'section',
      header: 'Раздел',
      size: 180,
      cell: ({ getValue }) => <span className="text-neutral-600">{sectionLabels[getValue<string>()] ?? getValue<string>()}</span>,
    },
    {
      accessorKey: 'revision',
      header: 'Ревизия',
      size: 80,
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'sheetsCount',
      header: 'Листов',
      size: 80,
      cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      size: 130,
      cell: ({ getValue }) => (
        <StatusBadge status={getValue<string>()} colorMap={statusColorMap} label={statusLabels[getValue<string>()]} />
      ),
    },
    {
      accessorKey: 'reviewer',
      header: 'Проверяющий',
      size: 160,
    },
    {
      accessorKey: 'issueDate',
      header: 'Дата выпуска',
      size: 120,
      cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
    },
  ], []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Проектные комплекты"
        subtitle={`${packages.length} комплектов в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'BIM' },
          { label: 'Проектные комплекты' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />}>Новый комплект</Button>
        }
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'IN_REVIEW', label: 'На проверке', count: tabCounts.in_review },
          { id: 'APPROVED', label: 'Утверждённые', count: tabCounts.approved },
          { id: 'REJECTED', label: 'Отклонённые', count: tabCounts.rejected },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск по названию, шифру..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          options={[
            { value: '', label: 'Все разделы' },
            ...Object.entries(sectionLabels).map(([v, l]) => ({ value: v, label: l })),
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
        emptyTitle="Нет комплектов"
        emptyDescription="Создайте первый проектный комплект"
      />
    </div>
  );
};

export default DesignPackagePage;
