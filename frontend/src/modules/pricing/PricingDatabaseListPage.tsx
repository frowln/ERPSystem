import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Database, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input } from '@/design-system/components/FormField';
import { Select } from '@/design-system/components/FormField';
import { Input as SearchInput } from '@/design-system/components/FormField';
import { Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { pricingApi, type PricingDatabase, type CreatePricingDatabaseRequest, type PricingDatabaseType } from '@/api/pricing';
import { formatMoney } from '@/lib/format';
import { guardDemoModeAction } from '@/lib/demoMode';
import { t } from '@/i18n';

const DB_TYPE_OPTIONS = [
  { value: 'FER', label: t('pricing.database.typeFER') },
  { value: 'TER', label: t('pricing.database.typeTER') },
  { value: 'GESN', label: t('pricing.database.typeGESN') },
  { value: 'LOCAL', label: t('pricing.database.typeLocal') },
];

const dbTypeColorMap: Record<string, string> = {
  FER: 'blue',
  TER: 'green',
  GESN: 'purple',
  LOCAL: 'yellow',
};

const dbTypeLabels: Record<string, string> = {
  FER: t('pricing.database.typeFER'),
  TER: t('pricing.database.typeTER'),
  GESN: t('pricing.database.typeGESN'),
  LOCAL: t('pricing.database.typeLocal'),
};

type TabId = 'all' | 'active' | 'inactive';

const PricingDatabaseListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data: dbData, isLoading } = useQuery({
    queryKey: ['pricing-databases'],
    queryFn: () => pricingApi.getDatabases({ size: 500 }),
  });

  const databases = dbData?.content ?? [];

  const filteredDatabases = useMemo(() => {
    let filtered = databases;

    if (activeTab === 'active') {
      filtered = filtered.filter((d) => d.active);
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter((d) => !d.active);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(lower) ||
          (d.region ?? '').toLowerCase().includes(lower) ||
          (d.typeDisplayName ?? '').toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [databases, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: databases.length,
    active: databases.filter((d) => d.active).length,
    inactive: databases.filter((d) => !d.active).length,
  }), [databases]);

  const columns = useMemo<ColumnDef<PricingDatabase, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('pricing.databases.colName'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            {row.original.sourceUrl && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate max-w-[260px]">{row.original.sourceUrl}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: t('pricing.databases.colType'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={dbTypeColorMap}
            label={dbTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'region',
        header: t('pricing.databases.colRegion'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400">{getValue<string>() || '—'}</span>
        ),
      },
      {
        accessorKey: 'baseYear',
        header: t('pricing.databases.colBaseYear'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'coefficientToCurrentPrices',
        header: t('pricing.databases.colCoefficient'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium">{getValue<number>()?.toFixed(4) ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'active',
        header: t('pricing.databases.colActive'),
        size: 100,
        cell: ({ getValue }) => getValue<boolean>() ? (
          <span className="inline-flex items-center gap-1 text-success-600"><CheckCircle size={14} /> {t('pricing.databases.yes')}</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-neutral-400"><XCircle size={14} /> {t('pricing.databases.no')}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('pricing.databases.title')}
        subtitle={t('pricing.databases.subtitle', { count: String(databases.length) })}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('pricing.databases.breadcrumb'), href: '/estimates/pricing/databases' },
        ]}
        actions={
          <Button
            iconLeft={<Plus size={16} />}
            onClick={() => {
              if (guardDemoModeAction(t('pricing.databases.demoCreate'))) return;
              setShowCreate(true);
            }}
          >
            {t('pricing.databases.btnCreate')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('common.all'), count: tabCounts.all },
          { id: 'active', label: t('pricing.databases.tabActive'), count: tabCounts.active },
          { id: 'inactive', label: t('pricing.databases.tabInactive'), count: tabCounts.inactive },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <SearchInput
            placeholder={t('pricing.databases.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable<PricingDatabase>
        data={filteredDatabases}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('pricing.databases.emptyTitle')}
        emptyDescription={t('pricing.databases.emptyDescription')}
      />

      {showCreate && (
        <CreateDatabaseModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            queryClient.invalidateQueries({ queryKey: ['pricing-databases'] });
          }}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Create Database Modal
// ---------------------------------------------------------------------------

interface CreateDatabaseModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const CreateDatabaseModal: React.FC<CreateDatabaseModalProps> = ({ onClose, onCreated }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<CreatePricingDatabaseRequest>({
    defaultValues: {
      name: '',
      type: 'FER',
      baseYear: new Date().getFullYear(),
      coefficientToCurrentPrices: 1.0,
      active: true,
    },
  });

  const mutation = useMutation({
    mutationFn: pricingApi.createDatabase,
    onSuccess: () => {
      toast.success(t('pricing.databases.toastCreated'));
      onCreated();
    },
    onError: () => {
      toast.error(t('pricing.databases.toastCreateError'));
    },
  });

  const onSubmit = (data: CreatePricingDatabaseRequest) => {
    mutation.mutate(data);
  };

  return (
    <Modal open onClose={onClose} title={t('pricing.databases.createTitle')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label={t('pricing.databases.fieldName')} error={errors.name?.message}>
          <Input
            {...register('name', { required: t('pricing.databases.fieldNameRequired') })}
            placeholder={t('pricing.databases.fieldNamePlaceholder')}
            hasError={!!errors.name}
          />
        </FormField>

        <FormField label={t('pricing.databases.fieldType')}>
          <Select
            {...register('type')}
            options={DB_TYPE_OPTIONS}
          />
        </FormField>

        <FormField label={t('pricing.databases.fieldRegion')}>
          <Input
            {...register('region')}
            placeholder={t('pricing.databases.fieldRegionPlaceholder')}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('pricing.databases.fieldBaseYear')} error={errors.baseYear?.message}>
            <Input
              type="number"
              {...register('baseYear', { required: true, valueAsNumber: true })}
              hasError={!!errors.baseYear}
            />
          </FormField>

          <FormField label={t('pricing.databases.fieldCoefficient')}>
            <Input
              type="number"
              step="0.0001"
              {...register('coefficientToCurrentPrices', { valueAsNumber: true })}
            />
          </FormField>
        </div>

        <FormField label={t('pricing.databases.fieldSourceUrl')}>
          <Input
            {...register('sourceUrl')}
            placeholder="https://..."
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} type="button">
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {t('common.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PricingDatabaseListPage;
