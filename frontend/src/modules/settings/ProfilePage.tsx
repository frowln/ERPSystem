import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  User, Bell, Mail, Send, Lock, Camera,
  Check, Smartphone, Download, Trash2,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Checkbox } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { useAuthStore } from '@/stores/authStore';
import { settingsApi } from '@/api/settings';
import { apiClient } from '@/api/client';

// ---- Types ----
type ProfileTab = 'profile' | 'notifications' | 'security';

interface NotificationPreference {
  eventType: string;
  eventLabel: string;
  eventDescription: string;
  email: boolean;
  push: boolean;
  telegram: boolean;
  inApp: boolean;
}

const EVENT_TYPES: { type: string; labelKey: string; descKey: string }[] = [
  { type: 'TASK_ASSIGNED', labelKey: 'profile.notif.taskAssigned', descKey: 'profile.notif.taskAssignedDesc' },
  { type: 'TASK_COMPLETED', labelKey: 'profile.notif.taskCompleted', descKey: 'profile.notif.taskCompletedDesc' },
  { type: 'DOCUMENT_SHARED', labelKey: 'profile.notif.documentShared', descKey: 'profile.notif.documentSharedDesc' },
  { type: 'CONTRACT_APPROVED', labelKey: 'profile.notif.contractApproved', descKey: 'profile.notif.contractApprovedDesc' },
  { type: 'CONTRACT_REJECTED', labelKey: 'profile.notif.contractRejected', descKey: 'profile.notif.contractRejectedDesc' },
  { type: 'INCIDENT_REPORTED', labelKey: 'profile.notif.incidentReported', descKey: 'profile.notif.incidentReportedDesc' },
  { type: 'DAILY_DIGEST', labelKey: 'profile.notif.dailyDigest', descKey: 'profile.notif.dailyDigestDesc' },
  { type: 'INSPECTION_SCHEDULED', labelKey: 'profile.notif.inspectionScheduled', descKey: 'profile.notif.inspectionScheduledDesc' },
  { type: 'PAYMENT_RECEIVED', labelKey: 'profile.notif.paymentReceived', descKey: 'profile.notif.paymentReceivedDesc' },
  { type: 'BUDGET_EXCEEDED', labelKey: 'profile.notif.budgetExceeded', descKey: 'profile.notif.budgetExceededDesc' },
  { type: 'DEADLINE_APPROACHING', labelKey: 'profile.notif.deadlineApproaching', descKey: 'profile.notif.deadlineApproachingDesc' },
];

const CHANNELS = ['email', 'push', 'telegram', 'inApp'] as const;
type Channel = typeof CHANNELS[number];

const CHANNEL_ICONS: Record<Channel, React.ElementType> = {
  email: Mail,
  push: Smartphone,
  telegram: Send,
  inApp: Bell,
};

const CHANNEL_LABELS: Record<Channel, string> = {
  email: t('profile.notif.channelEmail'),
  push: t('profile.notif.channelPush'),
  telegram: t('profile.notif.channelTelegram'),
  inApp: t('profile.notif.inApp'),
};

const tabs: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: t('profile.tabProfile'), icon: User },
  { id: 'notifications', label: t('profile.tabNotifications'), icon: Bell },
  { id: 'security', label: t('profile.tabSecurity'), icon: Lock },
];

// ---- API ----
const profileApi = {
  getNotificationPrefs: async (): Promise<NotificationPreference[]> => {
    try {
      const data = await settingsApi.getNotificationDefaults();
      if (Array.isArray(data) && data.length > 0 && (data[0] as Record<string, unknown>).notificationType) {
        // Backend format: flatten into matrix
        const map = new Map<string, NotificationPreference>();
        for (const item of data as Record<string, unknown>[]) {
          const key = (item.eventType ?? item.eventTypeDisplayName) as string;
          if (!map.has(key)) {
            map.set(key, {
              eventType: key,
              eventLabel: (item.eventTypeDisplayName as string) ?? key,
              eventDescription: '',
              email: false, push: false, telegram: false, inApp: false,
            });
          }
          const pref = map.get(key)!;
          const ch = ((item.notificationType as string) ?? '').toLowerCase();
          if (ch === 'email') pref.email = (item.isEnabled as boolean) ?? true;
          else if (ch === 'push') pref.push = (item.isEnabled as boolean) ?? true;
          else if (ch === 'telegram') pref.telegram = (item.isEnabled as boolean) ?? true;
          else if (ch === 'in_app') pref.inApp = (item.isEnabled as boolean) ?? true;
        }
        return Array.from(map.values());
      }
      return data as unknown as NotificationPreference[];
    } catch {
      // Fallback: generate defaults from EVENT_TYPES
      return EVENT_TYPES.map(e => ({
        eventType: e.type,
        eventLabel: t(e.labelKey),
        eventDescription: t(e.descKey),
        email: true, push: true, telegram: false, inApp: true,
      }));
    }
  },
  saveNotificationPrefs: async (prefs: NotificationPreference[]): Promise<void> => {
    // Convert matrix to backend format: per (notificationType, eventType) pairs
    const settings: { notificationType: string; eventType: string; isEnabled: boolean }[] = [];
    for (const pref of prefs) {
      settings.push({ notificationType: 'EMAIL', eventType: pref.eventType, isEnabled: pref.email });
      settings.push({ notificationType: 'PUSH', eventType: pref.eventType, isEnabled: pref.push });
      settings.push({ notificationType: 'TELEGRAM', eventType: pref.eventType, isEnabled: pref.telegram });
      settings.push({ notificationType: 'IN_APP', eventType: pref.eventType, isEnabled: pref.inApp });
    }
    await settingsApi.saveNotificationBulk(settings);
  },
  updateProfile: async (data: { firstName: string; lastName: string; phone?: string }): Promise<void> => {
    await settingsApi.updateProfile(data);
  },
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await settingsApi.changePassword(data);
  },
};

