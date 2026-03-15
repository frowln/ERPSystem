import React, { useState, useCallback } from 'react';
import {
  Shield,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileDown,
  ClipboardList,
  Info,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/design-system/components/PageHeader';

/* ─── Types ─── */

type SubmissionStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'APPROVED';

interface ChecklistItem {
  id: string;
  label: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'registration', label: 'Зарегистрировать учётную запись на портале pd.rkn.gov.ru' },
  { id: 'purpose', label: 'Определить цели обработки персональных данных' },
  { id: 'legalBasis', label: 'Подготовить правовое основание обработки ПДн' },
  { id: 'categories', label: 'Определить категории обрабатываемых персональных данных' },
  { id: 'subjects', label: 'Определить категории субъектов персональных данных' },
  { id: 'measures', label: 'Описать меры по обеспечению безопасности ПДн' },
  { id: 'crossBorder', label: 'Определить наличие трансграничной передачи ПДн' },
  { id: 'dpo', label: 'Назначить ответственного за организацию обработки ПДн' },
  { id: 'submit', label: 'Подать уведомление через портал Роскомнадзора' },
];

const REQUIRED_FIELDS = [
  { key: 'operator', label: 'Наименование оператора' },
  { key: 'inn', label: 'ИНН' },
  { key: 'address', label: 'Адрес (юридический)' },
  { key: 'purpose', label: 'Цель обработки персональных данных' },
  { key: 'categories', label: 'Категории персональных данных' },
  { key: 'legalBasis', label: 'Правовое основание обработки' },
  { key: 'subjects', label: 'Категории субъектов ПДн' },
  { key: 'measures', label: 'Меры по обеспечению безопасности' },
  { key: 'startDate', label: 'Дата начала обработки ПДн' },
];

const STATUS_OPTIONS: { value: SubmissionStatus; label: string; color: string; bg: string }[] = [
  { value: 'NOT_SUBMITTED', label: 'Не подано', color: 'text-neutral-600 dark:text-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-800' },
  { value: 'SUBMITTED', label: 'Подано', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { value: 'APPROVED', label: 'Принято', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
];

const LS_KEY = 'rkn-page-state';

interface PageState {
  checked: Record<string, boolean>;
  status: SubmissionStatus;
  statusDate: string;
}

function loadState(): PageState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as PageState;
  } catch {
    // ignore
  }
  return { checked: {}, status: 'NOT_SUBMITTED', statusDate: '' };
}

function saveState(state: PageState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

/* ─── Component ─── */

const RoskomnadzorPage: React.FC = () => {
  const [state, setState] = useState<PageState>(loadState);

  const toggleCheck = useCallback((id: string) => {
    setState((prev) => {
      const next = { ...prev, checked: { ...prev.checked, [id]: !prev.checked[id] } };
      saveState(next);
      return next;
    });
  }, []);

  const setStatus = useCallback((status: SubmissionStatus) => {
    setState((prev) => {
      const next = { ...prev, status, statusDate: new Date().toISOString().slice(0, 10) };
      saveState(next);
      return next;
    });
  }, []);

  const setStatusDate = useCallback((date: string) => {
    setState((prev) => {
      const next = { ...prev, statusDate: date };
      saveState(next);
      return next;
    });
  }, []);

  const checkedCount = CHECKLIST_ITEMS.filter((item) => state.checked[item.id]).length;
  const progressPct = Math.round((checkedCount / CHECKLIST_ITEMS.length) * 100);
  const currentStatusOption = STATUS_OPTIONS.find((o) => o.value === state.status) ?? STATUS_OPTIONS[0];

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Уведомление в Роскомнадзор"
        subtitle="Контрольный список для подачи уведомления об обработке персональных данных (152-ФЗ)"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Администрирование', href: '/admin/dashboard' },
          { label: 'Роскомнадзор' },
        ]}
      />

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info size={20} className="mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">Справочная информация</h3>
            <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
              В соответствии со статьёй 22 Федерального закона от 27.07.2006 N 152-ФЗ &laquo;О персональных данных&raquo;,
              оператор обязан до начала обработки персональных данных уведомить уполномоченный орган по защите прав
              субъектов персональных данных (Роскомнадзор) о своём намерении осуществлять обработку персональных данных.
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-2">
              Исключения из обязанности уведомления перечислены в п. 2 ст. 22 152-ФЗ (обработка в соответствии
              с трудовым законодательством, обработка данных участников религиозных организаций, и др.).
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Checklist + Required Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Checklist */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} className="text-neutral-500 dark:text-neutral-400" />
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Контрольный список</h2>
              </div>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {checkedCount}/{CHECKLIST_ITEMS.length} ({progressPct}%)
              </span>
            </div>

            {/* Progress bar */}
            <div className="px-5 pt-3">
              <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <div className="p-5 space-y-2">
              {CHECKLIST_ITEMS.map((item) => {
                const isChecked = !!state.checked[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleCheck(item.id)}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors',
                      isChecked
                        ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                        : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800',
                    )}
                  >
                    {isChecked ? (
                      <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                    ) : (
                      <Circle size={18} className="mt-0.5 flex-shrink-0 text-neutral-400 dark:text-neutral-500" />
                    )}
                    <span
                      className={cn(
                        'text-sm',
                        isChecked
                          ? 'text-green-800 dark:text-green-300 line-through'
                          : 'text-neutral-700 dark:text-neutral-300',
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Required Notification Fields */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                Обязательные поля уведомления
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                Следующие данные требуются при подаче уведомления в Роскомнадзор
              </p>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {REQUIRED_FIELDS.map((field, i) => (
                <div key={field.key} className="flex items-center gap-4 px-5 py-3">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {i + 1}
                  </span>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{field.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Status Tracker */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-3">Статус подачи</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Отслеживайте статус подачи уведомления.
            </p>

            <div className="space-y-2 mb-4">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-colors',
                    state.status === opt.value
                      ? cn('border-2', opt.bg, opt.color, 'font-medium')
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800',
                  )}
                >
                  {state.status === opt.value ? (
                    <CheckCircle2 size={16} className={opt.color} />
                  ) : (
                    <Circle size={16} />
                  )}
                  {opt.label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                <Calendar size={12} className="inline mr-1" />
                Дата изменения статуса
              </label>
              <input
                type="date"
                value={state.statusDate}
                onChange={(e) => setStatusDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Current status display */}
            <div className={cn('mt-4 px-3 py-2 rounded-lg text-center text-sm font-medium', currentStatusOption.bg, currentStatusOption.color)}>
              {currentStatusOption.label}
              {state.statusDate && (
                <span className="block text-xs font-normal mt-0.5 opacity-75">
                  от {state.statusDate}
                </span>
              )}
            </div>
          </div>

          {/* Portal Link */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-3">Портал Роскомнадзора</h3>
            <a
              href="https://pd.rkn.gov.ru"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <ExternalLink size={16} />
              Перейти на pd.rkn.gov.ru
            </a>
          </div>

          {/* Template Download */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-2">Шаблон уведомления</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
              Скачайте шаблон уведомления об обработке персональных данных для заполнения.
            </p>
            <button
              type="button"
              onClick={() => {
                // In production, this would link to a real template file.
                // For now, open the RKN portal where the official form is available.
                window.open('https://pd.rkn.gov.ru/operators-registry/notification/form/', '_blank');
              }}
              className="flex items-center gap-2 px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors"
            >
              <FileDown size={16} />
              Скачать шаблон (DOCX)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoskomnadzorPage;
