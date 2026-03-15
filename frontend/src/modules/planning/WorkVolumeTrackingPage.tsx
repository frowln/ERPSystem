import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Calendar, ClipboardList, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { planningApi } from '@/api/planning';
import { t } from '@/i18n';
import { formatDateLong } from '@/lib/format';
import { useProjectOptions } from '@/hooks/useSelectOptions';
import toast from 'react-hot-toast';
import type { WorkVolumeSummary } from './types';

function toIsoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr: string): string {
  return formatDateLong(dateStr + 'T00:00:00');
}

interface VolumeInput {
  wbsNodeId: string;
  quantity: string;
  existingEntryId?: string;
}

const WorkVolumeTrackingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { options: projectOptions } = useProjectOptions();

  const [projectId, setProjectId] = useState('');
  const [selectedDate, setSelectedDate] = useState(toIsoDate(new Date()));
  const [volumeInputs, setVolumeInputs] = useState<Record<string, VolumeInput>>({});
  const [saving, setSaving] = useState(false);

  // Fetch volume summary for the selected project and date
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['work-volume-summary', projectId, selectedDate],
    queryFn: () => planningApi.getWorkVolumeSummary(projectId, selectedDate),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });

  // Fetch existing entries for the selected date to pre-fill inputs
  const { data: dayEntries } = useQuery({
    queryKey: ['work-volume-day', projectId, selectedDate],
    queryFn: () => planningApi.getWorkVolumesByDate(projectId, selectedDate),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });

  const summaryList: WorkVolumeSummary[] = summaryData ?? [];

  // Initialize volume inputs when day entries load
  React.useEffect(() => {
    if (!dayEntries) return;
    const inputs: Record<string, VolumeInput> = {};
    for (const entry of dayEntries) {
      inputs[entry.wbsNodeId] = {
        wbsNodeId: entry.wbsNodeId,
        quantity: String(entry.quantity),
        existingEntryId: entry.id,
      };
    }
    setVolumeInputs(inputs);
  }, [dayEntries]);

  const handleInputChange = useCallback((wbsNodeId: string, value: string) => {
    setVolumeInputs((prev) => ({
      ...prev,
      [wbsNodeId]: {
        ...prev[wbsNodeId],
        wbsNodeId,
        quantity: value,
      },
    }));
  }, []);

  const prevDay = useCallback(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(toIsoDate(d));
    setVolumeInputs({});
  }, [selectedDate]);

  const nextDay = useCallback(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(toIsoDate(d));
    setVolumeInputs({});
  }, [selectedDate]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const entries = Object.values(volumeInputs).filter((v) => {
        const qty = parseFloat(v.quantity);
        return !isNaN(qty) && qty > 0;
      });

      for (const entry of entries) {
        const qty = parseFloat(entry.quantity);
        const summary = summaryList.find((s) => s.wbsNodeId === entry.wbsNodeId);
        const unitOfMeasure = summary?.unitOfMeasure || 'шт';

        const payload = {
          projectId,
          wbsNodeId: entry.wbsNodeId,
          recordDate: selectedDate,
          quantity: qty,
          unitOfMeasure,
        };

        if (entry.existingEntryId) {
          await planningApi.updateWorkVolume(entry.existingEntryId, payload);
        } else {
          await planningApi.createWorkVolume(payload);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-volume-summary'] });
      queryClient.invalidateQueries({ queryKey: ['work-volume-day'] });
      toast.success(t('planning.volumes.saveSuccess'));
    },
    onError: () => {
      toast.error(t('planning.volumes.saveError'));
    },
    onSettled: () => {
      setSaving(false);
    },
  });

  const handleSave = () => {
    setSaving(true);
    saveMutation.mutate();
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalNodes = summaryList.length;
    const withVolume = summaryList.filter((s) => s.actualVolume > 0).length;
    const avgProgress = totalNodes > 0
      ? Math.round(summaryList.reduce((sum, s) => sum + s.percentComplete, 0) / totalNodes)
      : 0;
    const todayTotal = summaryList.reduce((sum, s) => sum + s.todayVolume, 0);
    return { totalNodes, withVolume, avgProgress, todayTotal };
  }, [summaryList]);

  const hasChanges = Object.values(volumeInputs).some((v) => {
    const qty = parseFloat(v.quantity);
    return !isNaN(qty) && qty > 0;
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('planning.volumes.title')}
        subtitle={t('planning.volumes.subtitle')}
        breadcrumbs={[
          { label: t('planning.volumes.breadcrumbHome'), href: '/' },
          { label: t('planning.volumes.breadcrumbPlanning') },
          { label: t('planning.volumes.breadcrumbVolumes') },
        ]}
        actions={
          <Button
            iconLeft={<Save size={16} />}
            onClick={handleSave}
            disabled={!hasChanges || saving || !projectId}
          >
            {saving ? t('planning.volumes.saving') : t('planning.volumes.save')}
          </Button>
        }
      />

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <FormField label={t('planning.volumes.project')}>
          <Select
            options={projectOptions}
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setVolumeInputs({});
            }}
            placeholder={t('planning.volumes.selectProject')}
          />
        </FormField>
        <FormField label={t('planning.volumes.date')}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevDay}
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <ChevronLeft size={16} className="text-neutral-500" />
            </button>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setVolumeInputs({});
              }}
              className="flex-1"
            />
            <button
              type="button"
              onClick={nextDay}
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <ChevronRight size={16} className="text-neutral-500" />
            </button>
          </div>
        </FormField>
      </div>

      {projectId && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
          {formatDisplayDate(selectedDate)}
        </p>
      )}

      {/* Metrics */}
      {projectId && summaryList.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon={<ClipboardList size={18} />}
            label={t('planning.volumes.metricTotalNodes')}
            value={metrics.totalNodes}
          />
          <MetricCard
            icon={<TrendingUp size={18} />}
            label={t('planning.volumes.metricAvgProgress')}
            value={`${metrics.avgProgress}%`}
          />
          <MetricCard
            icon={<Calendar size={18} />}
            label={t('planning.volumes.metricTodayTotal')}
            value={metrics.todayTotal.toFixed(1)}
          />
          <MetricCard
            label={t('planning.volumes.metricWithVolume')}
            value={`${metrics.withVolume} / ${metrics.totalNodes}`}
          />
        </div>
      )}

      {/* Volume entry table */}
      {!projectId && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-8 text-center">
          <p className="text-sm text-neutral-400">{t('planning.volumes.selectProjectHint')}</p>
        </div>
      )}

      {projectId && summaryLoading && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-8 text-center">
          <p className="text-sm text-neutral-400">{t('planning.volumes.loading')}</p>
        </div>
      )}

      {projectId && !summaryLoading && summaryList.length === 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-8 text-center">
          <p className="text-sm text-neutral-400">{t('planning.volumes.noNodes')}</p>
        </div>
      )}

      {projectId && !summaryLoading && summaryList.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24">
                    {t('planning.volumes.colCode')}
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('planning.volumes.colName')}
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-16">
                    {t('planning.volumes.colUnit')}
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24">
                    {t('planning.volumes.colPlanned')}
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24">
                    {t('planning.volumes.colActual')}
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24">
                    {t('planning.volumes.colRemaining')}
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-36">
                    {t('planning.volumes.colProgress')}
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-32">
                    {t('planning.volumes.colToday')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {summaryList.map((row) => {
                  const inputValue = volumeInputs[row.wbsNodeId]?.quantity ?? '';
                  const isComplete = row.percentComplete >= 100;

                  return (
                    <tr
                      key={row.wbsNodeId}
                      className={cn(
                        'border-b border-neutral-100 dark:border-neutral-800 transition-colors',
                        isComplete
                          ? 'bg-success-50/30 dark:bg-success-950/20'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                      )}
                    >
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                          {row.wbsCode}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {row.wbsName}
                        </span>
                        <span className={cn(
                          'ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium',
                          row.nodeType === 'WORK_PACKAGE'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                        )}>
                          {row.nodeType === 'WORK_PACKAGE' ? t('planning.volumes.workPackage') : t('planning.volumes.activity')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-neutral-500 dark:text-neutral-400">
                        {row.unitOfMeasure || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm tabular-nums text-neutral-700 dark:text-neutral-300">
                        {row.plannedVolume > 0 ? row.plannedVolume.toFixed(1) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
                        {row.actualVolume > 0 ? row.actualVolume.toFixed(1) : '0'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm tabular-nums text-neutral-500 dark:text-neutral-400">
                        {row.remainingVolume > 0 ? row.remainingVolume.toFixed(1) : '0'}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                row.percentComplete >= 100
                                  ? 'bg-success-500'
                                  : row.percentComplete >= 50
                                    ? 'bg-primary-500'
                                    : 'bg-warning-500',
                              )}
                              style={{ width: `${Math.min(row.percentComplete, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium tabular-nums text-neutral-600 dark:text-neutral-400 w-10 text-right">
                            {row.percentComplete.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="0"
                          value={inputValue}
                          onChange={(e) => handleInputChange(row.wbsNodeId, e.target.value)}
                          className={cn(
                            'w-24 rounded-lg border px-2 py-1.5 text-sm text-right tabular-nums',
                            'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800',
                            'text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400',
                            'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                            isComplete && 'opacity-60',
                          )}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkVolumeTrackingPage;
