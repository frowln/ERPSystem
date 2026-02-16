import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Building2, Mail, Shield, Plug, Bell, Database,
  Upload, Send, RefreshCw, Download, CheckCircle2, XCircle, Clock, Settings2,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select, Checkbox, Textarea } from '@/design-system/components/FormField';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { t } from '@/i18n';
import {
  settingsApi,
  type CompanySettings,
  type EmailSettings,
  type SecuritySettings,
  type NotificationSetting,
  type BackupSettings,
  type BackupEntry,
  type Integration,
} from '@/api/settings';

// ---- Types / tab definitions ----
type SettingsTab = 'general' | 'email' | 'security' | 'integrations' | 'notifications' | 'backup';

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: t('settings.page.tabGeneral'), icon: Building2 },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'security', label: t('settings.page.tabSecurity'), icon: Shield },
  { id: 'integrations', label: t('settings.page.tabIntegrations'), icon: Plug },
  { id: 'notifications', label: t('settings.page.tabNotifications'), icon: Bell },
  { id: 'backup', label: t('settings.page.tabBackup'), icon: Database },
];
const integrationStatusMap: Record<string, 'green' | 'gray' | 'red'> = {
  active: 'green',
  inactive: 'gray',
  error: 'red',
};
const integrationStatusLabels: Record<string, string> = {
  active: t('settings.page.integrationActive'),
  inactive: t('settings.page.integrationInactive'),
  error: t('settings.page.integrationError'),
};
const backupStatusMap: Record<string, 'green' | 'yellow' | 'red'> = {
  completed: 'green',
  in_progress: 'yellow',
  failed: 'red',
};
const backupStatusLabels: Record<string, string> = {
  completed: t('settings.page.backupCompleted'),
  in_progress: t('settings.page.backupInProgress'),
  failed: t('settings.page.backupFailed'),
};

// ---- Toggle component ----
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label?: string }> = ({ checked, onChange, label }) => (
  <label className="relative inline-flex items-center cursor-pointer gap-2.5">
    <div className="relative">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={() => onChange(!checked)} />
      <div className="w-9 h-5 bg-neutral-200 peer-focus:ring-2 peer-focus:ring-primary-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600" />
    </div>
    {label && <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>}
  </label>
);

// ---- Default state factories ----
const defaultCompanySettings: CompanySettings = {
  companyName: '',
  inn: '',
  kpp: '',
  ogrn: '',
  address: '',
  phone: '',
  email: '',
  defaultCurrency: 'RUB',
  language: 'ru',
  timezone: 'Europe/Moscow',
};

const defaultEmailSettings: EmailSettings = {
  smtpHost: '',
  smtpPort: 465,
  smtpUsername: '',
  smtpPassword: '',
  fromEmail: '',
  fromName: '',
  useTls: true,
};

const defaultSecuritySettings: SecuritySettings = {
  sessionTimeoutMinutes: 60,
  maxLoginAttempts: 5,
  passwordMinLength: 8,
  twoFactorEnabled: false,
  passwordExpiryDays: 90,
  ipWhitelistEnabled: false,
};

const defaultBackupSettings: BackupSettings = {
  schedule: 'DAILY',
  retentionDays: 30,
  time: '03:00',
  includeAttachments: true,
};

