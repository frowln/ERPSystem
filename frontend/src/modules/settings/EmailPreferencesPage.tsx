import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Mail, Bell, Shield, DollarSign, HardHat, Loader2, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { notificationsApi, type NotificationPreference } from '@/api/notifications';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PreferenceCategory {
  key: string;
  labelKey: string;
  descriptionKey: string;
  icon: React.ElementType;
  iconColor: string;
}

interface PreferenceSection {
  titleKey: string;
  categories: PreferenceCategory[];
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SECTIONS: PreferenceSection[] = [
  {
    titleKey: 'emailPreferences.sections.tasks',
    categories: [
      {
        key: 'TASK_ASSIGNED',
        labelKey: 'emailPreferences.taskAssigned',
        descriptionKey: 'emailPreferences.taskAssignedDesc',
        icon: CheckCircle,
        iconColor: 'text-primary-500',
      },
      {
        key: 'TASK_COMPLETED',
        labelKey: 'emailPreferences.taskCompleted',
        descriptionKey: 'emailPreferences.taskCompletedDesc',
        icon: CheckCircle,
        iconColor: 'text-success-500',
      },
      {
        key: 'DEADLINE_APPROACHING',
        labelKey: 'emailPreferences.deadlineApproaching',
        descriptionKey: 'emailPreferences.deadlineApproachingDesc',
        icon: Bell,
        iconColor: 'text-warning-500',
      },
    ],
  },
  {
    titleKey: 'emailPreferences.sections.approvals',
    categories: [
      {
        key: 'APPROVAL_REQUIRED',
        labelKey: 'emailPreferences.approvalRequired',
        descriptionKey: 'emailPreferences.approvalRequiredDesc',
        icon: Shield,
        iconColor: 'text-primary-500',
      },
      {
        key: 'APPROVAL_COMPLETED',
        labelKey: 'emailPreferences.approvalCompleted',
        descriptionKey: 'emailPreferences.approvalCompletedDesc',
        icon: CheckCircle,
        iconColor: 'text-success-500',
      },
    ],
  },
  {
    titleKey: 'emailPreferences.sections.finance',
    categories: [
      {
        key: 'BUDGET_ALERT',
        labelKey: 'emailPreferences.budgetAlert',
        descriptionKey: 'emailPreferences.budgetAlertDesc',
        icon: DollarSign,
        iconColor: 'text-warning-500',
      },
      {
        key: 'INVOICE_STATUS',
        labelKey: 'emailPreferences.invoiceStatus',
        descriptionKey: 'emailPreferences.invoiceStatusDesc',
        icon: DollarSign,
        iconColor: 'text-success-500',
      },
    ],
  },
  {
    titleKey: 'emailPreferences.sections.safety',
    categories: [
      {
        key: 'SAFETY_ALERT',
        labelKey: 'emailPreferences.safetyAlert',
        descriptionKey: 'emailPreferences.safetyAlertDesc',
        icon: HardHat,
        iconColor: 'text-danger-500',
      },
      {
        key: 'SAFETY_INCIDENT',
        labelKey: 'emailPreferences.safetyIncident',
        descriptionKey: 'emailPreferences.safetyIncidentDesc',
        icon: HardHat,
        iconColor: 'text-danger-500',
      },
    ],
  },
  {
    titleKey: 'emailPreferences.sections.system',
    categories: [
      {
        key: 'WELCOME',
        labelKey: 'emailPreferences.welcome',
        descriptionKey: 'emailPreferences.welcomeDesc',
        icon: Mail,
        iconColor: 'text-primary-500',
      },
      {
        key: 'PASSWORD_RESET',
        labelKey: 'emailPreferences.passwordReset',
        descriptionKey: 'emailPreferences.passwordResetDesc',
        icon: Shield,
        iconColor: 'text-neutral-500',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Toggle component
// ---------------------------------------------------------------------------

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
}> = ({ checked, onChange, disabled, ...rest }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={rest['aria-label']}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn(
      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
      checked ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-600',
      disabled && 'opacity-50 cursor-not-allowed',
    )}
  >
    <span
      className={cn(
        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
        checked ? 'translate-x-5' : 'translate-x-0',
      )}
    />
  </button>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EmailPreferencesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: preferences = [], isLoading } = useQuery<NotificationPreference[]>({
    queryKey: ['notification-preferences'],
    queryFn: () => notificationsApi.getNotificationPreferences(),
  });

  const lookup = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const p of preferences) {
      if (p.channel === 'EMAIL') {
        map.set(p.category, p.enabled);
      }
    }
    return map;
  }, [preferences]);

  const mutation = useMutation({
    mutationFn: ({ category, enabled }: { category: string; enabled: boolean }) =>
      notificationsApi.updateNotificationPreference('EMAIL', category, enabled),
    onMutate: async ({ category, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ['notification-preferences'] });
      const previous = queryClient.getQueryData<NotificationPreference[]>(['notification-preferences']);
      queryClient.setQueryData<NotificationPreference[]>(['notification-preferences'], (old = []) => {
        const idx = old.findIndex((p) => p.channel === 'EMAIL' && p.category === category);
        if (idx >= 0) {
          const updated = [...old];
          updated[idx] = { ...updated[idx], enabled };
          return updated;
        }
        return [...old, { id: `EMAIL-${category}`, channel: 'EMAIL' as const, category, enabled }];
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notification-preferences'], context.previous);
      }
      toast.error(t('emailPreferences.toastError'));
    },
    onSuccess: () => {
      toast.success(t('emailPreferences.toastSaved'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });

  const isEnabled = useCallback(
    (category: string): boolean => lookup.get(category) ?? true,
    [lookup],
  );

  const handleToggle = useCallback(
    (category: string) => {
      const current = isEnabled(category);
      mutation.mutate({ category, enabled: !current });
    },
    [isEnabled, mutation],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('emailPreferences.title')}
        subtitle={t('emailPreferences.subtitle')}
        breadcrumbs={[
          { label: t('settings.breadcrumbHome'), href: '/' },
          { label: t('settings.breadcrumbSettings'), href: '/settings' },
          { label: t('emailPreferences.title') },
        ]}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">{t('emailPreferences.loading')}</span>
        </div>
      ) : (
        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <div
              key={section.titleKey}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  {t(section.titleKey)}
                </h3>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {section.categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <div
                      key={cat.key}
                      className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center bg-neutral-100 dark:bg-neutral-800', cat.iconColor)}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {t(cat.labelKey)}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {t(cat.descriptionKey)}
                          </p>
                        </div>
                      </div>
                      <Toggle
                        checked={isEnabled(cat.key)}
                        onChange={() => handleToggle(cat.key)}
                        disabled={mutation.isPending}
                        aria-label={t(cat.labelKey)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-start gap-3">
              <Mail size={20} className="text-neutral-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('emailPreferences.footerNote')}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {t('emailPreferences.footerNoteDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailPreferencesPage;
