import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import {
  StatusBadge,
  materialCategoryColorMap,
  materialCategoryLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { warehouseApi } from '@/api/warehouse';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import type { Material } from '@/types';

const getCategoryOptions = () => [
  { value: '', label: t('warehouse.materialList.allCategories') },
  { value: 'CONCRETE', label: t('warehouse.materialList.catConcrete') },
  { value: 'METAL', label: t('warehouse.materialList.catMetal') },
  { value: 'WOOD', label: t('warehouse.materialList.catWood') },
  { value: 'INSULATION', label: t('warehouse.materialList.catInsulation') },
  { value: 'PIPES', label: t('warehouse.materialList.catPipes') },
  { value: 'ELECTRICAL', label: t('warehouse.materialList.catElectrical') },
  { value: 'FINISHING', label: t('warehouse.materialList.catFinishing') },
  { value: 'FASTENERS', label: t('warehouse.materialList.catFasteners') },
  { value: 'TOOLS', label: t('warehouse.materialList.catTools') },
  { value: 'OTHER', label: t('warehouse.materialList.catOther') },
];

const MaterialListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: materialsData, isLoading } = useQuery({
    queryKey: ['MATERIALS'],
    queryFn: () => warehouseApi.getMaterials(),
  });

  const materials = materialsData?.content ?? [];

  const filteredMaterials = useMemo(() => {
    let filtered = materials;

    if (categoryFilter) {
      filtered = filtered.filter((m) => m.category === categoryFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(lower) ||
          m.code.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [materials, categoryFilter, search]);

  const columns = useMemo<ColumnDef<Material, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: t('warehouse.materialList.columnCode'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('warehouse.materialList.columnName'),
        size: 280,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'category',
        header: t('warehouse.materialList.columnCategory'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={materialCategoryColorMap}
            label={materialCategoryLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'unitOfMeasure',
        header: t('warehouse.materialList.columnUnit'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'currentPrice',
        header: t('warehouse.materialList.columnPrice'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (material: Material) => navigate(`/warehouse/materials/${material.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('warehouse.materialList.title')}
        subtitle={t('warehouse.materialList.subtitle', { count: materials.length })}
        breadcrumbs={[
          { label: t('warehouse.materialList.breadcrumbHome'), href: '/' },
          { label: t('warehouse.breadcrumbWarehouse') },
          { label: t('warehouse.materialList.title') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/warehouse/materials/new')}>
            {t('warehouse.materialList.newMaterial')}
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('warehouse.materialList.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getCategoryOptions()}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Table */}
      <DataTable<Material>
        data={filteredMaterials}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('warehouse.materialList.emptyTitle')}
        emptyDescription={t('warehouse.materialList.emptyDescription')}
      />
    </div>
  );
};

export default MaterialListPage;