// ---- COMPONENT ----
const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // ===== Company settings =====
  const { data: companyData } = useQuery({
    queryKey: ['settings-company'],
    queryFn: () => settingsApi.getCompanySettings(),
  });

  const [companyForm, setCompanyForm] = useState<CompanySettings>(defaultCompanySettings);

  useEffect(() => {
    if (companyData) setCompanyForm(companyData);
  }, [companyData]);

  const updateCompanyMutation = useMutation({
    mutationFn: (data: Partial<CompanySettings>) => settingsApi.updateCompanySettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-company'] });
      toast.success(t('settings.page.toastSaved'));
    },
    onError: () => {
      toast.error(t('settings.page.toastError'));
    },
  });

  // ===== Email settings =====
  const { data: emailData } = useQuery({
    queryKey: ['settings-email'],
    queryFn: () => settingsApi.getEmailSettings(),
  });

  const [emailForm, setEmailForm] = useState<EmailSettings>(defaultEmailSettings);

  useEffect(() => {
    if (emailData) setEmailForm(emailData);
  }, [emailData]);

  const updateEmailMutation = useMutation({
    mutationFn: (data: Partial<EmailSettings>) => settingsApi.updateEmailSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-email'] });
      toast.success(t('settings.page.toastSaved'));
    },
    onError: () => {
      toast.error(t('settings.page.toastError'));
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: () => settingsApi.testEmailConnection(),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t('settings.page.toastTestEmailSuccess'));
      } else {
        toast.error(result.message || t('settings.page.toastTestEmailError'));
      }
    },
    onError: () => {
      toast.error(t('settings.page.toastTestEmailError'));
    },
  });

  // ===== Security settings =====
  const { data: securityData } = useQuery({
    queryKey: ['settings-security'],
    queryFn: () => settingsApi.getSecuritySettings(),
  });

  const [securityForm, setSecurityForm] = useState<SecuritySettings>(defaultSecuritySettings);

  useEffect(() => {
    if (securityData) setSecurityForm(securityData);
  }, [securityData]);

  const updateSecurityMutation = useMutation({
    mutationFn: (data: Partial<SecuritySettings>) => settingsApi.updateSecuritySettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-security'] });
      toast.success(t('settings.page.toastSaved'));
    },
    onError: () => {
      toast.error(t('settings.page.toastError'));
    },
  });

  // ===== Integrations =====
  const { data: integrations = [] } = useQuery<Integration[]>({
    queryKey: ['settings-integrations'],
    queryFn: () => settingsApi.getIntegrations(),
  });

  // ===== Notification settings =====
  const { data: notifData = [] } = useQuery<NotificationSetting[]>({
    queryKey: ['settings-notifications'],
    queryFn: () => settingsApi.getNotificationSettings(),
  });

  const [notifSettings, setNotifSettings] = useState<NotificationSetting[]>([]);

  useEffect(() => {
    if (notifData.length > 0) setNotifSettings(notifData);
  }, [notifData]);

  const toggleNotifChannel = (notifId: string, channel: 'email' | 'push' | 'telegram' | 'inApp') => {
    setNotifSettings((prev) =>
      prev.map((n) => n.id === notifId ? { ...n, channels: { ...n.channels, [channel]: !n.channels[channel] } } : n),
    );
  };

  const updateNotifMutation = useMutation({
    mutationFn: (settings: NotificationSetting[]) => settingsApi.updateNotificationSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-notifications'] });
      toast.success(t('settings.page.toastSaved'));
    },
    onError: () => {
      toast.error(t('settings.page.toastError'));
    },
  });

  // ===== Backup settings =====
  const { data: backupSettingsData } = useQuery({
    queryKey: ['settings-backup'],
    queryFn: () => settingsApi.getBackupSettings(),
  });

  const [backupForm, setBackupForm] = useState<BackupSettings>(defaultBackupSettings);

  useEffect(() => {
    if (backupSettingsData) setBackupForm(backupSettingsData);
  }, [backupSettingsData]);

  const updateBackupMutation = useMutation({
    mutationFn: (data: Partial<BackupSettings>) => settingsApi.updateBackupSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-backup'] });
      toast.success(t('settings.page.toastSaved'));
    },
    onError: () => {
      toast.error(t('settings.page.toastError'));
    },
  });

  const { data: backupHistory = [] } = useQuery<BackupEntry[]>({
    queryKey: ['settings-backup-history'],
    queryFn: () => settingsApi.getBackupHistory(),
  });

  const createBackupMutation = useMutation({
    mutationFn: () => settingsApi.createBackup(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-backup-history'] });
      toast.success(t('settings.page.toastBackupStarted'));
    },
    onError: () => {
      toast.error(t('settings.page.toastBackupError'));
    },
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('settings.page.title')}
        subtitle={t('settings.page.subtitle')}
        breadcrumbs={[
          { label: t('settings.page.breadcrumbHome'), href: '/' },
          { label: t('settings.page.breadcrumbSettings') },
        ]}
      />

      <div className="flex gap-6">
        {/* Left nav */}
        <nav className="w-56 flex-shrink-0">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-2">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  activeTab === id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100',
                )}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          {/* ========= ОСНОВНЫЕ ========= */}
          {activeTab === 'general' && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-6">{t('settings.page.generalTitle')}</h2>

              {/* Logo upload */}
              <div className="flex items-center gap-5 mb-8 pb-6 border-b border-neutral-100">
                <div className="w-20 h-20 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex flex-col items-center justify-center text-neutral-400 cursor-pointer hover:border-primary-400 hover:text-primary-500 transition-colors">
                  <Upload size={20} />
                  <span className="text-[10px] mt-1">{t('settings.page.logoLabel')}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{t('settings.page.companyLogo')}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t('settings.page.logoHint')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
                <FormField label={t('settings.page.fieldOrgName')} required className="sm:col-span-2">
                  <Input
                    value={companyForm.companyName}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, companyName: e.target.value }))}
                  />
                </FormField>
                <FormField label={t('settings.page.fieldINN')} required>
                  <Input
                    value={companyForm.inn}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, inn: e.target.value }))}
                  />
                </FormField>
                <FormField label={t('settings.page.fieldKPP')}>
                  <Input
                    value={companyForm.kpp}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, kpp: e.target.value }))}
                  />
                </FormField>
                <FormField label={t('settings.page.fieldOGRN')}>
                  <Input
                    value={companyForm.ogrn}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, ogrn: e.target.value }))}
                  />
                </FormField>
                <FormField label={t('settings.page.fieldPhone')}>
                  <Input
                    type="tel"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </FormField>
                <FormField label={t('settings.page.fieldEmail')} className="sm:col-span-2">
                  <Input
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </FormField>
                <FormField label={t('settings.page.fieldLegalAddress')} className="sm:col-span-2">
                  <Textarea
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, address: e.target.value }))}
                    rows={2}
                  />
                </FormField>
              </div>

              <div className="border-t border-neutral-100 mt-6 pt-6">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('settings.page.regionalTitle')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-2xl">
                  <FormField label={t('settings.page.fieldCurrency')}>
                    <Select
                      options={[
                        { value: 'RUB', label: t('settings.page.currencyRUB') },
                        { value: 'USD', label: t('settings.page.currencyUSD') },
                        { value: 'EUR', label: t('settings.page.currencyEUR') },
                      ]}
                      value={companyForm.defaultCurrency}
                      onChange={(e) => setCompanyForm((prev) => ({ ...prev, defaultCurrency: e.target.value }))}
                    />
                  </FormField>
                  <FormField label={t('settings.page.fieldLanguage')}>
                    <Select
                      options={[
                        { value: 'ru', label: t('mockData.languageRussian') },
                        { value: 'en', label: 'English' },
                      ]}
                      value={companyForm.language}
                      onChange={(e) => setCompanyForm((prev) => ({ ...prev, language: e.target.value }))}
                    />
                  </FormField>
                  <FormField label={t('settings.page.fieldTimezone')}>
                    <Select
                      options={[
                        { value: 'Europe/Moscow', label: t('mockData.timezoneMoscow') },
                        { value: 'Europe/Samara', label: t('mockData.timezoneSamara') },
                        { value: 'Asia/Yekaterinburg', label: t('mockData.timezoneYekaterinburg') },
                        { value: 'Asia/Novosibirsk', label: t('mockData.timezoneNovosibirsk') },
                        { value: 'Asia/Vladivostok', label: t('mockData.timezoneVladivostok') },
                      ]}
                      value={companyForm.timezone}
                      onChange={(e) => setCompanyForm((prev) => ({ ...prev, timezone: e.target.value }))}
                    />
                  </FormField>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-neutral-100">
                <Button
                  loading={updateCompanyMutation.isPending}
                  onClick={() => updateCompanyMutation.mutate(companyForm)}
                >
                  {t('settings.page.btnSave')}
                </Button>
              </div>
            </div>
          )}

          {/* ========= EMAIL ========= */}
          {activeTab === 'email' && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-6">{t('settings.page.emailTitle')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
                <FormField label={t('settings.page.fieldSmtpHost')} required>
                  <Input
                    value={emailForm.smtpHost}
                    onChange={(e) => setEmailForm((prev) => ({ ...prev, smtpHost: e.target.value }))}
                    placeholder="smtp.example.com"
                  />
                </FormField>
                <FormField label={t('settings.page.fieldPort')} required>
                  <Input
                    type="number"
                    value={emailForm.smtpPort}
                    onChange={(e) => setEmailForm((prev) => ({ ...prev, smtpPort: Number(e.target.value) }))}
                  />
                </FormField>
                <FormField label={t('settings.page.fieldUsername')} required>
                  <Input
                    value={emailForm.smtpUsername}
                    onChange={(e) => setEmailForm((prev) => ({ ...prev, smtpUsername: e.target.value }))}
                  />
                </FormField>
                <FormField label={t('settings.page.fieldPassword')} required>
                  <Input
                    type="password"
                    value={emailForm.smtpPassword}
                    onChange={(e) => setEmailForm((prev) => ({ ...prev, smtpPassword: e.target.value }))}
                  />
                </FormField>
                <FormField label={t('settings.page.fieldSenderEmail')} required>
                  <Input
                    type="email"
                    value={emailForm.fromEmail}
                    onChange={(e) => setEmailForm((prev) => ({ ...prev, fromEmail: e.target.value }))}
                  />
                </FormField>
                <FormField label={t('settings.page.fieldSenderName')}>
                  <Input
                    value={emailForm.fromName}
                    onChange={(e) => setEmailForm((prev) => ({ ...prev, fromName: e.target.value }))}
                  />
                </FormField>
                <div className="sm:col-span-2">
                  <Toggle
                    checked={emailForm.useTls}
                    onChange={(v) => setEmailForm((prev) => ({ ...prev, useTls: v }))}
                    label={t('settings.page.tlsLabel')}
                  />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-neutral-100 flex items-center gap-3">
                <Button
                  loading={updateEmailMutation.isPending}
                  onClick={() => updateEmailMutation.mutate(emailForm)}
                >
                  {t('settings.page.btnSave')}
                </Button>
                <Button
                  variant="secondary"
                  iconLeft={<Send size={16} />}
                  loading={testEmailMutation.isPending}
                  onClick={() => testEmailMutation.mutate()}
                >
                  {t('settings.page.btnTestEmail')}
                </Button>
              </div>
            </div>
          )}

          {/* ========= БЕЗОПАСНОСТЬ ========= */}
          {activeTab === 'security' && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-6">{t('settings.page.securityTitle')}</h2>
              <div className="max-w-xl space-y-6">
                <FormField label={t('settings.page.fieldSessionLife')} hint={t('settings.page.fieldSessionLifeHint')}>
                  <Input
                    type="number"
                    value={securityForm.sessionTimeoutMinutes}
                    onChange={(e) => setSecurityForm((prev) => ({ ...prev, sessionTimeoutMinutes: Number(e.target.value) }))}
                    min={5}
                    max={1440}
                  />
                </FormField>
                <FormField label={t('settings.page.fieldMaxAttempts')} hint={t('settings.page.fieldMaxAttemptsHint')}>
                  <Input
                    type="number"
                    value={securityForm.maxLoginAttempts}
                    onChange={(e) => setSecurityForm((prev) => ({ ...prev, maxLoginAttempts: Number(e.target.value) }))}
                    min={3}
                    max={20}
                  />
                </FormField>
                <FormField label={t('settings.page.fieldMinPasswordLength')}>
                  <Input
                    type="number"
                    value={securityForm.passwordMinLength}
                    onChange={(e) => setSecurityForm((prev) => ({ ...prev, passwordMinLength: Number(e.target.value) }))}
                    min={6}
                    max={32}
                  />
                </FormField>
                <FormField label={t('settings.page.fieldPasswordExpiry')} hint={t('settings.page.fieldPasswordExpiryHint')}>
                  <Input
                    type="number"
                    value={securityForm.passwordExpiryDays}
                    onChange={(e) => setSecurityForm((prev) => ({ ...prev, passwordExpiryDays: Number(e.target.value) }))}
                    min={0}
                  />
                </FormField>
                <div className="pt-2">
                  <Toggle
                    checked={securityForm.twoFactorEnabled}
                    onChange={(v) => setSecurityForm((prev) => ({ ...prev, twoFactorEnabled: v }))}
                    label={t('settings.page.twoFaLabel')}
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 ml-[46px]">
                    {t('settings.page.twoFaDescription')}
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-neutral-100">
                <Button
                  loading={updateSecurityMutation.isPending}
                  onClick={() => updateSecurityMutation.mutate(securityForm)}
                >
                  {t('settings.page.btnSaveSettings')}
                </Button>
              </div>
            </div>
          )}

          {/* ========= ИНТЕГРАЦИИ ========= */}
          {activeTab === 'integrations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('settings.page.integrationsTitle')}</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{t('settings.page.integrationsSubtitle')}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          integration.status === 'ACTIVE' ? 'bg-success-50 text-success-600' :
                          integration.status === 'ERROR' ? 'bg-danger-50 text-danger-600' :
                          'bg-neutral-100 dark:bg-neutral-800 text-neutral-400',
                        )}>
                          <Plug size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{integration.name}</p>
                          <StatusBadge
                            status={integration.status}
                            colorMap={integrationStatusMap}
                            label={integrationStatusLabels[integration.status]}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                    {integration.errorMessage && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">{integration.errorMessage}</p>
                    )}
                    {integration.lastSyncAt && (
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-4">
                        <Clock size={12} />
                        <span>{t('settings.page.lastSync')}: {formatDateTime(integration.lastSyncAt)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" iconLeft={<Settings2 size={14} />}>
                        {t('settings.page.btnConfigure')}
                      </Button>
                      {integration.status === 'ACTIVE' && (
                        <Button size="sm" variant="ghost" iconLeft={<RefreshCw size={14} />}>
                          {t('settings.page.btnSync')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========= УВЕДОМЛЕНИЯ ========= */}
          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('settings.page.notificationsTitle')}</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{t('settings.page.notificationsSubtitle')}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[40%]">
                        {t('settings.page.colNotificationType')}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1"><Mail size={13} /> {t('settings.page.colEmail')}</div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1"><Bell size={13} /> {t('settings.page.colPush')}</div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1"><Send size={13} /> {t('settings.page.colTelegram')}</div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1"><Bell size={13} /> {t('settings.page.colInApp')}</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifSettings.map((notif, idx) => (
                      <tr
                        key={notif.id}
                        className={cn('border-b border-neutral-100', idx % 2 === 1 && 'bg-neutral-25')}
                      >
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{notif.label}</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{notif.description}</p>
                        </td>
                        {(['email', 'push', 'telegram', 'inApp'] as const).map((channel) => (
                          <td key={channel} className="px-4 py-3 text-center">
                            <Checkbox
                              checked={notif.channels[channel]}
                              onChange={() => toggleNotifChannel(notif.id, channel)}
                              className="mx-auto"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                <Button
                  loading={updateNotifMutation.isPending}
                  onClick={() => updateNotifMutation.mutate(notifSettings)}
                >
                  {t('settings.page.btnSaveSettings')}
                </Button>
              </div>
            </div>
          )}

          {/* ========= РЕЗЕРВНОЕ КОПИРОВАНИЕ ========= */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              {/* Settings card */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-6">{t('settings.page.backupScheduleTitle')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-2xl">
                  <FormField label={t('settings.page.fieldSchedule')}>
                    <Select
                      options={[
                        { value: 'DAILY', label: t('settings.page.scheduleDaily') },
                        { value: 'WEEKLY', label: t('settings.page.scheduleWeekly') },
                        { value: 'MONTHLY', label: t('settings.page.scheduleMonthly') },
                      ]}
                      value={backupForm.schedule}
                      onChange={(e) => setBackupForm((prev) => ({ ...prev, schedule: e.target.value as BackupSettings['schedule'] }))}
                    />
                  </FormField>
                  <FormField label={t('settings.page.fieldStartTime')}>
                    <Input
                      type="time"
                      value={backupForm.time}
                      onChange={(e) => setBackupForm((prev) => ({ ...prev, time: e.target.value }))}
                    />
                  </FormField>
                  <FormField label={t('settings.page.fieldRetention')}>
                    <Input
                      type="number"
                      value={backupForm.retentionDays}
                      onChange={(e) => setBackupForm((prev) => ({ ...prev, retentionDays: Number(e.target.value) }))}
                      min={7}
                      max={365}
                    />
                  </FormField>
                </div>
                <div className="mt-5">
                  <Checkbox
                    label={t('settings.page.checkboxIncludeAttachments')}
                    checked={backupForm.includeAttachments}
                    onChange={(e) => setBackupForm((prev) => ({ ...prev, includeAttachments: e.target.checked }))}
                  />
                </div>
                <div className="mt-6 pt-6 border-t border-neutral-100 flex items-center gap-3">
                  <Button
                    loading={updateBackupMutation.isPending}
                    onClick={() => updateBackupMutation.mutate(backupForm)}
                  >
                    {t('settings.page.btnSave')}
                  </Button>
                  <Button
                    variant="secondary"
                    iconLeft={<Database size={16} />}
                    loading={createBackupMutation.isPending}
                    onClick={() => createBackupMutation.mutate()}
                  >
                    {t('settings.page.btnCreateBackupNow')}
                  </Button>
                </div>
              </div>

              {/* History table */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('settings.page.backupHistoryTitle')}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                        <th className="px-6 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('settings.page.headerDate')}</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('settings.page.headerSize')}</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('settings.page.headerType')}</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('settings.page.headerStatus')}</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('settings.page.headerActions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backupHistory.map((backup, idx) => (
                        <tr key={backup.id} className={cn('border-b border-neutral-100', idx % 2 === 1 && 'bg-neutral-25')}>
                          <td className="px-6 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 tabular-nums">{formatDateTime(backup.createdAt)}</td>
                          <td className="px-4 py-2.5 text-sm text-neutral-600">{backup.size}</td>
                          <td className="px-4 py-2.5 text-sm text-neutral-600">{backup.type === 'AUTO' ? t('settings.page.typeAuto') : t('settings.page.typeManual')}</td>
                          <td className="px-4 py-2.5">
                            <span className={cn(
                              'inline-flex items-center gap-1 text-xs font-medium',
                              backup.status === 'COMPLETED' ? 'text-success-600' : backup.status === 'FAILED' ? 'text-danger-600' : 'text-warning-600',
                            )}>
                              {backup.status === 'COMPLETED' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                              {backupStatusLabels[backup.status]}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {backup.status === 'COMPLETED' && (
                              <Button size="xs" variant="ghost" iconLeft={<Download size={13} />}>
                                {t('settings.page.btnDownload')}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
