import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Upload, Download, Database } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import toast from 'react-hot-toast';
import { pricingApi, type PriceRate, type PricingDatabase } from '@/api/pricing';
import { formatMoney } from '@/lib/format';
import { guardDemoModeAction } from '@/lib/demoMode';
import { t } from '@/i18n';

const PricingRatesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDbId, setSelectedDbId] = useState<string>('');
  const [page, setPage] = useState(0);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch databases for the filter dropdown
  const { data: dbData } = useQuery({
    queryKey: ['pricing-databases'],
    queryFn: () => pricingApi.getDatabases({ size: 500 }),
  });
  const databases = dbData?.content ?? [];

  const dbOptions = useMemo(() => [
    { value: '', label: t('pricing.rates.allDatabases') },
    ...databases.map((db) => ({ value: db.id, label: `${db.name} (${db.type})` })),
  ], [databases]);

  // Fetch rates with server-side search
  const { data: ratesData, isLoading } = useQuery({
    queryKey: ['pricing-rates', selectedDbId, debouncedSearch, page],
    queryFn: () =>
      pricingApi.searchRates({
        databaseId: selectedDbId || undefined,
        search: debouncedSearch || undefined,
        page,
        size: 20,
      }),
  });

  const rates = ratesData?.content ?? [];
  const totalElements = ratesData?.totalElements ?? 0;

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(0);
    }, 400);
  }, []);

  // CSV Import
  const importMutation = useMutation({
    mutationFn: ({ dbId, file }: { dbId: string; file: File }) =>
      pricingApi.importRates(dbId, file),
    onSuccess: (report) => {
      toast.success(t('pricing.rates.toastImported', { count: String(report.importedRows) }));
      queryClient.invalidateQueries({ queryKey: ['pricing-rates'] });
      if (report.errorRows > 0) {
        toast.error(t('pricing.rates.toastImportError'));
      }
    },
    onError: () => {
      toast.error(t('pricing.rates.toastImportError'));
    },
  });

  const handleImportClick = useCallback(() => {
    if (!selectedDbId) {
      toast.error(t('pricing.rates.selectDbFirst'));
      return;
    }
    if (guardDemoModeAction(t('pricing.rates.demoImport'))) return;
    fileInputRef.current?.click();
  }, [selectedDbId]);

  const handleFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !selectedDbId) return;
      importMutation.mutate({ dbId: selectedDbId, file });
      e.target.value = '';
    },
    [selectedDbId, importMutation],
  );

  // CSV Export
  const handleExport = useCallback(async () => {
    if (!selectedDbId) {
      toast.error(t('pricing.rates.selectDbFirst'));
      return;
    }
    try {
      const blob = await pricingApi.exportRates(selectedDbId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rates_${selectedDbId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('pricing.rates.toastExported'));
    } catch {
      toast.error(t('pricing.rates.toastExportError'));
    }
  }, [selectedDbId]);

  const columns = useMemo<ColumnDef<PriceRate, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: t('pricing.rates.colCode'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-mono text-sm font-medium text-primary-700 dark:text-primary-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('pricing.rates.colName'),
        size: 320,
        cell: ({ row }) => (
          <div>
            <p className="text-neutral-900 dark:text-neutral-100 line-clamp-2">{row.original.name}</p>
            {row.original.category && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {row.original.category}
                {row.original.subcategory ? ` / ${row.original.subcategory}` : ''}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'unit',
        header: t('pricing.rates.colUnit'),
        size: 90,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'laborCost',
        header: t('pricing.rates.colLabor'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'materialCost',
        header: t('pricing.rates.colMaterial'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'equipmentCost',
        header: t('pricing.rates.colEquipment'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'overheadCost',
        header: t('pricing.rates.colOverhead'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'totalCost',
        header: t('pricing.rates.colTotal'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block font-semibold">{formatMoney(getValue<number>())}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('pricing.rates.title')}
        subtitle={t('pricing.rates.subtitle', { count: String(totalElements) })}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('pricing.databases.breadcrumb'), href: '/estimates/pricing/databases' },
          { label: t('pricing.rates.breadcrumb') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              iconLeft={<Upload size={16} />}
              onClick={handleImportClick}
              loading={importMutation.isPending}
            >
              {t('pricing.rates.btnImport')}
            </Button>
            <Button
              variant="secondary"
              iconLeft={<Download size={16} />}
              onClick={handleExport}
            >
              {t('pricing.rates.btnExport')}
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('pricing.rates.searchPlaceholder')}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-64">
          <Select
            value={selectedDbId}
            onChange={(e) => {
              setSelectedDbId(e.target.value);
              setPage(0);
            }}
            options={dbOptions}
          />
        </div>
      </div>

      <DataTable<PriceRate>
        data={rates}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        pageSize={20}
        emptyTitle={t('pricing.rates.emptyTitle')}
        emptyDescription={t('pricing.rates.emptyDescription')}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileSelected}
      />
    </div>
  );
};

export default PricingRatesPage;
