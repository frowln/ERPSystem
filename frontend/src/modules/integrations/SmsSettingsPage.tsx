import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  MessageSquare,
  Send,
  Settings,
  Wallet,
  Power,
  PowerOff,
  Loader2,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { cn } from '@/lib/cn';
import { formatDateTime, formatMoney } from '@/lib/format';
import {
  integrationsApi,
  type SmsConfigData,
  type SmsMessageData,
  type SendSmsForm,
} from '@/api/integrations';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Status maps
// ---------------------------------------------------------------------------

const msgStatusColorMap: Record<string, 'green' | 'red' | 'yellow' | 'blue'> = {
  PENDING: 'yellow',
  SENT: 'blue',
  DELIVERED: 'green',
  FAILED: 'red',
};

const getMsgStatusLabels = (): Record<string, string> => ({
  PENDING: t('integrations.sms.statusPending'),
  SENT: t('integrations.sms.statusSent'),
  DELIVERED: t('integrations.sms.statusDelivered'),
  FAILED: t('integrations.sms.statusFailed'),
});

type TabId = 'config' | 'messages';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SmsSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('config');
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendForm, setSendForm] = useState<SendSmsForm>({ recipient: '', text: '' });

  const [form, setForm] = useState<{
    provider: string;
    apiUrl: string;
    apiKey: string;
    senderName: string;
    enabled: boolean;
  }>({
    provider: 'SMSC',
    apiUrl: '',
    apiKey: '',
    senderName: '',
    enabled: false,
  });

  // Fetch config
  const { data: config } = useQuery({
    queryKey: ['sms-config'],
    queryFn: async () => {
      try {
        const res = await integrationsApi.sms.getConfig();
        return res;
      } catch {
        return null;
      }
    },
    select: (data) => {
      if (data && !form.apiUrl && !form.apiKey) {
        setForm({
          provider: data.provider ?? 'SMSC',
          apiUrl: data.apiUrl ?? '',
          apiKey: data.apiKey ?? '',
          senderName: data.senderName ?? '',
          enabled: data.enabled ?? false,
        });
      }
      return data;
    },
  });

  // Fetch messages
  const { data: messagesRaw } = useQuery({
    queryKey: ['sms-messages'],
    queryFn: async () => {
      try {
        const res = await integrationsApi.sms.getMessages();
        return res.content ?? [];
      } catch {
        return [];
      }
    },
  });
  const messages = messagesRaw ?? [];

  // Fetch balance
  const { data: balanceData } = useQuery({
    queryKey: ['sms-balance'],
    queryFn: async () => {
      try {
        return await integrationsApi.sms.getBalance();
      } catch {
        return null;
      }
    },
  });

  // Save config
  const saveMutation = useMutation({
    mutationFn: () => integrationsApi.sms.updateConfig(form as Partial<SmsConfigData>),
    onSuccess: () => {
      toast.success(t('integrations.sms.configSaved'));
      queryClient.invalidateQueries({ queryKey: ['sms-config'] });
    },
    onError: () => toast.error(t('integrations.sms.configError')),
  });

  // Send message
  const sendMutation = useMutation({
    mutationFn: () => integrationsApi.sms.sendMessage(sendForm),
    onSuccess: () => {
      toast.success(t('integrations.sms.messageSent'));
      setShowSendModal(false);
      setSendForm({ recipient: '', text: '' });
      queryClient.invalidateQueries({ queryKey: ['sms-messages'] });
    },
    onError: () => toast.error(t('integrations.sms.sendError')),
  });

  const msgStatusLabels = getMsgStatusLabels();

  const messageColumns = useMemo<ColumnDef<SmsMessageData, unknown>[]>(() => [
    {
      accessorKey: 'recipient',
      header: t('integrations.sms.colRecipient'),
      size: 150,
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-neutral-900 dark:text-neutral-100">
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'text',
      header: t('integrations.sms.colText'),
      size: 250,
      cell: ({ getValue }) => {
        const text = getValue<string>();
        return (
          <span
            className="text-sm text-neutral-700 dark:text-neutral-300 truncate block max-w-[250px]"
            title={text}
          >
            {text.length > 60 ? text.slice(0, 60) + '...' : text}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: t('integrations.sms.colStatus'),
      size: 120,
      cell: ({ getValue }) => (
        <StatusBadge
          status={getValue<string>()}
          colorMap={msgStatusColorMap}
          label={msgStatusLabels[getValue<string>()] ?? getValue<string>()}
        />
      ),
    },
    {
      accessorKey: 'sentAt',
      header: t('integrations.sms.colSentAt'),
      size: 160,
      cell: ({ getValue }) => (
        <span className="text-xs text-neutral-700 dark:text-neutral-300">
          {getValue<string>() ? formatDateTime(getValue<string>()) : '--'}
        </span>
      ),
    },
    {
      accessorKey: 'deliveredAt',
      header: t('integrations.sms.colDeliveredAt'),
      size: 160,
      cell: ({ getValue }) => (
        <span className="text-xs text-neutral-700 dark:text-neutral-300">
          {getValue<string>() ? formatDateTime(getValue<string>()) : '--'}
        </span>
      ),
    },
    {
      accessorKey: 'cost',
      header: t('integrations.sms.colCost'),
      size: 100,
      cell: ({ getValue }) => {
        const cost = getValue<number>();
        return (
          <span className="tabular-nums text-sm text-neutral-700 dark:text-neutral-300">
            {cost != null ? formatMoney(cost) : '--'}
          </span>
        );
      },
    },
  ], []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('integrations.sms.title')}
        subtitle={t('integrations.sms.subtitle')}
        breadcrumbs={[
          { label: t('integrations.sms.breadcrumbHome'), href: '/' },
          { label: t('integrations.sms.breadcrumbIntegrations'), href: '/integrations' },
          { label: t('integrations.sms.title') },
        ]}
        backTo="/integrations"
        actions={
          activeTab === 'messages' ? (
            <Button iconLeft={<Send size={16} />} onClick={() => setShowSendModal(true)}>
              {t('integrations.sms.sendMessage')}
            </Button>
          ) : undefined
        }
        tabs={[
          { id: 'config', label: t('integrations.sms.tabConfig') },
          { id: 'messages', label: t('integrations.sms.tabMessages'), count: messages.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Summary card */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
            <MessageSquare size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
              {t('integrations.sms.title')}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {config?.provider
                ? t('integrations.sms.providerLabel') + ': ' + config.provider
                : t('integrations.sms.notConfigured')}
            </p>
          </div>
          <StatusBadge
            status={config?.enabled ? 'ACTIVE' : 'INACTIVE'}
            colorMap={{ active: 'green', inactive: 'gray' }}
            label={config?.enabled ? t('integrations.sms.enabled') : t('integrations.sms.disabled')}
            size="sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            icon={<MessageSquare size={16} />}
            label={t('integrations.sms.metricMessages')}
            value={messages.length}
          />
          <MetricCard
            icon={<Wallet size={16} />}
            label={t('integrations.sms.metricBalance')}
            value={balanceData ? formatMoney(balanceData.balance) : '--'}
          />
          <MetricCard
            icon={<Send size={16} />}
            label={t('integrations.sms.metricDelivered')}
            value={messages.filter((m) => m.status === 'DELIVERED').length}
          />
        </div>
      </div>

      {/* Config tab */}
      {activeTab === 'config' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('integrations.sms.configTitle')}
          </h3>
          <div className="space-y-4 max-w-2xl">
            <FormField label={t('integrations.sms.fieldProvider')} required>
              <Select
                options={[
                  { value: 'SMSC', label: 'SMSC.ru' },
                  { value: 'SMS_AERO', label: 'SMS Aero' },
                  { value: 'TWILIO', label: 'Twilio' },
                  { value: 'WHATSAPP', label: 'WhatsApp Business' },
                ]}
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
              />
            </FormField>

            <FormField label={t('integrations.sms.fieldApiUrl')} hint={t('integrations.sms.hintApiUrl')}>
              <Input
                placeholder="https://smsc.ru/sys/send.php"
                value={form.apiUrl}
                onChange={(e) => setForm({ ...form, apiUrl: e.target.value })}
              />
            </FormField>

            <FormField label={t('integrations.sms.fieldApiKey')} required>
              <Input
                type="password"
                placeholder="********"
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              />
            </FormField>

            <FormField label={t('integrations.sms.fieldSenderName')} hint={t('integrations.sms.hintSenderName')}>
              <Input
                placeholder="PRIVOD"
                value={form.senderName}
                onChange={(e) => setForm({ ...form, senderName: e.target.value })}
              />
            </FormField>

            {/* Enable toggle */}
            <div className="flex items-center gap-3 py-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, enabled: !form.enabled })}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors',
                  form.enabled ? 'bg-success-500' : 'bg-neutral-300 dark:bg-neutral-600',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                    form.enabled && 'translate-x-5',
                  )}
                />
              </button>
              <span className="text-sm text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                {form.enabled ? <Power size={14} className="text-green-500" /> : <PowerOff size={14} className="text-neutral-400" />}
                {form.enabled ? t('integrations.sms.toggleEnabled') : t('integrations.sms.toggleDisabled')}
              </span>
            </div>

            {/* Balance card */}
            {balanceData && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {t('integrations.sms.balanceLabel')}: {formatMoney(balanceData.balance)}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <Button
                iconLeft={saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                onClick={() => saveMutation.mutate()}
                loading={saveMutation.isPending}
              >
                {t('integrations.sms.save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages tab */}
      {activeTab === 'messages' && (
        <DataTable<SmsMessageData>
          data={messages}
          columns={messageColumns}
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          emptyTitle={t('integrations.sms.emptyTitle')}
          emptyDescription={t('integrations.sms.emptyDescription')}
        />
      )}

      {/* Send message modal */}
      <Modal
        open={showSendModal}
        onClose={() => setShowSendModal(false)}
        title={t('integrations.sms.sendModalTitle')}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowSendModal(false)}>
              {t('integrations.sms.cancel')}
            </Button>
            <Button
              onClick={() => sendMutation.mutate()}
              loading={sendMutation.isPending}
              disabled={!sendForm.recipient || !sendForm.text}
            >
              {t('integrations.sms.sendButton')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('integrations.sms.fieldRecipient')} required>
            <Input
              placeholder="+7 (900) 123-45-67"
              value={sendForm.recipient}
              onChange={(e) => setSendForm({ ...sendForm, recipient: e.target.value })}
            />
          </FormField>
          <FormField label={t('integrations.sms.fieldText')} required>
            <Textarea
              placeholder={t('integrations.sms.placeholderText')}
              value={sendForm.text}
              onChange={(e) => setSendForm({ ...sendForm, text: e.target.value })}
              rows={4}
            />
          </FormField>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {t('integrations.sms.charCount', { count: String(sendForm.text.length) })}
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default SmsSettingsPage;
