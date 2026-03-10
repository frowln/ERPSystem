import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ToggleLeft, ToggleRight, Settings, Building2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/design-system/components/PageHeader';
import { t } from '@/i18n';
import { adminApi, type SystemSetting } from '@/api/admin';
import toast from 'react-hot-toast';
import { TenantManagementContent } from './TenantManagementPage';

type SettingsTab = 'general' | 'tenants';

const CATEGORY_KEYS: Record<string, string> = {
  general: 'systemSettings.catGeneral',
  security: 'systemSettings.catSecurity',
  storage: 'systemSettings.catStorage',
  notifications: 'systemSettings.catNotifications',
  integrations: 'systemSettings.catIntegrations',
  integration: 'systemSettings.catIntegrations',
  email: 'systemSettings.catEmail',
  backup: 'systemSettings.catBackup',
};

const SETTING_KEYS: Record<string, string> = {
  company_name: 'systemSettings.setting.companyName',
  company_address: 'systemSettings.setting.companyAddress',
  company_email: 'systemSettings.setting.companyEmail',
  company_phone: 'systemSettings.setting.companyPhone',
  company_inn: 'systemSettings.setting.inn',
  company_kpp: 'systemSettings.setting.kpp',
  company_ogrn: 'systemSettings.setting.ogrn',
  company_logo_url: 'systemSettings.setting.logoUrl',
  default_language: 'systemSettings.setting.defaultLanguage',
  default_currency: 'systemSettings.setting.defaultCurrency',
  default_timezone: 'systemSettings.setting.timezone',
  timezone: 'systemSettings.setting.timezone',
  date_format: 'systemSettings.setting.dateFormat',
  session_timeout_minutes: 'systemSettings.setting.sessionTimeout',
  max_login_attempts: 'systemSettings.setting.maxLoginAttempts',
  two_factor_enabled: 'systemSettings.setting.twoFactor',
  require_2fa: 'systemSettings.setting.twoFactor',
  password_min_length: 'systemSettings.setting.minPasswordLength',
  email_notifications_enabled: 'systemSettings.setting.emailNotifications',
  push_notifications_enabled: 'systemSettings.setting.pushNotifications',
  notification_digest_interval: 'systemSettings.setting.digestInterval',
  max_file_size_mb: 'systemSettings.setting.maxFileSize',
  allowed_file_types: 'systemSettings.setting.allowedFileTypes',
  auto_backup_enabled: 'systemSettings.setting.autoBackup',
  backup_enabled: 'systemSettings.setting.backupEnabled',
  backup_retention_days: 'systemSettings.setting.backupRetention',
  backup_schedule: 'systemSettings.setting.backupSchedule',
  smtp_host: 'systemSettings.setting.smtpHost',
  smtp_port: 'systemSettings.setting.smtpPort',
  smtp_username: 'systemSettings.setting.smtpUsername',
  smtp_password: 'systemSettings.setting.smtpPassword',
  smtp_from_email: 'systemSettings.setting.smtpFromEmail',
  smtp_use_tls: 'systemSettings.setting.smtpUseTls',
  telegram_bot_token: 'systemSettings.setting.telegramBotToken',
  telegram_bot_enabled: 'systemSettings.setting.telegramBotEnabled',
  telegram_chat_id: 'systemSettings.setting.telegramChatId',
  '1c_sync_enabled': 'systemSettings.setting.syncWith1C',
};

const SystemSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const settingsTabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: t('systemSettings.tabGeneral'), icon: <Settings size={16} /> },
    { id: 'tenants', label: t('systemSettings.tabTenants'), icon: <Building2 size={16} /> },
  ];

  const { data: grouped = {}, isLoading } = useQuery({
    queryKey: ['admin-settings-grouped'],
    queryFn: adminApi.getSettingsGrouped,
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => adminApi.updateSetting(key, value),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings-grouped'] });
      setEditValues((prev) => { const next = { ...prev }; delete next[vars.key]; return next; });
      toast.success(t('systemSettings.saved'));
    },
    onError: () => toast.error(t('systemSettings.saveError')),
  });

  const getValue = (setting: SystemSetting) => editValues[setting.key] ?? setting.value;
  const hasChange = (setting: SystemSetting) => editValues[setting.key] !== undefined && editValues[setting.key] !== setting.value;

  const settingDisplayName = (setting: SystemSetting) =>
    SETTING_KEYS[setting.key] ? t(SETTING_KEYS[setting.key]) : (setting.description ?? setting.key);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('systemSettings.title')}
        subtitle={t('systemSettings.subtitle')}
        breadcrumbs={[
          { label: t('navigation.items.dashboard'), href: '/' },
          { label: t('adminDashboard.title'), href: '/admin/dashboard' },
          { label: t('systemSettings.title') },
        ]}
      />

      {/* Tabs */}
      <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden w-fit">
        {settingsTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tenants tab */}
      {activeTab === 'tenants' && <TenantManagementContent />}

      {/* General settings tab */}
      {activeTab === 'general' && (isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, settings]) => (
            <div key={category} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <div className="px-5 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {CATEGORY_KEYS[category] ? t(CATEGORY_KEYS[category]) : category}
                </h3>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {(settings as SystemSetting[]).map((setting) => (
                  <div key={setting.key} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{settingDisplayName(setting)}</p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 font-mono">{setting.key}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {setting.type === 'BOOLEAN' ? (
                        <button
                          onClick={() => {
                            const newVal = getValue(setting) === 'true' ? 'false' : 'true';
                            setEditValues({ ...editValues, [setting.key]: newVal });
                            updateMutation.mutate({ key: setting.key, value: newVal });
                          }}
                          className="flex items-center"
                        >
                          {getValue(setting) === 'true'
                            ? <ToggleRight className="h-8 w-8 text-green-500" />
                            : <ToggleLeft className="h-8 w-8 text-neutral-400" />
                          }
                        </button>
                      ) : (
                        <>
                          <input
                            value={getValue(setting)}
                            onChange={(e) => setEditValues({ ...editValues, [setting.key]: e.target.value })}
                            className="w-48 px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100"
                          />
                          {hasChange(setting) && (
                            <button
                              onClick={() => updateMutation.mutate({ key: setting.key, value: getValue(setting) })}
                              className="p-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default SystemSettingsPage;
