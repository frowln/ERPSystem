import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { prequalificationsApi, type Prequalification } from '@/api/prequalifications';
import {
  Edit3,
  ArrowLeft,
  Shield,
  Building2,
  User,
  Phone,
  Mail,
  FileCheck,
  Briefcase,
  Users,
  Calendar,
  DollarSign,
  Award,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { SroVerificationCard } from './components/SroVerificationCard';

const WORK_TYPE_LABELS: Record<string, string> = {
  GENERAL: 'Генподряд',
  CONCRETE: 'Бетонные работы',
  STEEL: 'Металлоконструкции',
  ELECTRICAL: 'Электромонтаж',
  PLUMBING: 'Сантехнические работы',
  HVAC: 'Вентиляция и кондиционирование',
  FACADE: 'Фасадные работы',
  ROOFING: 'Кровельные работы',
  LANDSCAPING: 'Благоустройство',
  OTHER: 'Прочее',
};

const resultConfig: Record<string, { color: string; label: string }> = {
  QUALIFIED: { color: 'green', label: 'Квалифицирован' },
  CONDITIONALLY_QUALIFIED: { color: 'yellow', label: 'Условно квалифицирован' },
  NOT_QUALIFIED: { color: 'red', label: 'Не квалифицирован' },
  PENDING: { color: 'gray', label: 'На рассмотрении' },
};

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-start gap-3 py-2.5">
    <span className="text-neutral-400 dark:text-neutral-500 mt-0.5">{icon}</span>
    <div className="flex-1 min-w-0">
      <dt className="text-xs text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-0.5">
        {value || '—'}
      </dd>
    </div>
  </div>
);

