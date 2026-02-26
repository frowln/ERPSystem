import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { regulatoryApi } from '@/api/regulatory';
import type { InspectionPrepItem, InspectionPrepItemStatus } from './types';
import { t } from '@/i18n';

const prepStatusColorMap: Record<string, string> = {
  ready: 'green',
  pending: 'yellow',
  missing: 'red',
};

const INSPECTION_TYPES = [
  'scheduled',
  'unscheduled',
  'rostechnadzor',
  'fire',
  'labor',
] as const;

const InspectionPrepPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [inspectionType, setInspectionType] = useState('scheduled');
  const [generating, setGenerating] = useState(false);

  const { data: items = [], isLoading } = useQuery<InspectionPrepItem[]>({
    queryKey: ['inspection-prep', inspectionType],
    queryFn: () => regulatoryApi.getInspectionPrepItems(inspectionType),
  });

  const handleGeneratePackage = useCallback(async () => {
    setGenerating(true);
    try {
      const blob = await regulatoryApi.generateInspectionPackage(inspectionType);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inspection-package-${inspectionType}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t('regulatory.ipPackageGenerated'));
    } catch {
      toast.error(t('regulatory.ipPackageError'));
    } finally {
      setGenerating(false);
    }
  }, [inspectionType]);

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: InspectionPrepItemStatus;
    }) => regulatoryApi.updatePrepItemStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-prep'] });
      toast.success(t('regulatory.ipStatusUpdated'));
    },
    onError: () => toast.error(t('regulatory.ipStatusError')),
  });

  const categories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category));
    return Array.from(cats).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (categoryFilter)
      filtered = filtered.filter((i) => i.category === categoryFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.documentName.toLowerCase().includes(lower) ||
          i.responsibleName.toLowerCase().includes(lower) ||
          i.category.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [items, categoryFilter, search]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, InspectionPrepItem[]> = {};
    for (const item of filteredItems) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filteredItems]);

  const metrics = useMemo(() => {
    const total = items.length;
    const ready = items.filter((i) => i.status === 'ready').length;
    const pending = items.filter((i) => i.status === 'pending').length;
    const missing = items.filter((i) => i.status === 'missing').length;
    const progress = total > 0 ? Math.round((ready / total) * 100) : 0;
    return { total, ready, pending, missing, progress };
  }, [items]);

  const getPrepStatusLabel = useCallback((status: string): string => {
    const map: Record<string, string> = {
      ready: t('regulatory.ipStatusReady'),
      pending: t('regulatory.ipStatusPending'),
      missing: t('regulatory.ipStatusMissing'),
    };
    return map[status] ?? status;
  }, []);

  const handleStatusChange = useCallback(
    (id: string, newStatus: InspectionPrepItemStatus) => {
      statusMutation.mutate({ id, status: newStatus });
    },
    [statusMutation],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('regulatory.ipTitle')}
        subtitle={t('regulatory.ipSubtitle')}
        breadcrumbs={[
          { label: t('regulatory.breadcrumbHome'), href: '/' },
          {
            label: t('regulatory.breadcrumbRegulatory'),
            href: '/regulatory/dashboard',
          },
          { label: t('regulatory.ipBreadcrumb') },
        ]}
        actions={
          <Button
            iconLeft={<Download size={16} />}
            onClick={handleGeneratePackage}
            loading={generating}
            disabled={metrics.ready === 0}
          >
            {t('regulatory.ipBtnGeneratePackage')}
          </Button>
        }
      />

      {/* Inspection Type Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          {t('regulatory.ipInspectionType')}
        </label>
        <div className="flex flex-wrap gap-2">
          {INSPECTION_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setInspectionType(type)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
                inspectionType === type
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800',
              )}
            >
              {t(`regulatory.ipType_${type}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard
          icon={<ClipboardCheck size={18} />}
          label={t('regulatory.ipMetricTotal')}
          value={metrics.total}
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={t('regulatory.ipMetricReady')}
          value={metrics.ready}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('regulatory.ipMetricPending')}
          value={metrics.pending}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('regulatory.ipMetricMissing')}
          value={metrics.missing}
          trend={
            metrics.missing > 0
              ? { direction: 'down', value: t('regulatory.trendUrgent') }
              : undefined
          }
        />
        <MetricCard
          icon={<ClipboardCheck size={18} />}
          label={t('regulatory.ipMetricProgress')}
          value={`${metrics.progress}%`}
        />
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('regulatory.ipProgressLabel')}
          </span>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {metrics.progress}%
          </span>
        </div>
        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
          <div
            className="bg-primary-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${metrics.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            placeholder={t('regulatory.ipSearchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('regulatory.ipAllCategories') },
            ...categories.map((c) => ({ value: c, label: c })),
          ]}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-56"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-neutral-500 dark:text-neutral-400">
            {t('common.loading')}
          </p>
        </div>
      ) : Object.keys(groupedItems).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <ClipboardCheck
            size={48}
            className="text-neutral-300 dark:text-neutral-600 mb-3"
          />
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {t('regulatory.ipEmptyTitle')}
          </p>
          <p className="text-neutral-400 text-xs mt-1">
            {t('regulatory.ipEmptyDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div
              key={category}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
            >
              <div className="px-5 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {category}
                  </h3>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {
                      categoryItems.filter((i) => i.status === 'ready')
                        .length
                    }{' '}
                    / {categoryItems.length}
                  </span>
                </div>
              </div>
              <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {categoryItems.map((item) => (
                  <li
                    key={item.id}
                    className="px-5 py-3 flex items-center gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {item.documentName}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {t('regulatory.ipResponsible')}: {item.responsibleName}
                        {item.notes && ` | ${item.notes}`}
                      </p>
                    </div>
                    <StatusBadge
                      status={item.status}
                      colorMap={prepStatusColorMap}
                      label={getPrepStatusLabel(item.status)}
                    />
                    <Select
                      options={[
                        {
                          value: 'ready',
                          label: t('regulatory.ipStatusReady'),
                        },
                        {
                          value: 'pending',
                          label: t('regulatory.ipStatusPending'),
                        },
                        {
                          value: 'missing',
                          label: t('regulatory.ipStatusMissing'),
                        },
                      ]}
                      value={item.status}
                      onChange={(e) =>
                        handleStatusChange(
                          item.id,
                          e.target.value as InspectionPrepItemStatus,
                        )
                      }
                      className="w-36"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InspectionPrepPage;
