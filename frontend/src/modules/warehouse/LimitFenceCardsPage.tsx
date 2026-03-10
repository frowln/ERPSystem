import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Search,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { t } from '@/i18n';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { FormField } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { warehouseApi } from '@/api/warehouse';
import { formatNumber, formatDate } from '@/lib/format';
import type { LimitFenceCard } from './types';

const lfcStatusColorMap: Record<string, 'green' | 'red' | 'orange'> = {
  active: 'green',
  exhausted: 'red',
  expired: 'orange',
};

const lfcStatusLabels: Record<string, string> = {
  get active() { return t('warehouse.limitFenceCards.statusActive'); },
  get exhausted() { return t('warehouse.limitFenceCards.statusExhausted'); },
  get expired() { return t('warehouse.limitFenceCards.statusExpired'); },
};

type TabId = 'all' | 'active' | 'exhausted' | 'expired';

const LimitFenceCardsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailCard, setDetailCard] = useState<LimitFenceCard | null>(null);

  // Create form state
  const [formProject, setFormProject] = useState('');
  const [formMaterial, setFormMaterial] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formLimit, setFormLimit] = useState('');
  const [formFrom, setFormFrom] = useState('');
  const [formTo, setFormTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['limit-fence-cards'],
    queryFn: () => warehouseApi.getLimitFenceCards({ size: 200 }),
  });

  const cards = data?.content ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      warehouseApi.createLimitFenceCard({
        projectId: formProject,
        materialName: formMaterial,
        unit: formUnit,
        limitQty: Number(formLimit),
        periodFrom: formFrom,
        periodTo: formTo,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['limit-fence-cards'] });
      toast.success(t('warehouse.limitFenceCards.createSuccess'));
      setCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const resetForm = () => {
    setFormProject('');
    setFormMaterial('');
    setFormUnit('');
    setFormLimit('');
    setFormFrom('');
    setFormTo('');
  };

  const filtered = useMemo(() => {
    let result = cards;
    if (activeTab !== 'all') result = result.filter((c) => c.status === activeTab);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.number.toLowerCase().includes(q) ||
          c.materialName.toLowerCase().includes(q) ||
          c.projectName.toLowerCase().includes(q),
      );
    }
    return result;
  }, [cards, activeTab, search]);

  const tabCounts = useMemo(
    () => ({
      all: cards.length,
      active: cards.filter((c) => c.status === 'active').length,
      exhausted: cards.filter((c) => c.status === 'exhausted').length,
      expired: cards.filter((c) => c.status === 'expired').length,
    }),
    [cards],
  );

  const metrics = useMemo(() => {
    const overdrawn = cards.filter((c) => c.issuedQty > c.limitQty).length;
    return {
      total: cards.length,
      active: tabCounts.active,
      exhausted: tabCounts.exhausted,
      overdrawn,
    };
  }, [cards, tabCounts]);

  const columns = useMemo<ColumnDef<LimitFenceCard, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('warehouse.limitFenceCards.columnNumber'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('warehouse.limitFenceCards.columnProject'),
        size: 180,
      },
      {
        accessorKey: 'materialName',
        header: t('warehouse.limitFenceCards.columnMaterial'),
        size: 200,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {row.original.materialName}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{row.original.unit}</p>
          </div>
        ),
      },
      {
        accessorKey: 'limitQty',
        header: t('warehouse.limitFenceCards.columnLimit'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatNumber(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'issuedQty',
        header: t('warehouse.limitFenceCards.columnIssued'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatNumber(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'remaining',
        header: t('warehouse.limitFenceCards.columnRemaining'),
        size: 130,
        cell: ({ row }) => {
          const card = row.original;
          const pct =
            card.limitQty > 0 ? (card.issuedQty / card.limitQty) * 100 : 0;
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-danger-500' : pct >= 70 ? 'bg-warning-500' : 'bg-primary-500'}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="tabular-nums text-xs text-neutral-600 dark:text-neutral-400 w-12 text-right">
                {formatNumber(card.remaining)}
              </span>
            </div>
          );
        },
      },
      {
        id: 'period',
        header: t('warehouse.limitFenceCards.columnPeriod'),
        size: 180,
        cell: ({ row }) => (
          <span className="tabular-nums text-xs">
            {formatDate(row.original.periodFrom)} — {formatDate(row.original.periodTo)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('warehouse.limitFenceCards.columnStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={lfcStatusColorMap}
            label={lfcStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 50,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="xs"
            iconLeft={<Eye size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              setDetailCard(row.original);
            }}
          />
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('warehouse.limitFenceCards.title')}
        subtitle={t('warehouse.limitFenceCards.subtitle', { count: cards.length })}
        breadcrumbs={[
          { label: t('warehouse.breadcrumbHome'), href: '/' },
          { label: t('warehouse.breadcrumbWarehouse'), href: '/warehouse/materials' },
          { label: t('warehouse.limitFenceCards.breadcrumb') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            {t('warehouse.limitFenceCards.newCard')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('warehouse.limitFenceCards.tabAll'), count: tabCounts.all },
          { id: 'active', label: t('warehouse.limitFenceCards.tabActive'), count: tabCounts.active },
          { id: 'exhausted', label: t('warehouse.limitFenceCards.tabExhausted'), count: tabCounts.exhausted },
          { id: 'expired', label: t('warehouse.limitFenceCards.tabExpired'), count: tabCounts.expired },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<CreditCard size={18} />}
          label={t('warehouse.limitFenceCards.metricTotal')}
          value={metrics.total}
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={t('warehouse.limitFenceCards.metricActive')}
          value={metrics.active}
        />
        <MetricCard
          icon={<XCircle size={18} />}
          label={t('warehouse.limitFenceCards.metricExhausted')}
          value={metrics.exhausted}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('warehouse.limitFenceCards.metricOverdrawn')}
          value={metrics.overdrawn}
          trend={
            metrics.overdrawn > 0
              ? { direction: 'down', value: t('warehouse.limitFenceCards.trendNeedAttention') }
              : { direction: 'neutral', value: t('warehouse.limitFenceCards.trendAllNormal') }
          }
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('warehouse.limitFenceCards.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<LimitFenceCard>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('warehouse.limitFenceCards.emptyTitle')}
        emptyDescription={t('warehouse.limitFenceCards.emptyDescription')}
      />

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetForm();
        }}
        title={t('warehouse.limitFenceCards.createTitle')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreateOpen(false); resetForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button
              loading={createMutation.isPending}
              onClick={() => createMutation.mutate()}
              disabled={!formProject || !formMaterial || !formLimit || !formFrom || !formTo}
            >
              {t('common.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('warehouse.limitFenceCards.formProject')} required>
            <Input
              value={formProject}
              onChange={(e) => setFormProject(e.target.value)}
              placeholder={t('warehouse.limitFenceCards.formProjectPlaceholder')}
            />
          </FormField>
          <FormField label={t('warehouse.limitFenceCards.formMaterial')} required>
            <Input
              value={formMaterial}
              onChange={(e) => setFormMaterial(e.target.value)}
              placeholder={t('warehouse.limitFenceCards.formMaterialPlaceholder')}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('warehouse.limitFenceCards.formUnit')}>
              <Input
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                placeholder={t('warehouse.limitFenceCards.formUnitPlaceholder')}
              />
            </FormField>
            <FormField label={t('warehouse.limitFenceCards.formLimitQty')} required>
              <Input
                type="number"
                value={formLimit}
                onChange={(e) => setFormLimit(e.target.value)}
                placeholder="0"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('warehouse.limitFenceCards.formPeriodFrom')} required>
              <Input
                type="date"
                value={formFrom}
                onChange={(e) => setFormFrom(e.target.value)}
              />
            </FormField>
            <FormField label={t('warehouse.limitFenceCards.formPeriodTo')} required>
              <Input
                type="date"
                value={formTo}
                onChange={(e) => setFormTo(e.target.value)}
              />
            </FormField>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={detailCard !== null}
        onClose={() => setDetailCard(null)}
        title={detailCard ? `${t('warehouse.limitFenceCards.detailTitle')} ${detailCard.number}` : ''}
        size="lg"
      >
        {detailCard && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('warehouse.limitFenceCards.columnProject')}
                </p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {detailCard.projectName}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('warehouse.limitFenceCards.columnMaterial')}
                </p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {detailCard.materialName} ({detailCard.unit})
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('warehouse.limitFenceCards.columnLimit')}
                </p>
                <p className="text-sm tabular-nums">{formatNumber(detailCard.limitQty)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('warehouse.limitFenceCards.columnRemaining')}
                </p>
                <p className="text-sm tabular-nums">{formatNumber(detailCard.remaining)}</p>
              </div>
            </div>

            {/* Issuance history */}
            <div>
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                {t('warehouse.limitFenceCards.issuanceHistory')}
              </h4>
              {detailCard.issues.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-700">
                        <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                          {t('warehouse.limitFenceCards.issueDate')}
                        </th>
                        <th className="text-right py-2 px-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                          {t('warehouse.limitFenceCards.issueQty')}
                        </th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                          {t('warehouse.limitFenceCards.issueRecipient')}
                        </th>
                        <th className="text-right py-2 px-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                          {t('warehouse.limitFenceCards.issueRunningTotal')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailCard.issues.map((iss, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-neutral-100 dark:border-neutral-800"
                        >
                          <td className="py-2 px-2 tabular-nums">{formatDate(iss.date)}</td>
                          <td className="py-2 px-2 tabular-nums text-right">
                            {formatNumber(iss.qty)}
                          </td>
                          <td className="py-2 px-2">{iss.recipient}</td>
                          <td className="py-2 px-2 tabular-nums text-right font-medium">
                            {formatNumber(iss.runningTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('warehouse.limitFenceCards.noIssues')}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LimitFenceCardsPage;