const ScoreBar: React.FC<{ label: string; value: number; max: number; color: string }> = ({
  label,
  value,
  max,
  color,
}) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-600 dark:text-neutral-400">{label}</span>
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
          {value} / {max}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const PrequalificationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: pq, isLoading } = useQuery<Prequalification>({
    queryKey: ['prequalification', id],
    queryFn: () => prequalificationsApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!pq) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle size={48} className="text-neutral-300" />
        <p className="text-neutral-500">Анкета преквалификации не найдена</p>
        <Button variant="outline" onClick={() => navigate('/prequalifications')}>
          Назад к списку
        </Button>
      </div>
    );
  }

  const totalScore = pq.totalScore ?? (
    (pq.financialScore ?? 0) +
    (pq.experienceScore ?? 0) +
    (pq.safetyScore ?? 0)
  );
  const maxScore = 20;
  const result = resultConfig[pq.qualificationResult] ?? resultConfig.PENDING;

  const fmtCurrency = (n?: number) =>
    n != null && n > 0
      ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n)
      : '—';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={pq.companyName}
        subtitle={WORK_TYPE_LABELS[pq.workType] ?? pq.workType ?? 'Преквалификация подрядчика'}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Преквалификация', href: '/prequalifications' },
          { label: pq.companyName },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              iconLeft={<ArrowLeft size={16} />}
              onClick={() => navigate('/prequalifications')}
            >
              Назад
            </Button>
            <Button
              iconLeft={<Edit3 size={16} />}
              onClick={() => navigate(`/prequalifications/${id}/edit`)}
            >
              Редактировать
            </Button>
          </div>
        }
      />

      {/* Result banner */}
      <div
        className={`mt-4 p-4 rounded-xl border flex items-center justify-between ${
          pq.qualificationResult === 'QUALIFIED'
            ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
            : pq.qualificationResult === 'CONDITIONALLY_QUALIFIED'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}
      >
        <div className="flex items-center gap-3">
          {pq.qualificationResult === 'QUALIFIED' ? (
            <CheckCircle className="text-success-600" size={24} />
          ) : pq.qualificationResult === 'CONDITIONALLY_QUALIFIED' ? (
            <AlertTriangle className="text-yellow-600" size={24} />
          ) : (
            <AlertTriangle className="text-red-600" size={24} />
          )}
          <div>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Результат оценки:
            </span>
            <span className="ml-2">
              <StatusBadge
                status={pq.qualificationResult}
                colorMap={{
                  QUALIFIED: 'green',
                  CONDITIONALLY_QUALIFIED: 'yellow',
                  NOT_QUALIFIED: 'red',
                  PENDING: 'gray',
                }}
                label={result.label}
              />
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            {totalScore}
          </span>
          <span className="text-sm text-neutral-500"> / {maxScore}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left column — company info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company data */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-neutral-400" />
              Данные компании
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <InfoRow icon={<Building2 size={16} />} label="Наименование" value={pq.companyName} />
              <InfoRow icon={<FileCheck size={16} />} label="ИНН" value={pq.inn} />
              <InfoRow
                icon={<Briefcase size={16} />}
                label="Вид работ"
                value={WORK_TYPE_LABELS[pq.workType] ?? pq.workType}
              />
              <InfoRow
                icon={<Calendar size={16} />}
                label="Дата создания"
                value={
                  pq.createdAt ? new Date(pq.createdAt).toLocaleDateString('ru-RU') : undefined
                }
              />
            </div>
          </div>

          {/* Contact person */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <User size={18} className="text-neutral-400" />
              Контактное лицо
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
              <InfoRow icon={<User size={16} />} label="ФИО" value={pq.contactPerson} />
              <InfoRow icon={<Phone size={16} />} label="Телефон" value={pq.contactPhone} />
              <InfoRow icon={<Mail size={16} />} label="Email" value={pq.contactEmail} />
            </div>
          </div>

          {/* Company details */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Award size={18} className="text-neutral-400" />
              Сведения о компании
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <InfoRow
                icon={<DollarSign size={16} />}
                label="Годовая выручка"
                value={fmtCurrency(pq.annualRevenue)}
              />
              <InfoRow
                icon={<Users size={16} />}
                label="Количество сотрудников"
                value={(pq.employeeCount ?? 0) > 0 ? pq.employeeCount : undefined}
              />
              <InfoRow
                icon={<Calendar size={16} />}
                label="Лет на рынке"
                value={pq.yearsInBusiness > 0 ? pq.yearsInBusiness : undefined}
              />
              <InfoRow
                icon={<Shield size={16} />}
                label="Членство в СРО"
                value={
                  pq.hasSroMembership ? (
                    <span className="text-success-600">Да{pq.sroNumber ? ` — ${pq.sroNumber}` : ''}</span>
                  ) : (
                    'Нет'
                  )
                }
              />
            </div>
          </div>

          {/* Notes */}
          {pq.notes && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                Примечания
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                {pq.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right column — scores */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5 flex items-center gap-2">
              <Shield size={18} className="text-neutral-400" />
              Оценка по критериям
            </h3>
            <div className="space-y-4">
              <ScoreBar
                label="Финансовая устойчивость"
                value={pq.financialScore ?? 0}
                max={8}
                color="bg-blue-500"
              />
              <ScoreBar
                label="Опыт аналогичных проектов"
                value={pq.experienceScore ?? 0}
                max={6}
                color="bg-emerald-500"
              />
              <ScoreBar
                label="Безопасность и ОТ"
                value={pq.safetyScore ?? 0}
                max={8}
                color="bg-amber-500"
              />
            </div>

            {/* Total */}
            <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Итого
                </span>
                <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  {totalScore} / {maxScore}
                </span>
              </div>
              <div className="h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    totalScore >= 16
                      ? 'bg-success-500'
                      : totalScore >= 10
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${(totalScore / maxScore) * 100}%` }}
                />
              </div>
            </div>

            {/* Thresholds legend */}
            <div className="mt-4 space-y-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-success-500" />
                <span>{'>= 16'} — Квалифицирован</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span>10–15 — Условно квалифицирован</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>{'< 10'} — Не квалифицирован</span>
              </div>
            </div>
          </div>

          {/* SRO Verification */}
          {pq.inn && <SroVerificationCard inn={pq.inn} />}
        </div>
      </div>
    </div>
  );
};

export default PrequalificationDetailPage;
