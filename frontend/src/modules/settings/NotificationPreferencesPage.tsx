import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Bell, Mail, Smartphone, Monitor, Loader2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { notificationsApi, type NotificationPreference } from '@/api/notifications';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Channel = 'EMAIL' | 'PUSH' | 'IN_APP';

interface CategoryDef {
  key: string;
  labelKey: string;
}

interface SectionDef {
  sectionKey: string;
  categories: CategoryDef[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHANNELS: { id: Channel; labelKey: string; icon: React.ElementType }[] = [
  { id: 'EMAIL', labelKey: 'notificationPrefs.channels.email', icon: Mail },
  { id: 'PUSH', labelKey: 'notificationPrefs.channels.push', icon: Smartphone },
  { id: 'IN_APP', labelKey: 'notificationPrefs.channels.inApp', icon: Monitor },
];

const SECTIONS: SectionDef[] = [
  {
    sectionKey: 'tasks',
    categories: [
      { key: 'TASK_ASSIGNED', labelKey: 'notificationPrefs.categories.taskAssigned' },
      { key: 'TASK_COMPLETED', labelKey: 'notificationPrefs.categories.taskCompleted' },
      { key: 'DEADLINE_APPROACHING', labelKey: 'notificationPrefs.categories.deadlineApproaching' },
    ],
  },
  {
    sectionKey: 'communication',
    categories: [
      { key: 'COMMENT_ADDED', labelKey: 'notificationPrefs.categories.commentAdded' },
      { key: 'MENTION', labelKey: 'notificationPrefs.categories.mention' },
    ],
  },
  {
    sectionKey: 'finance',
    categories: [
      { key: 'BUDGET_ALERT', labelKey: 'notificationPrefs.categories.budgetAlert' },
    ],
  },
  {
    sectionKey: 'safety',
    categories: [
      { key: 'SAFETY_ALERT', labelKey: 'notificationPrefs.categories.safetyAlert' },
    ],
  },
  {
    sectionKey: 'documents',
    categories: [
      { key: 'DOCUMENT_UPLOADED', labelKey: 'notificationPrefs.categories.documentUploaded' },
    ],
  },
  {
    sectionKey: 'system',
    categories: [
      { key: 'SYSTEM', labelKey: 'notificationPrefs.categories.system' },
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
      'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
      checked ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-600',
      disabled && 'opacity-50 cursor-not-allowed',
    )}
  >
    <span
      className={cn(
        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
        checked ? 'translate-x-4' : 'translate-x-0',
      )}
    />
  </button>
);

// ---------------------------------------------------------------------------
// Helper: build a lookup map from preferences array
// ---------------------------------------------------------------------------

function buildLookup(prefs: NotificationPreference[]): Map<string, boolean> {
  const map = new Map<string, boolean>();
  for (const p of prefs) {
    map.set(`${p.channel}:${p.category}`, p.enabled);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const NotificationPreferencesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: preferences = [], isLoading } = useQuery<NotificationPreference[]>({
    queryKey: ['notification-preferences'],
    queryFn: () => notificationsApi.getNotificationPreferences(),
  });

  const lookup = useMemo(() => buildLookup(preferences), [preferences]);

  const mutation = useMutation({
    mutationFn: ({ channel, category, enabled }: { channel: string; category: string; enabled: boolean }) =>
      notificationsApi.updateNotificationPreference(channel, category, enabled),
    onMutate: async ({ channel, category, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ['notification-preferences'] });
      const previous = queryClient.getQueryData<NotificationPreference[]>(['notification-preferences']);
      queryClient.setQueryData<NotificationPreference[]>(['notification-preferences'], (old = []) => {
        const idx = old.findIndex((p) => p.channel === channel && p.category === category);
        if (idx >= 0) {
          const updated = [...old];
          updated[idx] = { ...updated[idx], enabled };
          return updated;
        }
        return [...old, { id: `${channel}-${category}`, channel: channel as Channel, category, enabled }];
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notification-preferences'], context.previous);
      }
      toast.error(t('notificationPrefs.error'));
    },
    onSuccess: () => {
      toast.success(t('notificationPrefs.saved'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });

  const isEnabled = (channel: Channel, category: string): boolean => {
    return lookup.get(`${channel}:${category}`) ?? true;
  };

  const handleToggle = (channel: Channel, category: string) => {
    const current = isEnabled(channel, category);
    mutation.mutate({ channel, category, enabled: !current });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('notificationPrefs.title')}
        subtitle={t('notificationPrefs.subtitle')}
        breadcrumbs={[
          { label: t('settings.breadcrumbHome'), href: '/' },
          { label: t('settings.breadcrumbSettings'), href: '/settings' },
          { label: t('notificationPrefs.title') },
        ]}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">{t('notificationPrefs.loading')}</span>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {/* Table header */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[50%]">
                    {t('settings.page.colNotificationType')}
                  </th>
                  {CHANNELS.map(({ id, labelKey, icon: Icon }) => (
                    <th key={id} className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-1.5">
                        <Icon size={14} />
                        {t(labelKey)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTIONS.map((section) => (
                  <React.Fragment key={section.sectionKey}>
                    {/* Section header row */}
                    <tr className="bg-neutral-50 dark:bg-neutral-800/50">
                      <td
                        colSpan={CHANNELS.length + 1}
                        className="px-6 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider"
                      >
                        {t(`notificationPrefs.sections.${section.sectionKey}`)}
                      </td>
                    </tr>
                    {/* Category rows */}
                    {section.categories.map((cat, idx) => (
                      <tr
                        key={cat.key}
                        className={cn(
                          'border-b border-neutral-100 dark:border-neutral-800 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/30',
                          idx % 2 === 1 && 'bg-neutral-25 dark:bg-neutral-900/50',
                        )}
                      >
                        <td className="px-6 py-3">
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {t(cat.labelKey)}
                          </span>
                        </td>
                        {CHANNELS.map(({ id: channel }) => (
                          <td key={channel} className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center">
                              <Toggle
                                checked={isEnabled(channel, cat.key)}
                                onChange={() => handleToggle(channel, cat.key)}
                                disabled={mutation.isPending}
                                aria-label={`${t(cat.labelKey)} - ${t(`notificationPrefs.channels.${channel === 'EMAIL' ? 'email' : channel === 'PUSH' ? 'push' : 'inApp'}`)}`}
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPreferencesPage;
