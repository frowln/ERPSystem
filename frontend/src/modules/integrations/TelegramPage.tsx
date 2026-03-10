import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Send,
  Search,
  Users,
  MessageCircle,
  Bot,
  Globe,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { FormField, Input, Textarea } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { apiClient } from '@/api/client';
import { formatDateTime } from '@/lib/format';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TelegramConfig {
  botName: string;
  botUsername: string;
  tokenMasked: string;
  webhookUrl: string;
  isActive: boolean;
  subscriberCount: number;
  messagesToday: number;
}

interface TelegramSubscriber {
  id: string;
  chatId: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  subscribedAt: string;
  lastActivity: string;
  isActive: boolean;
}

interface TelegramMessage {
  id: string;
  chatId: string;
  recipientName: string;
  text: string;
  direction: 'OUTGOING' | 'INCOMING';
  status: 'DELIVERED' | 'FAILED' | 'PENDING';
  sentAt: string;
}

const messageStatusColorMap: Record<string, 'green' | 'red' | 'yellow'> = {
  delivered: 'green',
  failed: 'red',
  pending: 'yellow',
};

const getMessageStatusLabels = (): Record<string, string> => ({
  delivered: t('integrations.telegram.statusDelivered'),
  failed: t('integrations.telegram.statusFailed'),
  pending: t('integrations.telegram.statusPending'),
});

const defaultTelegramConfig: TelegramConfig = {
  botName: '',
  botUsername: '',
  tokenMasked: '',
  webhookUrl: '',
  isActive: false,
  subscriberCount: 0,
  messagesToday: 0,
};

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type TabId = 'subscribers' | 'messages';

const TelegramPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('subscribers');
  const [search, setSearch] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testChatId, setTestChatId] = useState('');

  // Fetch config
  const { data: config } = useQuery<TelegramConfig>({
    queryKey: ['telegram-config'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/integrations/telegram/status', { _silentErrors: true } as any);
        const status = res.data as {
          enabled: boolean;
          configured: boolean;
          botUsername: string | null;
          subscriberCount: number;
          pendingMessages: number;
          failedMessages: number;
        };
        return {
          botName: 'Privod ERP Bot',
          botUsername: status.botUsername ? `@${status.botUsername}` : '@privod_erp_bot',
          tokenMasked: status.configured ? '******TOKEN' : t('integrations.telegram.notConfigured'),
          webhookUrl: window.location.origin + '/api/integrations/telegram/webhook',
          isActive: status.enabled,
          subscriberCount: status.subscriberCount,
          messagesToday: 0,
        } as TelegramConfig;
      } catch {
        return defaultTelegramConfig;
      }
    },
  });

  // Fetch subscribers
  const { data: subscribers, isLoading: subscribersLoading } = useQuery<TelegramSubscriber[]>({
    queryKey: ['telegram-subscribers'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/integrations/telegram/subscriptions', { _silentErrors: true } as any);
        return res.data as TelegramSubscriber[];
      } catch {
        return [];
      }
    },
  });

  // Fetch messages
  const { data: messages, isLoading: messagesLoading } = useQuery<TelegramMessage[]>({
    queryKey: ['telegram-messages'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/integrations/telegram/messages', { _silentErrors: true } as any);
        return res.data as TelegramMessage[];
      } catch {
        return [];
      }
    },
  });

  // Send test message mutation
  const sendTestMutation = useMutation({
    mutationFn: async ({ chatId, text }: { chatId: string; text: string }) => {
      await apiClient.post('/integrations/telegram/test', { chatId, message: text });
    },
    onSuccess: () => {
      toast.success(t('integrations.telegram.testMessageSent'));
      setShowTestModal(false);
      setTestMessage('');
      setTestChatId('');
      queryClient.invalidateQueries({ queryKey: ['telegram-messages'] });
    },
    onError: () => {
      toast.error(t('integrations.telegram.testMessageFailed'));
    },
  });

  const cfg = config ?? defaultTelegramConfig;
  const subs = subscribers ?? [];
  const msgs = messages ?? [];

  // Filter subscribers
  const filteredSubscribers = useMemo(() => {
    if (!search) return subs;
    const lower = search.toLowerCase();
    return subs.filter(
      (s) =>
        s.username.toLowerCase().includes(lower) ||
        s.firstName.toLowerCase().includes(lower) ||
        s.lastName.toLowerCase().includes(lower) ||
        s.role.toLowerCase().includes(lower),
    );
  }, [subs, search]);

  // Filter messages
  const filteredMessages = useMemo(() => {
    if (!search) return msgs;
    const lower = search.toLowerCase();
    return msgs.filter(
      (m) =>
        m.recipientName.toLowerCase().includes(lower) ||
        m.text.toLowerCase().includes(lower),
    );
  }, [msgs, search]);

  const handleSendTest = useCallback(() => {
    if (!testMessage.trim()) {
      toast.error(t('integrations.telegram.enterMessageText'));
      return;
    }
    sendTestMutation.mutate({
      chatId: testChatId || subs[0]?.chatId || '',
      text: testMessage,
    });
  }, [testMessage, testChatId, subs, sendTestMutation]);

  const messageStatusLabels = getMessageStatusLabels();

  // Subscriber columns
  const subscriberColumns = useMemo<ColumnDef<TelegramSubscriber, unknown>[]>(
    () => [
      {
        accessorKey: 'firstName',
        header: t('integrations.telegram.colName'),
        size: 200,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {row.original.lastName} {row.original.firstName}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">@{row.original.username}</p>
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: t('integrations.telegram.colRole'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'chatId',
        header: 'Chat ID',
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: t('integrations.telegram.colStatus'),
        size: 110,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<boolean>() ? 'ACTIVE' : 'INACTIVE'}
            colorMap={{ active: 'green', inactive: 'gray' }}
            label={getValue<boolean>() ? t('integrations.telegram.subscriberActive') : t('integrations.telegram.subscriberInactive')}
          />
        ),
      },
      {
        accessorKey: 'subscribedAt',
        header: t('integrations.telegram.colSubscribedSince'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300 text-xs">
            {formatDateTime(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'lastActivity',
        header: t('integrations.telegram.colLastActivity'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300 text-xs">
            {formatDateTime(getValue<string>())}
          </span>
        ),
      },
    ],
    [],
  );

  // Message columns
  const messageColumns = useMemo<ColumnDef<TelegramMessage, unknown>[]>(
    () => [
      {
        accessorKey: 'recipientName',
        header: t('integrations.telegram.colRecipient'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'text',
        header: t('integrations.telegram.colMessage'),
        size: 400,
        cell: ({ getValue }) => (
          <p className="text-neutral-700 dark:text-neutral-300 text-xs truncate max-w-[380px]">
            {getValue<string>()}
          </p>
        ),
      },
      {
        accessorKey: 'status',
        header: t('integrations.telegram.colMsgStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={messageStatusColorMap}
            label={messageStatusLabels[getValue<string>()]}
          />
        ),
      },
      {
        accessorKey: 'sentAt',
        header: t('integrations.telegram.colTime'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300 text-xs">
            {formatDateTime(getValue<string>())}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('integrations.telegram.title')}
        subtitle={t('integrations.telegram.subtitle')}
        breadcrumbs={[
          { label: t('integrations.telegram.breadcrumbHome'), href: '/' },
          { label: t('integrations.telegram.breadcrumbSettings'), href: '/settings' },
          { label: t('integrations.telegram.breadcrumbIntegrations'), href: '/integrations' },
          { label: t('integrations.telegram.title') },
        ]}
        backTo="/integrations"
        actions={
          <Button
            iconLeft={<Send size={16} />}
            onClick={() => setShowTestModal(true)}
          >
            {t('integrations.telegram.testMessage')}
          </Button>
        }
        tabs={[
          { id: 'subscribers', label: t('integrations.telegram.tabSubscribers'), count: subs.length },
          { id: 'messages', label: t('integrations.telegram.tabMessages'), count: msgs.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Bot config summary */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
            <Bot size={20} className="text-cyan-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{cfg.botName}</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{cfg.botUsername}</p>
          </div>
          <StatusBadge
            status={cfg.isActive ? 'ACTIVE' : 'INACTIVE'}
            colorMap={{ active: 'green', inactive: 'gray' }}
            label={cfg.isActive ? t('integrations.telegram.botActive') : t('integrations.telegram.botInactive')}
            size="sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-neutral-400" />
            <span className="text-neutral-500 dark:text-neutral-400">{t('integrations.telegram.token')}:</span>
            <span className="font-mono text-neutral-700 dark:text-neutral-300">{cfg.tokenMasked}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-neutral-400" />
            <span className="text-neutral-500 dark:text-neutral-400">Webhook:</span>
            <span className="font-mono text-neutral-700 dark:text-neutral-300 truncate">{cfg.webhookUrl}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-neutral-400" />
            <span className="text-neutral-500 dark:text-neutral-400">{t('integrations.telegram.messagesToday')}:</span>
            <span className="font-medium text-neutral-700 dark:text-neutral-300">{cfg.messagesToday}</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Users size={18} />} label={t('integrations.telegram.metricSubscribers')} value={cfg.subscriberCount} />
        <MetricCard
          icon={<CheckCircle2 size={18} />}
          label={t('integrations.telegram.metricActive')}
          value={subs.filter((s) => s.isActive).length}
        />
        <MetricCard
          icon={<MessageCircle size={18} />}
          label={t('integrations.telegram.metricMessagesToday')}
          value={cfg.messagesToday}
        />
        <MetricCard
          icon={<XCircle size={18} />}
          label={t('integrations.telegram.metricDeliveryErrors')}
          value={msgs.filter((m) => m.status === 'FAILED').length}
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            placeholder={
              activeTab === 'subscribers'
                ? t('integrations.telegram.searchSubscribers')
                : t('integrations.telegram.searchMessages')
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Data table */}
      {activeTab === 'subscribers' && (
        <DataTable<TelegramSubscriber>
          data={filteredSubscribers}
          columns={subscriberColumns}
          loading={subscribersLoading}
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          emptyTitle={t('integrations.telegram.emptySubscribersTitle')}
          emptyDescription={t('integrations.telegram.emptySubscribersDescription')}
        />
      )}

      {activeTab === 'messages' && (
        <DataTable<TelegramMessage>
          data={filteredMessages}
          columns={messageColumns}
          loading={messagesLoading}
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          emptyTitle={t('integrations.telegram.emptyMessagesTitle')}
          emptyDescription={t('integrations.telegram.emptyMessagesDescription')}
        />
      )}

      {/* Test message modal */}
      <Modal
        open={showTestModal}
        onClose={() => setShowTestModal(false)}
        title={t('integrations.telegram.sendTestMessageTitle')}
        description={t('integrations.telegram.sendTestMessageDescription')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowTestModal(false)}>
              {t('integrations.telegram.cancel')}
            </Button>
            <Button
              onClick={handleSendTest}
              loading={sendTestMutation.isPending}
              iconLeft={<Send size={16} />}
            >
              {t('integrations.telegram.send')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('integrations.telegram.fieldChatId')} hint={t('integrations.telegram.fieldChatIdHint')}>
            <Input
              placeholder="123456789"
              value={testChatId}
              onChange={(e) => setTestChatId(e.target.value)}
            />
          </FormField>
          <FormField label={t('integrations.telegram.fieldMessageText')} required>
            <Textarea
              placeholder={t('integrations.telegram.fieldMessagePlaceholder')}
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={4}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default TelegramPage;
