import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Database,
  Search,
  Upload,
  FileText,
  Loader2,
  Calculator,
  TrendingUp,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Filter,
  Globe,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { integration1cApi } from '@/api/integration1c';
import { t } from '@/i18n';
import type {
  PricingDatabase,
  PriceRate,
  PriceIndex,
  CsvImportResult,
  PricingDatabaseType,
} from './types';

type TabId = 'databases' | 'rates' | 'indices' | 'import';

const dbTypeColorMap: Record<string, 'blue' | 'green' | 'purple' | 'gray'> = {
  GESN: 'blue',
  FER: 'green',
  TER: 'purple',
  LOCAL: 'gray',
};

const PricingDatabasePage: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>('databases');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDbId, setSelectedDbId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch pricing databases
  const { data: databases = [] } = useQuery({
    queryKey: ['pricing-databases'],
    queryFn: async () => {
      try {
        return await integration1cApi.getPricingDatabases();
      } catch {
        return [];
      }
    },
  });

  // Search rates
  const { data: ratesData, isLoading: ratesLoading } = useQuery({
    queryKey: ['pricing-rates', selectedDbId, searchQuery, selectedCategory],
    queryFn: async (): Promise<{ content: PriceRate[]; totalElements: number }> => {
      try {
        const result = await integration1cApi.searchRates({
          databaseId: selectedDbId || undefined,
          query: searchQuery || undefined,
          category: selectedCategory || undefined,
          page: 0,
          size: 50,
        });
        // API returns PriceRate[] - normalize to paginated shape
        const arr = Array.isArray(result) ? result : [];
        return { content: arr, totalElements: arr.length };
      } catch {
        return { content: [], totalElements: 0 };
      }
    },
    enabled: activeTab === 'rates',
  });

  // Minstroy indices
  const { data: indices = [] } = useQuery({
    queryKey: ['pricing-indices', regionFilter],
    queryFn: async () => {
      try {
        return await integration1cApi.getMinstroyIndices({
          region: regionFilter || undefined,
        });
      } catch {
        return [];
      }
    },
    enabled: activeTab === 'indices',
  });

  // Available regions
  const { data: availableRegions = [] } = useQuery({
    queryKey: ['pricing-index-regions'],
    queryFn: async () => {
      try {
        return await integration1cApi.getAvailableRegions();
      } catch {
        return [];
      }
    },
  });

  // CSV import
  const importMutation = useMutation({
    mutationFn: (file: File) => integration1cApi.importCsvCoefficients(file, selectedDbId),
    onSuccess: (result) => {
      setImportResult(result);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['pricing-rates'] });
      if (result.errors.length === 0) {
        toast.success(t('integration1c.pricingImportSuccess'));
      } else {
        toast(t('integration1c.pricingImportPartial'), { icon: '!' });
      }
    },
    onError: () => toast.error(t('integration1c.pricingImportError')),
  });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setImportResult(null);
    }
  }, []);

  // Metrics
  const activeDbs = databases.filter((db) => db.active).length;
  const gesnCount = databases.filter((db) => db.type === 'GESN').length;
  const ferCount = databases.filter((db) => db.type === 'FER').length;
  const terCount = databases.filter((db) => db.type === 'TER').length;

  const dbTypeLabel = (type: PricingDatabaseType): string => {
    const labels: Record<PricingDatabaseType, string> = {
      GESN: t('integration1c.dbGesn'),
      FER: t('integration1c.dbFer'),
      TER: t('integration1c.dbTer'),
      LOCAL: t('integration1c.dbLocal'),
      CUSTOM: t('integration1c.dbLocal'),
    };
    return labels[type];
  };

  // Database columns
  const dbColumns = useMemo<ColumnDef<PricingDatabase, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('integration1c.colDbName'),
        size: 250,
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: t('integration1c.colDbType'),
        size: 120,
        cell: ({ getValue }) => {
          const type = getValue<PricingDatabaseType>();
          return (
            <StatusBadge
              status={type}
              colorMap={dbTypeColorMap}
              label={dbTypeLabel(type)}
            />
          );
        },
      },
      {
        accessorKey: 'region',
        header: t('integration1c.colRegion'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            {getValue<string>() || t('integration1c.allRegions')}
          </span>
        ),
      },
      {
        accessorKey: 'baseYear',
        header: t('integration1c.colBaseYear'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm text-neutral-700 dark:text-neutral-300">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: 'coefficientToCurrentPrices',
        header: t('integration1c.colCoefficient'),
        size: 120,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return (
            <span className="tabular-nums text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {val ? val.toFixed(4) : '--'}
            </span>
          );
        },
      },
      {
        accessorKey: 'effectiveFrom',
        header: t('integration1c.colEffectiveFrom'),
        size: 120,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return (
            <span className="text-xs text-neutral-700 dark:text-neutral-300">
              {val || '--'}
            </span>
          );
        },
      },
      {
        accessorKey: 'active',
        header: t('integration1c.colActive'),
        size: 80,
        cell: ({ getValue }) => (
          getValue<boolean>()
            ? <CheckCircle2 size={16} className="text-green-500" />
            : <XCircle size={16} className="text-neutral-300 dark:text-neutral-600" />
        ),
      },
    ],
    [],
  );

  // Rate columns
  const rateColumns = useMemo<ColumnDef<PriceRate, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: t('integration1c.colRateCode'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-primary-600 dark:text-primary-400 font-medium">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('integration1c.colRateName'),
        size: 300,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'unit',
        header: t('integration1c.colUnit'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-600 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'laborCost',
        header: t('integration1c.colLabor'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm text-neutral-700 dark:text-neutral-300">
            {getValue<number>()?.toFixed(2) ?? '--'}
          </span>
        ),
      },
      {
        accessorKey: 'materialCost',
        header: t('integration1c.colMaterials'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm text-neutral-700 dark:text-neutral-300">
            {getValue<number>()?.toFixed(2) ?? '--'}
          </span>
        ),
      },
      {
        accessorKey: 'equipmentCost',
        header: t('integration1c.colEquipment'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm text-neutral-700 dark:text-neutral-300">
            {getValue<number>()?.toFixed(2) ?? '--'}
          </span>
        ),
      },
      {
        accessorKey: 'overheadCost',
        header: t('integration1c.colOverhead'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm text-neutral-700 dark:text-neutral-300">
            {getValue<number>()?.toFixed(2) ?? '--'}
          </span>
        ),
      },
      {
        accessorKey: 'totalCost',
        header: t('integration1c.colTotal'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {getValue<number>()?.toFixed(2) ?? '--'}
          </span>
        ),
      },
      {
        accessorKey: 'category',
        header: t('integration1c.colCategory'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {getValue<string>() || '--'}
          </span>
        ),
      },
    ],
    [],
  );

  // Index columns
  const indexColumns = useMemo<ColumnDef<PriceIndex, unknown>[]>(
    () => [
      {
        accessorKey: 'region',
        header: t('integration1c.colRegion'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'workType',
        header: t('integration1c.colWorkType'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'baseQuarter',
        header: t('integration1c.colBaseQuarter'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-neutral-600 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'targetQuarter',
        header: t('integration1c.colTargetQuarter'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-neutral-600 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'indexValue',
        header: t('integration1c.colIndexValue'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {getValue<number>()?.toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'source',
        header: t('integration1c.colSource'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {getValue<string>() || '--'}
          </span>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: t('integration1c.colUpdatedAt'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-700 dark:text-neutral-300">
            {formatDateTime(getValue<string>())}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('integration1c.pricingTitle')}
        subtitle={t('integration1c.pricingSubtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('integration1c.breadcrumbSettings'), href: '/settings' },
          { label: t('integration1c.dashboardTitle'), href: '/settings/1c' },
          { label: t('integration1c.pricingTitle') },
        ]}
        backTo="/settings/1c"
        tabs={[
          { id: 'databases', label: t('integration1c.tabDatabases'), count: databases.length },
          { id: 'rates', label: t('integration1c.tabRates'), count: ratesData?.totalElements ?? 0 },
          { id: 'indices', label: t('integration1c.tabIndices'), count: indices.length },
          { id: 'import', label: t('integration1c.tabImport') },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Database size={16} />}
          label={t('integration1c.metricActiveDatabases')}
          value={activeDbs}
        />
        <MetricCard
          icon={<BookOpen size={16} />}
          label={t('integration1c.dbGesn')}
          value={gesnCount}
        />
        <MetricCard
          icon={<BookOpen size={16} />}
          label={`${t('integration1c.dbFer')} / ${t('integration1c.dbTer')}`}
          value={`${ferCount} / ${terCount}`}
        />
        <MetricCard
          icon={<TrendingUp size={16} />}
          label={t('integration1c.metricIndicesCount')}
          value={indices.length}
        />
      </div>

      {/* Tab: Databases */}
      {activeTab === 'databases' && (
        <DataTable<PricingDatabase>
          data={databases}
          columns={dbColumns}
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          emptyTitle={t('integration1c.emptyDatabasesTitle')}
          emptyDescription={t('integration1c.emptyDatabasesDescription')}
        />
      )}

      {/* Tab: Rates search */}
      {activeTab === 'rates' && (
        <>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('integration1c.searchRatesPlaceholder')}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                />
              </div>

              {/* Database filter */}
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-neutral-400" />
                <Select
                  options={[
                    { value: '', label: t('integration1c.allDatabases') },
                    ...databases.map((db) => ({ value: db.id, label: `${db.name} (${dbTypeLabel(db.type)})` })),
                  ]}
                  value={selectedDbId}
                  onChange={(e) => setSelectedDbId(e.target.value)}
                />
              </div>
            </div>
          </div>

          {ratesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-neutral-400" />
            </div>
          ) : (
            <DataTable<PriceRate>
              data={ratesData?.content ?? []}
              columns={rateColumns}
              enableColumnVisibility
              enableDensityToggle
              enableExport
              pageSize={20}
              emptyTitle={t('integration1c.emptyRatesTitle')}
              emptyDescription={t('integration1c.emptyRatesDescription')}
            />
          )}
        </>
      )}

      {/* Tab: Minstroy indices */}
      {activeTab === 'indices' && (
        <>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <Globe size={16} className="text-neutral-400" />
              <Select
                options={[
                  { value: '', label: t('integration1c.allRegions') },
                  ...availableRegions.map((r) => ({ value: typeof r === 'string' ? r : r.code, label: typeof r === 'string' ? r : r.name })),
                ]}
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
              />
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {t('integration1c.indicesHint')}
              </span>
            </div>
          </div>

          <DataTable<PriceIndex>
            data={indices}
            columns={indexColumns}
            enableColumnVisibility
            enableDensityToggle
            enableExport
            pageSize={20}
            emptyTitle={t('integration1c.emptyIndicesTitle')}
            emptyDescription={t('integration1c.emptyIndicesDescription')}
          />
        </>
      )}

      {/* Tab: Import CSV */}
      {activeTab === 'import' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('integration1c.importCoefficientsTitle')}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            {t('integration1c.importCoefficientsDesc')}
          </p>

          {/* Database selection */}
          <div className="mb-4">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">
              {t('integration1c.targetDatabase')}
            </label>
            <Select
              options={[
                { value: '', label: t('integration1c.selectDatabase') },
                ...databases.map((db) => ({ value: db.id, label: `${db.name} (${dbTypeLabel(db.type)})` })),
              ]}
              value={selectedDbId}
              onChange={(e) => setSelectedDbId(e.target.value)}
            />
          </div>

          {/* File upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              'border-neutral-300 dark:border-neutral-600 hover:border-primary-300 dark:hover:border-primary-600',
            )}
          >
            <Upload size={32} className="mx-auto mb-3 text-neutral-400" />
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('integration1c.dropCsvHere')}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('integration1c.csvFormat')}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Selected file */}
          {selectedFile && (
            <div className="mt-4 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-primary-500" />
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  iconLeft={importMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  onClick={() => importMutation.mutate(selectedFile)}
                  disabled={importMutation.isPending || !selectedDbId}
                >
                  {t('integration1c.importBtn')}
                </Button>
              </div>
            </div>
          )}

          {/* Import result */}
          {importResult && (
            <div className="mt-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                {t('integration1c.importResultTitle')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Calculator size={14} className="text-neutral-500" />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    {t('integration1c.pricingTotalRows')}: <strong>{importResult.totalRows}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    {t('integration1c.pricingImported')}: <strong>{importResult.imported}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-yellow-500" />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    {t('integration1c.pricingSkipped')}: <strong>{importResult.skipped}</strong>
                  </span>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-2 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle size={14} className="text-red-500" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">
                      {t('integration1c.errorsFound', { count: String(importResult.errors.length) })}
                    </span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-red-600 dark:text-red-400 space-y-0.5">
                    {importResult.errors.slice(0, 10).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li>...{t('integration1c.andMore', { count: String(importResult.errors.length - 10) })}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PricingDatabasePage;
