import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '@/api/crm';
import {
  User,
  Calendar,
  DollarSign,
  Mail,
  Phone,
  Building2,
  FileText,
  ArrowRight,
  Clock,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import {
  StatusBadge,
  crmLeadStatusColorMap,
  crmLeadStatusLabels,
  crmLeadPriorityColorMap,
  crmLeadPriorityLabels,
} from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { formatDateLong, formatMoney, formatMoneyCompact, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { CrmLead, CrmActivity as CrmActivityType } from './types';

const stageFlow = [
  { status: 'NEW', label: 'Новый' },
  { status: 'QUALIFIED', label: 'Квалификация' },
  { status: 'PROPOSITION', label: 'Предложение' },
  { status: 'NEGOTIATION', label: 'Переговоры' },
  { status: 'WON', label: 'Выиграно' },
];

const activityTypeLabels: Record<string, string> = {
  call: 'Звонок', email: 'Email', meeting: 'Встреча', note: 'Заметка', task: 'Задача', presentation: 'Презентация',
};

const activityTypeIcons: Record<string, string> = {
  call: 'text-green-500', email: 'text-blue-500', meeting: 'text-purple-500',
  note: 'text-neutral-500 dark:text-neutral-400', task: 'text-orange-500', presentation: 'text-cyan-500',
};

const CrmLeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: string }) =>
      crmApi.updateLead(leadId, { status } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-lead', id] });
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    },
  });

  const { data: lead, isLoading: isLeadLoading } = useQuery<CrmLead>({
    queryKey: ['crm-lead', id],
    queryFn: () => crmApi.getLead(id!),
    enabled: !!id,
  });

  const { data: activities } = useQuery<CrmActivityType[]>({
    queryKey: ['crm-lead-activities', id],
    queryFn: () => crmApi.getActivities(id!),
    enabled: !!id,
  });

  const activityList = activities ?? [];

  if (isLeadLoading || !lead) {
    return (
      <div className="animate-fade-in flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Загрузка лида...</p>
        </div>
      </div>
    );
  }

  const l = lead;

  const statusActions = useMemo(() => {
    switch (l.status) {
      case 'NEW': return [{ label: 'Квалифицировать', targetStatus: 'QUALIFIED' }];
      case 'QUALIFIED': return [
        { label: 'Подготовить предложение', targetStatus: 'PROPOSITION' },
        { label: 'Потеряно', targetStatus: 'LOST' },
      ];
      case 'PROPOSITION': return [
        { label: 'Перейти к переговорам', targetStatus: 'NEGOTIATION' },
        { label: 'Потеряно', targetStatus: 'LOST' },
      ];
      case 'NEGOTIATION': return [
        { label: 'Выиграно', targetStatus: 'WON' },
        { label: 'Потеряно', targetStatus: 'LOST' },
      ];
      default: return [];
    }
  }, [l.status]);

  const currentStepIndex = stageFlow.findIndex((s) => s.status === l.status);

  const pendingActivities = activityList.filter((a) => !a.isDone);
  const completedActivities = activityList.filter((a) => a.isDone);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={l.name}
        subtitle={`${l.number} / ${l.companyName ?? l.contactName}`}
        backTo="/crm/leads"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'CRM', href: '/crm/leads' },
          { label: l.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={l.status}
              colorMap={crmLeadStatusColorMap}
              label={crmLeadStatusLabels[l.status] ?? l.status}
              size="md"
            />
            <StatusBadge
              status={l.priority}
              colorMap={crmLeadPriorityColorMap}
              label={crmLeadPriorityLabels[l.priority] ?? l.priority}
              size="md"
            />
            {statusActions.map((action) => (
              <Button
                key={action.targetStatus}
                variant={action.targetStatus === 'WON' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => statusMutation.mutate({ leadId: id!, status: action.targetStatus })}
              >
                {action.label}
              </Button>
            ))}
          </div>
        }
      />

      {/* Stage flow */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Воронка продаж</h3>
        <div className="flex items-center gap-2">
          {stageFlow.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <React.Fragment key={step.status}>
                <div
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                    isCompleted && 'bg-success-50 text-success-700',
                    isCurrent && 'bg-primary-50 text-primary-700 ring-2 ring-primary-200',
                    !isCompleted && !isCurrent && 'bg-neutral-50 dark:bg-neutral-800 text-neutral-400',
                  )}
                >
                  <span className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                    isCompleted && 'bg-success-500 text-white',
                    isCurrent && 'bg-primary-500 text-white',
                    !isCompleted && !isCurrent && 'bg-neutral-200 text-neutral-400',
                  )}>
                    {idx + 1}
                  </span>
                  {step.label}
                </div>
                {idx < stageFlow.length - 1 && (
                  <ArrowRight size={16} className="text-neutral-300 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<DollarSign size={18} />} label="Ожидаемая выручка" value={l.expectedRevenue ? formatMoneyCompact(l.expectedRevenue) : '---'} />
        <MetricCard icon={<Activity size={18} />} label="Вероятность" value={l.probability != null ? formatPercent(l.probability) : '---'} />
        <MetricCard icon={<Clock size={18} />} label="Активностей" value={l.activityCount} />
        <MetricCard icon={<Calendar size={18} />} label="Дата закрытия" value={formatDateLong(l.expectedCloseDate)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-primary-500" />
              Описание
            </h3>
            <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
              {l.description ?? 'Описание не заполнено'}
            </div>
          </div>

          {/* Upcoming activities */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Clock size={16} className="text-warning-500" />
                Предстоящие действия ({pendingActivities.length})
              </h3>
              <Button variant="secondary" size="sm" onClick={() => navigate(`/crm/leads/${id}/activities/new`)}>
                Запланировать
              </Button>
            </div>
            {pendingActivities.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Нет запланированных действий</p>
            ) : (
              <div className="space-y-2">
                {pendingActivities.map((act) => (
                  <div key={act.id} className="flex items-center gap-3 p-3 rounded-lg border border-warning-100 bg-warning-50/30">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activityTypeIcons[act.type] ?? 'bg-neutral-400'}`}
                      style={{ backgroundColor: 'currentColor' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{act.title}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {activityTypeLabels[act.type] ?? act.type} | {act.assignedToName} | {formatDateLong(act.scheduledAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed activities */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <CheckCircle size={16} className="text-success-500" />
              Выполненные действия ({completedActivities.length})
            </h3>
            {completedActivities.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Нет выполненных действий</p>
            ) : (
              <div className="space-y-2">
                {completedActivities.map((act) => (
                  <div key={act.id} className="flex items-center gap-3 p-3 rounded-lg border border-neutral-100">
                    <CheckCircle size={14} className="text-success-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">{act.title}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {activityTypeLabels[act.type] ?? act.type} | {act.assignedToName} | {formatDateLong(act.completedAt)}
                      </p>
                      {act.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 italic">"{act.description}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Контакт</h3>
            <div className="space-y-4">
              <InfoItem icon={<User size={15} />} label="Контактное лицо" value={l.contactName} />
              <InfoItem icon={<Building2 size={15} />} label="Компания" value={l.companyName ?? '---'} />
              <InfoItem icon={<Mail size={15} />} label="Email" value={l.contactEmail ?? '---'} />
              <InfoItem icon={<Phone size={15} />} label="Телефон" value={l.contactPhone ?? '---'} />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Детали</h3>
            <div className="space-y-4">
              <InfoItem icon={<User size={15} />} label="Ответственный" value={l.assignedToName ?? '---'} />
              <InfoItem icon={<User size={15} />} label="Команда" value={l.teamName ?? '---'} />
              <InfoItem icon={<FileText size={15} />} label="Источник" value={l.source ?? '---'} />
              <InfoItem icon={<Calendar size={15} />} label="Создано" value={formatDateLong(l.createdAt)} />
              <InfoItem icon={<Calendar size={15} />} label="Обновлено" value={formatDateLong(l.updatedAt)} />
            </div>
          </div>

          {/* Financial */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Финансы</h3>
            <div className="space-y-3">
              <div className="p-3 bg-primary-50 rounded-lg border border-primary-100">
                <p className="text-xs font-medium text-primary-600 mb-1">Ожидаемая выручка</p>
                <p className="text-lg font-bold text-primary-700 tabular-nums">
                  {l.expectedRevenue ? formatMoney(l.expectedRevenue) : '---'}
                </p>
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-100">
                <p className="text-xs font-medium text-neutral-600 mb-1">Вероятность закрытия</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${l.probability ?? 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300 tabular-nums">{l.probability ?? 0}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Действия</h3>
            <div className="space-y-2">
              <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate(`/crm/leads/${id}/activities/new`)}>
                Добавить активность
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => window.open(`/api/crm/leads/${id}/export?format=pdf`, '_blank')}>
                Экспорт в PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
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

export default CrmLeadDetailPage;
