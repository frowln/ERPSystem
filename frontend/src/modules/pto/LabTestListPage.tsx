import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, FlaskConical, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { formatDate } from '@/lib/format';
import { ptoApi } from '@/api/pto';

interface LabTest {
  id: string;
  number: string;
  testType: string;
  material: string;
  status: string;
  result: string;
  projectName: string;
  laboratory: string;
  sampleDate: string;
  resultDate: string | null;
  batchNumber: string;
  standard: string;
}


const testTypeLabels: Record<string, string> = {
  compression: 'Прочность на сжатие',
  tensile: 'Прочность на растяжение',
  density: 'Плотность',
  moisture: 'Влажность',
  granulometry: 'Гранулометрия',
  chemical: 'Химический анализ',
  weld: 'Контроль сварных швов',
};

const statusColorMap: Record<string, 'green' | 'yellow' | 'blue' | 'gray'> = {
  pending: 'yellow',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'gray',
};
const statusLabels: Record<string, string> = {
  pending: 'Ожидает',
  in_progress: 'В процессе',
  completed: 'Завершён',
  cancelled: 'Отменён',
};

const resultColorMap: Record<string, 'green' | 'red' | 'yellow' | 'gray'> = {
  passed: 'green',
  failed: 'red',
  conditional: 'yellow',
  pending: 'gray',
};
const resultLabels: Record<string, string> = {
  passed: 'Годен',
  failed: 'Не годен',
  conditional: 'Условно годен',
  pending: 'Ожидает',
};

const LabTestListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ['lab-tests'],
    queryFn: () => ptoApi.getLabTests(),
  });

  const tests: LabTest[] = (paginatedData?.content ?? []).map((lt) => ({
    id: lt.id,
    number: lt.number,
    testType: lt.testType,
    material: lt.material,
    status: lt.status,
    result: lt.result,
    projectName: lt.projectName,
    laboratory: lt.laboratory,
    sampleDate: lt.sampleDate,
    resultDate: lt.resultDate,
    batchNumber: lt.batchNumber,
    standard: lt.standard,
  }));

  const filtered = useMemo(() => {
    let result = tests;
    if (activeTab !== 'all') result = result.filter((t) => t.status === activeTab);
    if (typeFilter) result = result.filter((t) => t.testType === typeFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (t) => t.number.toLowerCase().includes(lower) || t.material.toLowerCase().includes(lower) || t.batchNumber.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [tests, activeTab, typeFilter, search]);

  const passedCount = tests.filter((t) => t.result === 'PASSED').length;
  const failedCount = tests.filter((t) => t.result === 'FAILED').length;

  const columns = useMemo<ColumnDef<LabTest, unknown>[]>(() => [
    {
      accessorKey: 'number',
      header: '№',
      size: 100,
      cell: ({ getValue }) => <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'MATERIAL',
      header: 'Материал',
      size: 200,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.material}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Партия: {row.original.batchNumber}</p>
        </div>
      ),
    },
    {
      accessorKey: 'testType',
      header: 'Тип испытания',
      size: 180,
      cell: ({ getValue }) => <span className="text-neutral-600">{testTypeLabels[getValue<string>()] ?? getValue<string>()}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      size: 120,
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={statusColorMap} label={statusLabels[getValue<string>()]} />,
    },
    {
      accessorKey: 'result',
      header: 'Результат',
      size: 130,
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={resultColorMap} label={resultLabels[getValue<string>()]} />,
    },
    {
      accessorKey: 'standard',
      header: 'Стандарт',
      size: 160,
      cell: ({ getValue }) => <span className="text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'sampleDate',
      header: 'Дата отбора',
      size: 110,
      cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
    },
    {
      accessorKey: 'resultDate',
      header: 'Дата результата',
      size: 120,
      cell: ({ getValue }) => {
        const value = getValue<string | null>();
        return <span className="tabular-nums">{value ? formatDate(value) : '---'}</span>;
      },
    },
  ], []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Лабораторные испытания"
        subtitle={`${tests.length} испытаний`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'ПТО' },
          { label: 'Лабораторные испытания' },
        ]}
        actions={<Button iconLeft={<Plus size={16} />}>Новое испытание</Button>}
        tabs={[
          { id: 'all', label: 'Все', count: tests.length },
          { id: 'PENDING', label: 'Ожидают' },
          { id: 'IN_PROGRESS', label: 'В процессе' },
          { id: 'COMPLETED', label: 'Завершённые' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FlaskConical size={18} />} label="Всего испытаний" value={tests.length} />
        <MetricCard icon={<CheckCircle size={18} />} label="Годных" value={passedCount} />
        <MetricCard icon={<XCircle size={18} />} label="Не годных" value={failedCount} />
        <MetricCard icon={<FlaskConical size={18} />} label="В процессе" value={tests.filter((t) => t.status === 'IN_PROGRESS').length} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск по материалу, партии..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          options={[
            { value: '', label: 'Все типы' },
            ...Object.entries(testTypeLabels).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-56"
        />
      </div>

      <DataTable<LabTest>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет испытаний"
        emptyDescription="Создайте первое лабораторное испытание"
      />
    </div>
  );
};

export default LabTestListPage;
