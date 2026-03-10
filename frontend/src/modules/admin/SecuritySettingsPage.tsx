import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, Globe, Plus, Trash2, ShieldCheck, AlertTriangle, ShieldAlert, Users, ListChecks } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input } from '@/design-system/components/FormField';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { t } from '@/i18n';
import { adminApi, type IpWhitelistEntry, type SystemSetting } from '@/api/admin';
import { formatDateTime } from '@/lib/format';
import toast from 'react-hot-toast';
import { LoginAuditContent } from './LoginAuditPage';
import { AuditLogContent } from './AuditLogPage';
import { OnlineUsersContent } from './OnlineUsersPage';

type Tab = 'password' | '2fa' | 'ip-whitelist' | 'login-audit' | 'audit-log' | 'online-users';

const SecuritySettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const confirm = useConfirmDialog();
  const [activeTab, setActiveTab] = useState<Tab>('password');
  const [newIp, setNewIp] = useState('');
  const [newIpDesc, setNewIpDesc] = useState('');

  const { data: settings = [] } = useQuery<SystemSetting[]>({
    queryKey: ['admin-settings'],
    queryFn: adminApi.getSettings,
  });

  const { data: ipList = [], isLoading: ipLoading } = useQuery<IpWhitelistEntry[]>({
    queryKey: ['ip-whitelist'],
    queryFn: adminApi.getIpWhitelist,
  });

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => adminApi.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success(t('admin.settings.toastSettingUpdated'));
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const addIpMutation = useMutation({
    mutationFn: (data: { ipAddress: string; description?: string }) => adminApi.addIpWhitelist(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-whitelist'] });
      toast.success(t('admin.settings.toastIpAdded'));
      setNewIp('');
      setNewIpDesc('');
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const removeIpMutation = useMutation({
    mutationFn: (id: string) => adminApi.removeIpWhitelist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-whitelist'] });
      toast.success(t('admin.settings.toastIpRemoved'));
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const getSetting = (key: string): string => {
    return settings.find((s) => s.key === key)?.value ?? '';
  };

  const handleSettingToggle = (key: string, currentValue: string) => {
    updateSettingMutation.mutate({ key, value: currentValue === 'true' ? 'false' : 'true' });
  };

  const handleSettingChange = (key: string, value: string) => {
    updateSettingMutation.mutate({ key, value });
  };

  const handleRemoveIp = async (ip: IpWhitelistEntry) => {
    const confirmed = await confirm({
      title: t('admin.security.confirmRemoveIpTitle'),
      description: t('admin.security.confirmRemoveIpDesc', { ip: ip.ipAddress }),
      confirmLabel: t('common.delete'),
      confirmVariant: 'danger',
    });
    if (confirmed) {
      removeIpMutation.mutate(ip.id);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'password', label: t('admin.security.tabPassword'), icon: <Key size={16} /> },
    { id: '2fa', label: t('admin.security.tabTwoFactor'), icon: <ShieldCheck size={16} /> },
    { id: 'ip-whitelist', label: t('admin.security.tabIpWhitelist'), icon: <Globe size={16} /> },
    { id: 'login-audit', label: t('admin.security.tabLoginAudit'), icon: <ShieldAlert size={16} /> },
    { id: 'audit-log', label: t('admin.security.tabAuditLog'), icon: <ListChecks size={16} /> },
    { id: 'online-users', label: t('admin.security.tabOnlineUsers'), icon: <Users size={16} /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t('admin.security.title')}
        subtitle={t('admin.security.subtitle')}
        breadcrumbs={[
          { label: t('navigation.items.dashboard'), href: '/' },
          { label: t('adminDashboard.title'), href: '/admin/dashboard' },
          { label: t('admin.security.title') },
        ]}
      />

      {/* Tabs */}
      <div className="flex flex-wrap rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden w-fit">
        {tabs.map((tab) => (
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

      {/* Password Policy */}
      {activeTab === 'password' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('admin.security.passwordPolicyTitle')}</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin.security.passwordPolicySubtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SettingInput
              label={t('admin.security.minPasswordLength')}
              value={getSetting('password_min_length') || '8'}
              type="number"
              onChange={(v) => handleSettingChange('password_min_length', v)}
            />
            <SettingInput
              label={t('admin.security.maxLoginAttempts')}
              value={getSetting('max_login_attempts') || '5'}
              type="number"
              onChange={(v) => handleSettingChange('max_login_attempts', v)}
            />
            <SettingInput
              label={t('admin.security.passwordExpiryDays')}
              value={getSetting('password_expiry_days') || '0'}
              type="number"
              onChange={(v) => handleSettingChange('password_expiry_days', v)}
            />
            <SettingInput
              label={t('admin.security.lockoutDurationMinutes')}
              value={getSetting('lockout_duration_minutes') || '30'}
              type="number"
              onChange={(v) => handleSettingChange('lockout_duration_minutes', v)}
            />
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 space-y-3">
            <SettingToggle
              label={t('admin.security.requireDigits')}
              value={getSetting('password_require_digits') === 'true'}
              onChange={() => handleSettingToggle('password_require_digits', getSetting('password_require_digits'))}
            />
            <SettingToggle
              label={t('admin.security.requireSpecialChars')}
              value={getSetting('password_require_special') === 'true'}
              onChange={() => handleSettingToggle('password_require_special', getSetting('password_require_special'))}
            />
            <SettingToggle
              label={t('admin.security.requireUppercase')}
              value={getSetting('password_require_uppercase') === 'true'}
              onChange={() => handleSettingToggle('password_require_uppercase', getSetting('password_require_uppercase'))}
            />
          </div>
        </div>
      )}

      {/* 2FA */}
      {activeTab === '2fa' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-success-50 dark:bg-success-900/20">
              <ShieldCheck className="h-5 w-5 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('admin.security.twoFactorTitle')}</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin.security.twoFactorSubtitle')}</p>
            </div>
          </div>

          <SettingToggle
            label={t('admin.security.enable2faOrg')}
            description={t('admin.security.enable2faOrgDesc')}
            value={getSetting('two_factor_enabled') === 'true'}
            onChange={() => handleSettingToggle('two_factor_enabled', getSetting('two_factor_enabled'))}
          />

          <SettingToggle
            label={t('admin.security.require2faAdmins')}
            description={t('admin.security.require2faAdminsDesc')}
            value={getSetting('two_factor_required_admins') === 'true'}
            onChange={() => handleSettingToggle('two_factor_required_admins', getSetting('two_factor_required_admins'))}
          />

          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t('admin.security.important')}</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  {t('admin.security.twoFactorWarning')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Audit */}
      {activeTab === 'login-audit' && <LoginAuditContent />}

      {/* Audit Log */}
      {activeTab === 'audit-log' && <AuditLogContent />}

      {/* Online Users */}
      {activeTab === 'online-users' && <OnlineUsersContent />}

      {/* IP Whitelist */}
      {activeTab === 'ip-whitelist' && (
        <div className="space-y-4">
          {/* Add new */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">{t('admin.security.addIpTitle')}</h3>
            <div className="flex gap-3 items-end">
              <FormField label={t('admin.security.colIpAddress')} className="flex-1 max-w-xs">
                <Input
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  placeholder="192.168.1.0/24"
                  className="font-mono"
                />
              </FormField>
              <FormField label={t('admin.security.colDescription')} className="flex-1">
                <Input
                  value={newIpDesc}
                  onChange={(e) => setNewIpDesc(e.target.value)}
                  placeholder={t('admin.security.ipDescriptionPlaceholder')}
                />
              </FormField>
              <Button
                iconLeft={<Plus size={16} />}
                onClick={() => {
                  if (!newIp.trim()) return;
                  addIpMutation.mutate({ ipAddress: newIp.trim(), description: newIpDesc.trim() || undefined });
                }}
                disabled={!newIp.trim() || addIpMutation.isPending}
                loading={addIpMutation.isPending}
              >
                {t('admin.security.addBtn')}
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            {ipLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary-200 border-t-primary-600 rounded-full" />
              </div>
            ) : ipList.filter((ip) => ip.isActive).length === 0 ? (
              <div className="text-center py-8 text-neutral-400 dark:text-neutral-500">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t('admin.security.ipListEmpty')}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                    <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">{t('admin.security.colIpAddress')}</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">{t('admin.security.colDescription')}</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">{t('admin.security.colCreatedBy')}</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">{t('admin.security.colDate')}</th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {ipList.filter((ip) => ip.isActive).map((ip) => (
                    <tr key={ip.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-4 py-3 font-mono text-xs text-neutral-900 dark:text-neutral-100">{ip.ipAddress}</td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{ip.description ?? '—'}</td>
                      <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 text-xs">{ip.createdBy ?? '—'}</td>
                      <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 text-xs">{ip.createdAt ? formatDateTime(ip.createdAt) : '—'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRemoveIp(ip)}
                          className="p-1.5 rounded hover:bg-danger-50 dark:hover:bg-danger-900/20 text-neutral-400 hover:text-danger-600 dark:hover:text-danger-400 transition-colors"
                          disabled={removeIpMutation.isPending}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function SettingInput({ label, value, type = 'text', onChange }: { label: string; value: string; type?: string; onChange: (v: string) => void }) {
  const [localValue, setLocalValue] = useState(value);
  useEffect(() => { setLocalValue(value); }, [value]);

  return (
    <FormField label={label}>
      <div className="flex gap-2">
        <Input
          type={type}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
        />
        {localValue !== value && (
          <Button size="sm" onClick={() => onChange(localValue)}>{t('admin.security.saveBtn')}</Button>
        )}
      </div>
    </FormField>
  );
}

function SettingToggle({ label, description, value, onChange }: { label: string; description?: string; value: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{label}</p>
        {description && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={onChange}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors',
          value ? 'bg-success-500' : 'bg-neutral-300 dark:bg-neutral-600',
        )}
        role="switch"
        aria-checked={value}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
            value && 'translate-x-5',
          )}
        />
      </button>
    </div>
  );
}

export default SecuritySettingsPage;
