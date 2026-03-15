import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  X,
  ChevronRight,
  ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  href: string;
  roles: string[]; // which roles see this step; '*' = all
}

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

const onboardingSteps: OnboardingStep[] = [
  // ALL roles
  {
    id: 'profile',
    title: 'Заполните профиль',
    description: 'Добавьте фото и контакты',
    href: '/settings/profile',
    roles: ['*'],
  },
  {
    id: 'notifications',
    title: 'Настройте уведомления',
    description: 'Выберите каналы оповещений',
    href: '/settings/notifications',
    roles: ['*'],
  },

  // ADMIN
  {
    id: 'org-setup',
    title: 'Настройте организацию',
    description: 'Название, ИНН, реквизиты',
    href: '/admin/system-settings',
    roles: ['ADMIN'],
  },
  {
    id: 'users-setup',
    title: 'Добавьте пользователей',
    description: 'Пригласите команду',
    href: '/admin/users',
    roles: ['ADMIN'],
  },
  {
    id: 'departments',
    title: 'Создайте подразделения',
    description: 'Структура организации',
    href: '/admin/departments',
    roles: ['ADMIN'],
  },

  // MANAGER / PROJECT_MANAGER
  {
    id: 'create-project',
    title: 'Создайте первый объект',
    description: 'Или используйте шаблон',
    href: '/projects/new',
    roles: ['ADMIN', 'MANAGER', 'PROJECT_MANAGER'],
  },
  {
    id: 'add-counterparties',
    title: 'Добавьте контрагентов',
    description: 'Подрядчики и поставщики',
    href: '/counterparties',
    roles: ['ADMIN', 'MANAGER', 'PROJECT_MANAGER'],
  },

  // ENGINEER / FOREMAN
  {
    id: 'view-tasks',
    title: 'Просмотрите задачи',
    description: 'Доска задач вашего объекта',
    href: '/tasks',
    roles: ['ENGINEER', 'FOREMAN'],
  },
  {
    id: 'daily-log',
    title: 'Заполните журнал работ',
    description: 'Ежедневный отчёт',
    href: '/operations/daily-logs',
    roles: ['ENGINEER', 'FOREMAN'],
  },

  // ACCOUNTANT / FINANCE_MANAGER
  {
    id: 'view-budgets',
    title: 'Просмотрите бюджеты',
    description: 'Финансы проектов',
    href: '/budgets',
    roles: ['ACCOUNTANT', 'FINANCE_MANAGER'],
  },
  {
    id: 'setup-invoices',
    title: 'Настройте шаблоны счетов',
    description: 'Реквизиты для счетов',
    href: '/invoices',
    roles: ['ACCOUNTANT', 'FINANCE_MANAGER'],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStorageKey(userId: string): string {
  return `privod-onboarding-${userId}`;
}

function loadCompleted(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (raw) {
      const arr = JSON.parse(raw) as string[];
      return new Set(arr);
    }
  } catch {
    // ignore corrupted data
  }
  return new Set();
}

function saveCompleted(userId: string, completed: Set<string>): void {
  localStorage.setItem(getStorageKey(userId), JSON.stringify([...completed]));
}

function isDismissed(userId: string): boolean {
  try {
    return localStorage.getItem(`privod-onboarding-dismissed-${userId}`) === '1';
  } catch {
    return false;
  }
}

function setDismissed(userId: string): void {
  localStorage.setItem(`privod-onboarding-dismissed-${userId}`, '1');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const OnboardingChecklist: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const userId = user?.id ?? '';
  const userRole = user?.role ?? '';

  // Filter steps relevant to this role
  const visibleSteps = useMemo(
    () =>
      onboardingSteps.filter(
        (step) => step.roles.includes('*') || step.roles.includes(userRole),
      ),
    [userRole],
  );

  const [completed, setCompleted] = useState<Set<string>>(() =>
    loadCompleted(userId),
  );
  const [dismissed, setDismissedState] = useState(() => isDismissed(userId));
  const [open, setOpen] = useState(true);

  // Persist completed steps
  useEffect(() => {
    if (userId) saveCompleted(userId, completed);
  }, [userId, completed]);

  const toggleStep = useCallback(
    (stepId: string) => {
      setCompleted((prev) => {
        const next = new Set(prev);
        if (next.has(stepId)) {
          next.delete(stepId);
        } else {
          next.add(stepId);
        }
        return next;
      });
    },
    [],
  );

  const handleDismiss = useCallback(() => {
    if (userId) setDismissed(userId);
    setDismissedState(true);
  }, [userId]);

  const handleStepClick = useCallback(
    (step: OnboardingStep) => {
      // Mark as completed and navigate
      setCompleted((prev) => {
        const next = new Set(prev);
        next.add(step.id);
        return next;
      });
      navigate(step.href);
    },
    [navigate],
  );

  // Don't render if no user, or already dismissed, or all steps are complete
  if (!userId || dismissed) return null;

  const completedCount = visibleSteps.filter((s) => completed.has(s.id)).length;
  const totalCount = visibleSteps.length;
  const allComplete = completedCount === totalCount;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Auto-dismiss when all complete
  if (allComplete) return null;

  // Collapsed state — just show a floating button
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-20 right-4 z-40 flex items-center gap-2',
          'px-4 py-2.5 rounded-full shadow-lg',
          'bg-primary-600 text-white hover:bg-primary-700',
          'transition-all duration-200',
          'print:hidden',
        )}
        aria-label="Открыть чеклист"
      >
        <ListChecks size={18} />
        <span className="text-sm font-medium">
          {completedCount}/{totalCount}
        </span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        'fixed bottom-20 right-4 z-40 w-80',
        'bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700',
        'overflow-hidden print:hidden',
        'animate-fade-in',
      )}
      role="complementary"
      aria-label="Чеклист начала работы"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-primary-50 dark:bg-primary-900/20 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Начало работы
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setOpen(false)}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded transition-colors"
              aria-label="Свернуть"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded transition-colors"
              aria-label="Пропустить"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="max-h-72 overflow-y-auto">
        {visibleSteps.map((step) => {
          const done = completed.has(step.id);
          return (
            <div
              key={step.id}
              className={cn(
                'flex items-start gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0',
                'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors',
                done && 'opacity-60',
              )}
              onClick={() => handleStepClick(step)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStepClick(step);
                }
              }}
            >
              {/* Checkbox */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStep(step.id);
                }}
                className="mt-0.5 flex-shrink-0"
                aria-label={done ? 'Снять отметку' : 'Отметить выполненным'}
              >
                {done ? (
                  <CheckCircle2
                    size={20}
                    className="text-emerald-500"
                  />
                ) : (
                  <Circle
                    size={20}
                    className="text-neutral-300 dark:text-neutral-600"
                  />
                )}
              </button>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium text-neutral-900 dark:text-neutral-100',
                    done && 'line-through',
                  )}
                >
                  {step.title}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {step.description}
                </p>
              </div>
              <ChevronRight
                size={16}
                className="mt-0.5 flex-shrink-0 text-neutral-300 dark:text-neutral-600"
              />
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-700">
        <button
          onClick={handleDismiss}
          className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
        >
          Пропустить
        </button>
      </div>
    </div>
  );
};

export default OnboardingChecklist;
