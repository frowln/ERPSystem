import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Edit3,
  AlertTriangle,
  Calendar,
  User,
  FileText,
  Shield,
  Target,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { taxRiskApi } from './api';
import { formatDate, formatDateLong } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { TaxRiskAssessment, RiskLevel, TaxRiskStatus, TaxRiskFactor, TaxRiskMitigation } from './types';

type StatusBadgeColor = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan';

const riskLevelColorMap: Record<string, StatusBadgeColor> = {
  LOW: 'green',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  CRITICAL: 'red',
};

const riskLevelLabels: Record<RiskLevel, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  CRITICAL: 'Критический',
};

const statusColorMap: Record<string, StatusBadgeColor> = {
  DRAFT: 'gray',
  IN_PROGRESS: 'yellow',
  COMPLETED: 'blue',
  REVIEWED: 'green',
};

const statusLabels: Record<TaxRiskStatus, string> = {
  DRAFT: 'Черновик',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершена',
  REVIEWED: 'Проверена',
};

const mitigationStatusColorMap: Record<string, StatusBadgeColor> = {
  PLANNED: 'gray',
  IN_PROGRESS: 'yellow',
  COMPLETED: 'green',
  OVERDUE: 'red',
};

const mitigationStatusLabels: Record<string, string> = {
  PLANNED: 'Запланировано',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Выполнено',
  OVERDUE: 'Просрочено',
};
type DetailTab = 'overview' | 'factors' | 'mitigations';


const TaxRiskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  const { data: assessment } = useQuery<TaxRiskAssessment>({
    queryKey: ['tax-risk', id],
    queryFn: () => taxRiskApi.getById(id!),
    enabled: !!id,
  });

  if (!assessment) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-center h-64 text-neutral-400">Загрузка...</div>
      </div>
    );
  }

  const a = assessment;

  const scoreColor = a.overallScore >= 75 ? 'text-danger-600' : a.overallScore >= 50 ? 'text-warning-600' : a.overallScore >= 25 ? 'text-yellow-600' : 'text-success-600';
  const scoreBg = a.overallScore >= 75 ? 'bg-danger-50' : a.overallScore >= 50 ? 'bg-warning-50' : a.overallScore >= 25 ? 'bg-yellow-50' : 'bg-success-50';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={a.name}
        subtitle={a.projectName ?? 'Оценка налоговых рисков'}
        backTo="/tax-risk"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Налоговые риски', href: '/tax-risk' },
          { label: a.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={a.riskLevel}
              colorMap={riskLevelColorMap}
              label={riskLevelLabels[a.riskLevel]}
              size="md"
            />
            <StatusBadge
              status={a.status}
              colorMap={statusColorMap}
              label={statusLabels[a.status]}
              size="md"
            />
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit3 size={14} />}
              onClick={() => navigate(`/tax-risk/${id}/edit`)}
            >
              Редактировать
            </Button>
          </div>
        }
        tabs={[
          { id: 'overview', label: 'Обзор' },
          { id: 'factors', label: 'Факторы риска' },
          { id: 'mitigations', label: 'Мероприятия' },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as DetailTab)}
      />

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={<AlertTriangle size={18} />} label="Уровень риска" value={riskLevelLabels[a.riskLevel]} />
            <MetricCard icon={<Target size={18} />} label="Общий балл" value={`${a.overallScore}/100`} />
            <MetricCard icon={<Calendar size={18} />} label="Дата оценки" value={formatDate(a.assessmentDate)} />
            <MetricCard icon={<Shield size={18} />} label="Факторов" value={String(a.factors.length)} />
          </div>

          {/* Score visualization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Информация об оценке</h3>

              {a.description && (
                <p className="text-sm text-neutral-600 leading-relaxed mb-6 pb-6 border-b border-neutral-100">
                  {a.description}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                <InfoItem icon={<Calendar size={15} />} label="Дата оценки" value={formatDateLong(a.assessmentDate)} />
                {a.assessorName && <InfoItem icon={<User size={15} />} label="Оценщик" value={a.assessorName} />}
                {a.projectName && <InfoItem icon={<FileText size={15} />} label="Проект" value={a.projectName} />}
                <InfoItem icon={<FileText size={15} />} label="Создано" value={formatDateLong(a.createdAt)} />
              </div>
            </div>

            {/* Score card */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Оценка риска</h3>
              <div className={cn('rounded-xl p-6 text-center mb-4', scoreBg)}>
                <p className={cn('text-5xl font-bold tabular-nums', scoreColor)}>{a.overallScore}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">из 100</p>
              </div>
              {/* Score bar */}
              <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mb-3">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    a.overallScore >= 75 ? 'bg-danger-500' : a.overallScore >= 50 ? 'bg-warning-500' : a.overallScore >= 25 ? 'bg-yellow-500' : 'bg-success-500',
                  )}
                  style={{ width: `${a.overallScore}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Низкий</span>
                <span>Средний</span>
                <span>Высокий</span>
                <span>Крит.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'factors' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Факторы риска ({a.factors.length})</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 dark:bg-neutral-800">
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Фактор</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Категория</th>
                <th className="px-5 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Вес</th>
                <th className="px-5 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Балл</th>
                <th className="px-5 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Взвешенный</th>
              </tr>
            </thead>
            <tbody>
              {a.factors.map((f: TaxRiskFactor) => (
                <tr key={f.id} className="border-b border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{f.name}</p>
                    {f.description && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{f.description}</p>}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-600">{f.category}</td>
                  <td className="px-5 py-3 text-sm text-neutral-600 tabular-nums text-right">{f.weight}%</td>
                  <td className="px-5 py-3 text-sm font-medium tabular-nums text-right">
                    <span className={f.score >= 70 ? 'text-danger-600' : f.score >= 40 ? 'text-warning-600' : 'text-success-600'}>
                      {f.score}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold tabular-nums text-right">{f.weightedScore.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-neutral-50 dark:bg-neutral-800 font-semibold">
                <td className="px-5 py-3 text-sm text-neutral-900 dark:text-neutral-100" colSpan={2}>Итого</td>
                <td className="px-5 py-3 text-sm text-neutral-900 dark:text-neutral-100 tabular-nums text-right">100%</td>
                <td className="px-5 py-3 text-sm text-neutral-900 dark:text-neutral-100 tabular-nums text-right">---</td>
                <td className="px-5 py-3 text-sm text-neutral-900 dark:text-neutral-100 tabular-nums text-right">{a.overallScore.toFixed(1)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {activeTab === 'mitigations' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Мероприятия по снижению рисков ({a.mitigations.length})</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 dark:bg-neutral-800">
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Мероприятие</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Фактор</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Ответственный</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Срок</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Статус</th>
              </tr>
            </thead>
            <tbody>
              {a.mitigations.map((m: TaxRiskMitigation) => (
                <tr key={m.id} className="border-b border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <td className="px-5 py-3 text-sm text-neutral-700 dark:text-neutral-300">{m.action}</td>
                  <td className="px-5 py-3 text-sm text-neutral-500 dark:text-neutral-400">{m.factorName ?? '---'}</td>
                  <td className="px-5 py-3 text-sm text-neutral-600">{m.responsible ?? '---'}</td>
                  <td className="px-5 py-3 text-sm tabular-nums text-neutral-600">{m.deadline ? formatDate(m.deadline) : '---'}</td>
                  <td className="px-5 py-3">
                    <StatusBadge
                      status={m.status}
                      colorMap={mitigationStatusColorMap}
                      label={mitigationStatusLabels[m.status] ?? m.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

export default TaxRiskDetailPage;