// ---- COMPONENT ----
const ProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const { data } = await apiClient.get('/me/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `privod-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t('profile.exportData'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await apiClient.delete('/me');
      logout();
      navigate('/login');
    } catch {
      toast.error(t('common.error'));
      setIsDeleting(false);
    }
  };

  // ---- Profile form ----
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        phone: user.phone ?? '',
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: () => profileApi.updateProfile(profileForm),
    onSuccess: () => {
      if (user) {
        setUser({ ...user, ...profileForm });
      }
      toast.success(t('profile.saved'));
    },
    onError: () => toast.error(t('common.error')),
  });

  // ---- Password ----
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const changePasswordMutation = useMutation({
    mutationFn: () => profileApi.changePassword({
      currentPassword: pwForm.currentPassword,
      newPassword: pwForm.newPassword,
    }),
    onSuccess: () => {
      toast.success(t('profile.passwordChanged'));
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: () => toast.error(t('profile.passwordError')),
  });

  // ---- Notification preferences ----
  const { data: notifPrefs = [] } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: profileApi.getNotificationPrefs,
  });

  const [prefs, setPrefs] = useState<NotificationPreference[]>([]);

  useEffect(() => {
    if (notifPrefs.length > 0) setPrefs(notifPrefs);
  }, [notifPrefs]);

  const togglePref = (eventType: string, channel: Channel) => {
    setPrefs(prev => prev.map(p =>
      p.eventType === eventType ? { ...p, [channel]: !p[channel] } : p,
    ));
  };

  const toggleAllChannel = (channel: Channel) => {
    const allEnabled = prefs.every(p => p[channel]);
    setPrefs(prev => prev.map(p => ({ ...p, [channel]: !allEnabled })));
  };

  const saveNotifMutation = useMutation({
    mutationFn: () => profileApi.saveNotificationPrefs(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success(t('profile.saved'));
    },
    onError: () => toast.error(t('common.error')),
  });

  // Enrich labels from i18n
  const enrichedPrefs = prefs.map(p => {
    const evt = EVENT_TYPES.find(e => e.type === p.eventType);
    return {
      ...p,
      eventLabel: evt ? t(evt.labelKey) : p.eventLabel || p.eventType,
      eventDescription: evt ? t(evt.descKey) : p.eventDescription || '',
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('profile.title')}
        subtitle={user ? `${user.firstName} ${user.lastName} — ${user.email}` : ''}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/' },
          { label: t('profile.title') },
        ]}
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800',
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========= PROFILE TAB ========= */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
            {t('profile.personalInfo')}
          </h2>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-300 text-xl font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 flex items-center justify-center text-neutral-500 hover:text-primary-600 transition-colors"
                title={t('profile.changeAvatar')}
              >
                <Camera size={13} />
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{user?.email}</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                {t('profile.role')}: {user?.role}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <FormField label={t('profile.firstName')}>
              <Input
                value={profileForm.firstName}
                onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))}
              />
            </FormField>
            <FormField label={t('profile.lastName')}>
              <Input
                value={profileForm.lastName}
                onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))}
              />
            </FormField>
            <FormField label={t('profile.phone')}>
              <Input
                value={profileForm.phone}
                onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
              />
            </FormField>
            <FormField label={t('profile.email')}>
              <Input value={user?.email ?? ''} disabled />
            </FormField>
          </div>

          <div className="mt-6">
            <Button
              onClick={() => updateProfileMutation.mutate()}
              loading={updateProfileMutation.isPending}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      )}

      {/* ========= NOTIFICATIONS TAB ========= */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {t('profile.notif.title')}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              {t('profile.notif.subtitle')}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[40%]">
                    {t('profile.notif.event')}
                  </th>
                  {CHANNELS.map(ch => {
                    const Icon = CHANNEL_ICONS[ch];
                    const allOn = enrichedPrefs.length > 0 && enrichedPrefs.every(p => p[ch]);
                    return (
                      <th key={ch} className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        <button
                          type="button"
                          onClick={() => toggleAllChannel(ch)}
                          className="flex items-center justify-center gap-1 mx-auto hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          title={allOn ? t('profile.notif.disableAll') : t('profile.notif.enableAll')}
                        >
                          <Icon size={13} />
                          {CHANNEL_LABELS[ch]}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {enrichedPrefs.map((pref, idx) => (
                  <tr
                    key={pref.eventType}
                    className={cn(
                      'border-b border-neutral-100 dark:border-neutral-800',
                      idx % 2 === 1 && 'bg-neutral-50/50 dark:bg-neutral-800/30',
                    )}
                  >
                    <td className="px-6 py-3">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {pref.eventLabel}
                      </p>
                      {pref.eventDescription && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {pref.eventDescription}
                        </p>
                      )}
                    </td>
                    {CHANNELS.map(ch => (
                      <td key={ch} className="px-4 py-3 text-center">
                        <Checkbox
                          checked={pref[ch]}
                          onChange={() => togglePref(pref.eventType, ch)}
                          className="mx-auto"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 flex items-center justify-between">
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              {t('profile.notif.hint')}
            </p>
            <Button
              loading={saveNotifMutation.isPending}
              onClick={() => saveNotifMutation.mutate()}
              iconLeft={<Check size={15} />}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      )}

      {/* ========= SECURITY TAB ========= */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
            {t('profile.changePassword')}
          </h2>

          <div className="space-y-4 max-w-md">
            <FormField label={t('profile.currentPassword')}>
              <Input
                type="password"
                value={pwForm.currentPassword}
                onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
              />
            </FormField>
            <FormField label={t('profile.newPassword')}>
              <Input
                type="password"
                value={pwForm.newPassword}
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
              />
            </FormField>
            <FormField label={t('profile.confirmPassword')}>
              <Input
                type="password"
                value={pwForm.confirmPassword}
                onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
              />
            </FormField>

            {pwForm.newPassword && pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
              <p className="text-xs text-danger-600">{t('profile.passwordMismatch')}</p>
            )}

            <Button
              onClick={() => changePasswordMutation.mutate()}
              loading={changePasswordMutation.isPending}
              disabled={
                !pwForm.currentPassword ||
                !pwForm.newPassword ||
                pwForm.newPassword.length < 8 ||
                pwForm.newPassword !== pwForm.confirmPassword
              }
            >
              {t('profile.changePasswordBtn')}
            </Button>
          </div>

          {/* Active sessions info */}
          <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              {t('profile.sessionInfo')}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('profile.sessionHint')}
            </p>
          </div>

          {/* Danger Zone */}
          <div className="mt-8 pt-6 border-t border-danger-200 dark:border-danger-900/50">
            <h3 className="text-sm font-semibold text-danger-700 dark:text-danger-400 mb-4">
              {t('profile.dangerZone')}
            </h3>

            {/* Export Data */}
            <div className="flex items-center justify-between mb-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{t('profile.exportData')}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('profile.exportDataDesc')}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportData} loading={isExporting}>
                <Download size={14} className="mr-1.5" />
                {t('profile.exportBtn')}
              </Button>
            </div>

            {/* Delete Account */}
            <div className="flex items-center justify-between p-4 bg-danger-50 dark:bg-danger-900/20 rounded-lg border border-danger-200 dark:border-danger-800">
              <div>
                <p className="text-sm font-medium text-danger-700 dark:text-danger-400">{t('profile.deleteAccount')}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('profile.deleteAccountDesc')}</p>
              </div>
              <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 size={14} className="mr-1.5" />
                {t('profile.deleteBtn')}
              </Button>
            </div>

            {/* Delete Confirm Dialog */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 max-w-md mx-4 border border-neutral-200 dark:border-neutral-700">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{t('profile.deleteConfirmTitle')}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">{t('profile.deleteConfirmDesc')}</p>
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>{t('common.cancel')}</Button>
                    <Button variant="danger" onClick={handleDeleteAccount} loading={isDeleting}>{t('profile.deleteConfirmBtn')}</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
