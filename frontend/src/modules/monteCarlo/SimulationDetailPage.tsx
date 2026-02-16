import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit3,
  Play,
  Calendar,
  Clock,
  BarChart3,
  Target,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { monteCarloApi } from './api';
import { formatDate, formatDateLong, formatNumber } from '@/lib/format';
import type { MonteCarloSimulation, SimulationStatus, SimulationTask } from './types';

type BadgeColor = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan';

const statusColorMap: Record<SimulationStatus, BadgeColor> = {
  DRAFT: 'gray',
  RUNNING: 'yellow',
  COMPLETED: 'green',
  FAILED: 'red',
};

const statusLabels: Record<SimulationStatus, string> = {
  DRAFT: 'Черновик',
  RUNNING: 'Выполняется',
  COMPLETED: 'Завершена',
  FAILED: 'Ошибка',
};
type DetailTab = 'results' | 'tasks';


const SimulationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<DetailTab>('results');

  const { data: simulation } = useQuery<MonteCarloSimulation>({
    queryKey: ['monte-carlo', id],
    queryFn: () => monteCarloApi.getById(id!),
    enabled: !!id,
  });

  const runMutation = useMutation({
    mutationFn: () => monteCarloApi.runSimulation(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monte-carlo', id] });
      queryClient.invalidateQueries({ queryKey: ['monte-carlo'] });
    },
  });

  if (!simulation) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-center h-64 text-neutral-400">Загрузка...</div>
      </div>
    );
  }

  const s = simulation;
  const r = s.results;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={s.name}
        subtitle={s.projectName ?? 'Симуляция Монте-Карло'}
        backTo="/monte-carlo"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Монте-Карло', href: '/monte-carlo' },
          { label: s.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={s.status}
              colorMap={statusColorMap}
              label={statusLabels[s.status]}
              size="md"
            />
            {(s.status === 'DRAFT' || s.status === 'COMPLETED') && (
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<Play size={14} />}
                onClick={() => runMutation.mutate()}
                loading={runMutation.isPending}
              >
                {s.status === 'COMPLETED' ? 'Перезапустить' : 'Запустить'}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit3 size={14} />}
              onClick={() => navigate(`/monte-carlo/${id}/edit`)}
            >
              Редактировать
            </Button>
          </div>
        }
        tabs={[
          { id: 'results', label: 'Результаты' },
          { id: 'tasks', label: `Задачи (${s.tasks.length})` },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as DetailTab)}
      />

      {activeTab === 'results' && (
        <div className="space-y-6">
          {r ? (
            <>
              {/* P-values */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-center">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-wider font-semibold">P50 (вероятные)</p>
                  <p className="text-3xl font-bold text-success-600 tabular-nums">{r.p50Duration} дн.</p>
                  {r.p50Date && <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{formatDate(r.p50Date)}</p>}
                </div>
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-center">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-wider font-semibold">P85 (уверенные)</p>
                  <p className="text-3xl font-bold text-warning-600 tabular-nums">{r.p85Duration} дн.</p>
                  {r.p85Date && <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{formatDate(r.p85Date)}</p>}
                </div>
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-center">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-wider font-semibold">P95 (гарантированные)</p>
                  <p className="text-3xl font-bold text-danger-600 tabular-nums">{r.p95Duration} дн.</p>
                  {r.p95Date && <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{formatDate(r.p95Date)}</p>}
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard icon={<BarChart3 size={18} />} label="Среднее" value={`${r.meanDuration} дн.`} />
                <MetricCard icon={<Activity size={18} />} label="Ст. отклонение" value={`${r.standardDeviation} дн.`} />
                <MetricCard icon={<TrendingUp size={18} />} label="Мин / Макс" value={`${r.minDuration} / ${r.maxDuration}`} />
                <MetricCard icon={<Target size={18} />} label="Итераций" value={formatNumber(r.completedIterations)} />
              </div>

              {/* Visual range */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Диапазон длительности</h3>
                <div className="relative h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden">
                  {/* Range visualization */}
                  <div
                    className="absolute top-0 bottom-0 bg-success-100"
                    style={{
                      left: `${((r.p50Duration - r.minDuration) / (r.maxDuration - r.minDuration)) * 100}%`,
                      width: `${((r.p85Duration - r.p50Duration) / (r.maxDuration - r.minDuration)) * 100}%`,
                    }}
                  />
                  <div
                    className="absolute top-0 bottom-0 bg-warning-100"
                    style={{
                      left: `${((r.p85Duration - r.minDuration) / (r.maxDuration - r.minDuration)) * 100}%`,
                      width: `${((r.p95Duration - r.p85Duration) / (r.maxDuration - r.minDuration)) * 100}%`,
                    }}
                  />
                  {/* P50 line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-success-600"
                    style={{ left: `${((r.p50Duration - r.minDuration) / (r.maxDuration - r.minDuration)) * 100}%` }}
                  />
                  {/* P85 line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-warning-600"
                    style={{ left: `${((r.p85Duration - r.minDuration) / (r.maxDuration - r.minDuration)) * 100}%` }}
                  />
                  {/* P95 line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-danger-600"
                    style={{ left: `${((r.p95Duration - r.minDuration) / (r.maxDuration - r.minDuration)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <span>{r.minDuration} дн.</span>
                  <div className="flex gap-4">
                    <span className="text-success-600 font-medium">P50: {r.p50Duration}</span>
                    <span className="text-warning-600 font-medium">P85: {r.p85Duration}</span>
                    <span className="text-danger-600 font-medium">P95: {r.p95Duration}</span>
                  </div>
                  <span>{r.maxDuration} дн.</span>
                </div>
              </div>

              {/* Info */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Параметры симуляции</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                  <InfoItem icon={<Target size={15} />} label="Итераций" value={formatNumber(s.iterations)} />
                  <InfoItem icon={<BarChart3 size={15} />} label="Уровень доверия" value={`${s.confidenceLevel}%`} />
                  <InfoItem icon={<Clock size={15} />} label="Задач в модели" value={String(s.tasks.length)} />
                  <InfoItem icon={<Calendar size={15} />} label="Рассчитано" value={r.calculatedAt ? formatDateLong(r.calculatedAt) : '---'} />
                </div>
                {s.description && (
                  <p className="text-sm text-neutral-600 leading-relaxed mt-5 pt-5 border-t border-neutral-100">
                    {s.description}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-12 flex flex-col items-center justify-center text-center">
              <Play size={48} className="text-neutral-300 mb-4" />
              <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Запустите симуляцию</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
                Добавьте задачи и запустите моделирование для получения результатов.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Задачи модели ({s.tasks.length})</h3>
          </div>
          {s.tasks.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 dark:bg-neutral-800">
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Задача</th>
                  <th className="px-5 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Оптимист.</th>
                  <th className="px-5 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Наиболее вер.</th>
                  <th className="px-5 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Пессимист.</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Предшественники</th>
                </tr>
              </thead>
              <tbody>
                {s.tasks.map((t: SimulationTask) => {
                  const predecessorNames = t.predecessors
                    ?.map((pid) => s.tasks.find((st) => st.id === pid)?.name ?? pid)
                    .join(', ');
                  return (
                    <tr key={t.id} className="border-b border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                      <td className="px-5 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">{t.name}</td>
                      <td className="px-5 py-3 text-sm tabular-nums text-right text-success-600">{t.optimisticDuration} дн.</td>
                      <td className="px-5 py-3 text-sm tabular-nums text-right text-neutral-700 dark:text-neutral-300 font-medium">{t.mostLikelyDuration} дн.</td>
                      <td className="px-5 py-3 text-sm tabular-nums text-right text-danger-600">{t.pessimisticDuration} дн.</td>
                      <td className="px-5 py-3 text-sm text-neutral-500 dark:text-neutral-400">{predecessorNames || '---'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
              <p className="text-sm">Задачи ещё не добавлены</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-start gap-3">
    <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{value}</p>
    </div>
  </div>
);

export default SimulationDetailPage;
