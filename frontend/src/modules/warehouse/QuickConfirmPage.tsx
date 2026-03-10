import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  XCircle,
  Package,
  Clock,
  CheckCheck,
  Ban,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { warehouseApi } from '@/api/warehouse';
import { t } from '@/i18n';
import { formatDate, formatNumber } from '@/lib/format';
import type { PendingConfirmation } from './types';

const movementTypeColorMap: Record<string, 'green' | 'blue' | 'gray'> = {
  RECEIPT: 'green',
  TRANSFER: 'blue',
  ISSUE: 'gray',
  ADJUSTMENT: 'gray',
  RETURN: 'green',
  WRITE_OFF: 'gray',
};

const QuickConfirmPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [todayConfirmed, setTodayConfirmed] = useState(0);
  const [todayRejected, setTodayRejected] = useState(0);

  const { data: pendingItems = [], isLoading } = useQuery({
    queryKey: ['warehouse-pending-confirmations'],
    queryFn: () => warehouseApi.getPendingConfirmations(),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => warehouseApi.confirmMovement(id),
    onMutate: (id) => {
      setProcessingIds((prev) => new Set(prev).add(id));
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-pending-confirmations'] });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setTodayConfirmed((c) => c + 1);
      toast.success(t('warehouse.quickConfirm.toastConfirmed'));
    },
    onSettled: (_, __, id) => {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    onError: () => {
      toast.error(t('warehouse.quickConfirm.toastError'));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => warehouseApi.rejectMovement(id),
    onMutate: (id) => {
      setProcessingIds((prev) => new Set(prev).add(id));
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-pending-confirmations'] });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setTodayRejected((c) => c + 1);
      toast.success(t('warehouse.quickConfirm.toastRejected'));
    },
    onSettled: (_, __, id) => {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    onError: () => {
      toast.error(t('warehouse.quickConfirm.toastError'));
    },
  });

  const batchConfirmMutation = useMutation({
    mutationFn: (ids: string[]) => warehouseApi.batchConfirmMovements(ids),
    onSuccess: () => {
      const count = selectedIds.size;
      queryClient.invalidateQueries({ queryKey: ['warehouse-pending-confirmations'] });
      setTodayConfirmed((c) => c + count);
      setSelectedIds(new Set());
      toast.success(t('warehouse.quickConfirm.toastBatchConfirmed', { count }));
    },
    onError: () => {
      toast.error(t('warehouse.quickConfirm.toastError'));
    },
  });

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === pendingItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingItems.map((item) => item.id)));
    }
  };

  const movementTypeLabel = useMemo(
    () => ({
      get RECEIPT() { return t('warehouse.quickConfirm.typeReceipt'); },
      get ISSUE() { return t('warehouse.quickConfirm.typeIssue'); },
      get TRANSFER() { return t('warehouse.quickConfirm.typeTransfer'); },
      get ADJUSTMENT() { return t('warehouse.quickConfirm.typeAdjustment'); },
      get RETURN() { return t('warehouse.quickConfirm.typeReturn'); },
      get WRITE_OFF() { return t('warehouse.quickConfirm.typeWriteOff'); },
    }),
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('warehouse.quickConfirm.title')}
        subtitle={t('warehouse.quickConfirm.subtitle')}
        backTo="/warehouse/movements"
        breadcrumbs={[
          { label: t('warehouse.breadcrumbHome'), href: '/' },
          { label: t('warehouse.breadcrumbWarehouse'), href: '/warehouse/materials' },
          { label: t('warehouse.quickConfirm.breadcrumb') },
        ]}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          label={t('warehouse.quickConfirm.metricPending')}
          value={String(pendingItems.length)}
          icon={<Clock className="w-5 h-5" />}
          trend={
            pendingItems.length > 0
              ? { value: t('warehouse.quickConfirm.trendNeedAction'), direction: 'down' as const }
              : { value: t('warehouse.quickConfirm.trendAllDone'), direction: 'up' as const }
          }
        />
        <MetricCard
          label={t('warehouse.quickConfirm.metricConfirmedToday')}
          value={String(todayConfirmed)}
          icon={<CheckCircle className="w-5 h-5" />}
          trend={{ value: t('warehouse.quickConfirm.trendToday'), direction: 'up' as const }}
        />
        <MetricCard
          label={t('warehouse.quickConfirm.metricRejectedToday')}
          value={String(todayRejected)}
          icon={<Ban className="w-5 h-5" />}
          trend={{ value: t('warehouse.quickConfirm.trendToday'), direction: 'neutral' as const }}
        />
      </div>

      {/* Batch actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {t('warehouse.quickConfirm.selectedCount', { count: selectedIds.size })}
          </span>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              onClick={() => batchConfirmMutation.mutate(Array.from(selectedIds))}
              loading={batchConfirmMutation.isPending}
              iconLeft={<CheckCheck size={14} />}
            >
              {t('warehouse.quickConfirm.batchConfirm')}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setSelectedIds(new Set())}>
              {t('warehouse.quickConfirm.clearSelection')}
            </Button>
          </div>
        </div>
      )}

      {/* Select all toggle */}
      {pendingItems.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                selectedIds.size === pendingItems.length && pendingItems.length > 0
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-neutral-300 dark:border-neutral-600'
              }`}
            >
              {selectedIds.size === pendingItems.length && pendingItems.length > 0 && (
                <CheckCheck className="w-3 h-3" />
              )}
            </div>
            {t('warehouse.quickConfirm.selectAll')}
          </button>
        </div>
      )}

      {/* Pending items list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
        </div>
      ) : pendingItems.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-3" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
            {t('warehouse.quickConfirm.emptyTitle')}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('warehouse.quickConfirm.emptyDescription')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingItems.map((item: PendingConfirmation) => {
            const isSelected = selectedIds.has(item.id);
            const isProcessing = processingIds.has(item.id);

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-neutral-900 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-blue-300 dark:border-blue-700 ring-1 ring-blue-200 dark:ring-blue-800'
                    : 'border-neutral-200 dark:border-neutral-700'
                } ${isProcessing ? 'opacity-60' : ''}`}
              >
                <div className="p-4 flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleSelection(item.id)}
                    disabled={isProcessing}
                    className="mt-0.5 shrink-0"
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-neutral-300 dark:border-neutral-600'
                      }`}
                    >
                      {isSelected && <CheckCheck className="w-3 h-3" />}
                    </div>
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {item.materialName}
                      </span>
                      <StatusBadge
                        status={item.movementType ?? ''}
                        colorMap={movementTypeColorMap}
                        label={movementTypeLabel[(item.movementType ?? '') as keyof typeof movementTypeLabel] ?? item.movementType ?? ''}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {formatNumber(item.quantity)} {item.unit}
                      </span>
                      {item.supplierOrSource && (
                        <span>{t('warehouse.quickConfirm.from')}: {item.supplierOrSource}</span>
                      )}
                      {item.destinationLocation && (
                        <span>{t('warehouse.quickConfirm.to')}: {item.destinationLocation}</span>
                      )}
                      <span className="tabular-nums">{formatDate(item.date)}</span>
                    </div>
                    {item.projectName && (
                      <div className="text-xs text-neutral-400 mt-0.5">{item.projectName}</div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => confirmMutation.mutate(item.id)}
                      disabled={isProcessing}
                      className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50"
                      title={t('warehouse.quickConfirm.btnConfirm')}
                    >
                      {isProcessing && confirmMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectMutation.mutate(item.id)}
                      disabled={isProcessing}
                      className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                      title={t('warehouse.quickConfirm.btnReject')}
                    >
                      {isProcessing && rejectMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Number and responsible info row */}
                <div className="px-4 pb-3 flex items-center gap-3 text-xs text-neutral-400">
                  <span className="font-mono">{item.number}</span>
                  {item.responsibleName && (
                    <>
                      <span className="text-neutral-300 dark:text-neutral-600">|</span>
                      <span>{item.responsibleName}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuickConfirmPage;
