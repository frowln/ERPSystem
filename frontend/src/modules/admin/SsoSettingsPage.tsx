import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Server, Plus, Trash2, TestTube, CheckCircle, XCircle, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/design-system/components/PageHeader';
import {
  listSamlProviders,
  createSamlProvider,
  deleteSamlProvider,
  listLdapConfigs,
  createLdapConfig,
  deleteLdapConfig,
  testLdapConnection,
  type SamlProvider,
  type LdapConfig,
  type CreateSamlProviderRequest,
  type CreateLdapConfigRequest,
} from '@/api/sso';

type Tab = 'saml' | 'ldap';

export default function SsoSettingsPage() {
  const [tab, setTab] = useState<Tab>('saml');
  const [showSamlForm, setShowSamlForm] = useState(false);
  const [showLdapForm, setShowLdapForm] = useState(false);
  const qc = useQueryClient();

  const samlQuery = useQuery({ queryKey: ['sso', 'saml'], queryFn: listSamlProviders });
  const ldapQuery = useQuery({ queryKey: ['sso', 'ldap'], queryFn: listLdapConfigs });

  const createSamlMut = useMutation({
    mutationFn: createSamlProvider,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sso', 'saml'] }); setShowSamlForm(false); toast.success(t('sso.saml.created')); },
  });

  const deleteSamlMut = useMutation({
    mutationFn: deleteSamlProvider,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sso', 'saml'] }); toast.success(t('sso.saml.deleted')); },
  });

  const createLdapMut = useMutation({
    mutationFn: createLdapConfig,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sso', 'ldap'] }); setShowLdapForm(false); toast.success(t('sso.ldap.created')); },
  });

  const deleteLdapMut = useMutation({
    mutationFn: deleteLdapConfig,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sso', 'ldap'] }); toast.success(t('sso.ldap.deleted')); },
  });

  const testLdapMut = useMutation({
    mutationFn: testLdapConnection,
    onSuccess: (cfg) => {
      if (cfg?.lastSyncStatus === 'SUCCESS') toast.success(t('sso.ldap.testSuccess'));
      else toast.error(cfg?.lastSyncMessage || t('sso.ldap.testFailed'));
      qc.invalidateQueries({ queryKey: ['sso', 'ldap'] });
    },
  });

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'saml', label: t('sso.saml.title'), icon: Shield },
    { key: 'ldap', label: t('sso.ldap.title'), icon: Server },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t('sso.title')} subtitle={t('sso.subtitle')} />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-neutral-700">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === key
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* SAML Tab */}
      {tab === 'saml' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-neutral-400">{t('sso.saml.description')}</p>
            <button
              onClick={() => setShowSamlForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              {t('sso.saml.add')}
            </button>
          </div>

          {showSamlForm && <SamlForm onSubmit={(d) => createSamlMut.mutate(d)} onCancel={() => setShowSamlForm(false)} loading={createSamlMut.isPending} />}

          <div className="space-y-3">
            {(samlQuery.data || []).map((p) => (
              <SamlProviderCard key={p.id} provider={p} onDelete={() => deleteSamlMut.mutate(p.id)} />
            ))}
            {samlQuery.data?.length === 0 && (
              <div className="text-center py-12 text-gray-400 dark:text-neutral-500">{t('sso.saml.empty')}</div>
            )}
          </div>
        </div>
      )}

      {/* LDAP Tab */}
      {tab === 'ldap' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-neutral-400">{t('sso.ldap.description')}</p>
            <button
              onClick={() => setShowLdapForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              {t('sso.ldap.add')}
            </button>
          </div>

          {showLdapForm && <LdapForm onSubmit={(d) => createLdapMut.mutate(d)} onCancel={() => setShowLdapForm(false)} loading={createLdapMut.isPending} />}

          <div className="space-y-3">
            {(ldapQuery.data || []).map((c) => (
              <LdapConfigCard
                key={c.id}
                config={c}
                onDelete={() => deleteLdapMut.mutate(c.id)}
                onTest={() => testLdapMut.mutate(c.id)}
                testing={testLdapMut.isPending}
              />
            ))}
            {ldapQuery.data?.length === 0 && (
              <div className="text-center py-12 text-gray-400 dark:text-neutral-500">{t('sso.ldap.empty')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SAML Form ──────────────────────────────────────────────────────────────

function SamlForm({ onSubmit, onCancel, loading }: { onSubmit: (d: CreateSamlProviderRequest) => void; onCancel: () => void; loading: boolean }) {
  const [form, setForm] = useState<CreateSamlProviderRequest>({
    code: '', name: '', entityId: '', idpEntityId: '', idpSsoUrl: '', idpCertificate: '',
  });
  const set = (k: keyof CreateSamlProviderRequest, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-6 space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-white">{t('sso.saml.add')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label={t('sso.saml.code')} value={form.code} onChange={(v) => set('code', v)} placeholder="azure-ad" />
        <Input label={t('sso.saml.name')} value={form.name} onChange={(v) => set('name', v)} placeholder="Azure AD" />
        <Input label={t('sso.saml.entityId')} value={form.entityId} onChange={(v) => set('entityId', v)} placeholder="https://app.privod.ru/saml" />
        <Input label={t('sso.saml.idpEntityId')} value={form.idpEntityId} onChange={(v) => set('idpEntityId', v)} />
        <Input label={t('sso.saml.idpSsoUrl')} value={form.idpSsoUrl} onChange={(v) => set('idpSsoUrl', v)} className="md:col-span-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">{t('sso.saml.idpCertificate')}</label>
        <textarea
          value={form.idpCertificate}
          onChange={(e) => set('idpCertificate', e.target.value)}
          rows={4}
          className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-gray-900 dark:text-white font-mono"
          placeholder="-----BEGIN CERTIFICATE-----"
        />
      </div>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 dark:text-neutral-400 hover:text-gray-900">{t('common.cancel')}</button>
        <button
          onClick={() => onSubmit(form)}
          disabled={loading || !form.code || !form.name || !form.idpSsoUrl || !form.idpCertificate}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? '...' : t('common.save')}
        </button>
      </div>
    </div>
  );
}

// ── LDAP Form ──────────────────────────────────────────────────────────────

function LdapForm({ onSubmit, onCancel, loading }: { onSubmit: (d: CreateLdapConfigRequest) => void; onCancel: () => void; loading: boolean }) {
  const [form, setForm] = useState<CreateLdapConfigRequest>({
    name: '', serverUrl: 'ldap://', baseDn: '',
  });
  const set = (k: keyof CreateLdapConfigRequest, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-6 space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-white">{t('sso.ldap.add')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label={t('sso.ldap.name')} value={form.name} onChange={(v) => set('name', v)} placeholder="Corporate AD" />
        <Input label={t('sso.ldap.serverUrl')} value={form.serverUrl!} onChange={(v) => set('serverUrl', v)} placeholder="ldap://ad.company.com:389" />
        <Input label={t('sso.ldap.baseDn')} value={form.baseDn} onChange={(v) => set('baseDn', v)} placeholder="DC=company,DC=com" />
        <Input label={t('sso.ldap.bindDn')} value={form.bindDn || ''} onChange={(v) => set('bindDn', v)} placeholder="CN=service,OU=Users,DC=..." />
        <Input label={t('sso.ldap.bindPassword')} value={form.bindPassword || ''} onChange={(v) => set('bindPassword', v)} type="password" />
      </div>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 dark:text-neutral-400 hover:text-gray-900">{t('common.cancel')}</button>
        <button
          onClick={() => onSubmit(form)}
          disabled={loading || !form.name || !form.serverUrl || !form.baseDn}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? '...' : t('common.save')}
        </button>
      </div>
    </div>
  );
}

// ── Cards ──────────────────────────────────────────────────────────────────

function SamlProviderCard({ provider, onDelete }: { provider: SamlProvider; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-indigo-500" />
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{provider.name}</div>
          <div className="text-xs text-gray-500 dark:text-neutral-400">{provider.code} — {provider.idpEntityId}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn('text-xs px-2 py-0.5 rounded-full', provider.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-neutral-700 dark:text-neutral-400')}>
          {provider.active ? t('common.active') : t('common.inactive')}
        </span>
        <button onClick={onDelete} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function LdapConfigCard({ config, onDelete, onTest, testing }: { config: LdapConfig; onDelete: () => void; onTest: () => void; testing: boolean }) {
  return (
    <div className="flex items-center justify-between bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <Server className="w-5 h-5 text-blue-500" />
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{config.name}</div>
          <div className="text-xs text-gray-500 dark:text-neutral-400">{config.serverUrl} — {config.baseDn}</div>
          {config.lastSyncStatus && (
            <div className="flex items-center gap-1 mt-1 text-xs">
              {config.lastSyncStatus === 'SUCCESS' ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
              <span className={config.lastSyncStatus === 'SUCCESS' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {config.lastSyncMessage}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn('text-xs px-2 py-0.5 rounded-full', config.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-neutral-700 dark:text-neutral-400')}>
          {config.active ? t('common.active') : t('common.inactive')}
        </span>
        <button onClick={onTest} disabled={testing} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded" title={t('sso.ldap.testConnection')}>
          <TestTube className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Shared Input ───────────────────────────────────────────────────────────

function Input({ label, value, onChange, placeholder, type = 'text', className }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
      />
    </div>
  );
}
