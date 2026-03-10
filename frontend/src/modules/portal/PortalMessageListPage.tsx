import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  MessageSquare,
  Send,
  Mail,
  MailOpen,
  Paperclip,
  Clock,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { Input, Textarea, Select } from '@/design-system/components/FormField';
import { FormField } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { portalApi } from '@/api/portal';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { PortalMessage, SendPortalMessageRequest } from './types';
import toast from 'react-hot-toast';

type TabId = 'all' | 'UNREAD' | 'SENT' | 'ARCHIVED';

const PortalMessageListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<PortalMessage | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newContent, setNewContent] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [replyContent, setReplyContent] = useState('');

  const { data: msgData } = useQuery({
    queryKey: ['portal-messages'],
    queryFn: () => portalApi.getMessages(),
  });

  const { data: portalUsers } = useQuery({
    queryKey: ['portal-users'],
    queryFn: () => portalApi.getUsers({ size: 200 }),
  });

  const messages = msgData?.content ?? [];
  const userOptions = (portalUsers?.content ?? []).map((u) => ({ value: u.id, label: `${u.fullName} (${u.companyName})` }));

  const sendMutation = useMutation({
    mutationFn: (data: SendPortalMessageRequest) => portalApi.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-messages'] });
      toast.success(t('portal.messages.messageSent'));
      setComposeOpen(false);
      setNewSubject('');
      setNewContent('');
      setRecipientId('');
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const replyMutation = useMutation({
    mutationFn: (data: SendPortalMessageRequest) => portalApi.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-messages'] });
      toast.success(t('portal.messages.replySent'));
      setReplyContent('');
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const filteredMessages = useMemo(() => {
    let filtered = messages;
    if (activeTab === 'UNREAD') filtered = filtered.filter((m) => m.status === 'SENT');
    else if (activeTab === 'SENT') filtered = filtered.filter((m) => m.status === 'READ');
    else if (activeTab === 'ARCHIVED') filtered = filtered.filter((m) => m.status === 'ARCHIVED');

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (m) => m.subject.toLowerCase().includes(lower) || m.senderName.toLowerCase().includes(lower) || m.content.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [messages, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: messages.length,
    unread: messages.filter((m) => m.status === 'SENT').length,
    sent: messages.filter((m) => m.status === 'READ').length,
    archived: messages.filter((m) => m.status === 'ARCHIVED').length,
  }), [messages]);

  const handleSend = () => {
    sendMutation.mutate({
      recipientId,
      subject: newSubject,
      content: newContent,
    });
  };

  const handleReply = () => {
    if (!selectedMessage || !replyContent.trim()) return;
    replyMutation.mutate({
      recipientId: selectedMessage.senderId,
      subject: `Re: ${selectedMessage.subject}`,
      content: replyContent,
      projectId: selectedMessage.projectId,
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('portal.messages.title')}
        subtitle={t('portal.messages.subtitle', { count: String(messages.length) })}
        breadcrumbs={[
          { label: t('portal.messages.breadcrumbHome'), href: '/' },
          { label: t('portal.messages.breadcrumbPortal'), href: '/portal' },
          { label: t('portal.messages.breadcrumbMessages') },
        ]}
        actions={
          <Button iconLeft={<Send size={16} />} onClick={() => setComposeOpen(true)}>
            {t('portal.messages.newMessage')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('portal.messages.tabAll'), count: tabCounts.all },
          { id: 'UNREAD', label: t('portal.messages.tabUnread'), count: tabCounts.unread },
          { id: 'SENT', label: t('portal.messages.tabRead'), count: tabCounts.sent },
          { id: 'ARCHIVED', label: t('portal.messages.tabArchived'), count: tabCounts.archived },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<MessageSquare size={18} />} label={t('portal.messages.metricTotal')} value={messages.length} />
        <MetricCard icon={<Mail size={18} />} label={t('portal.messages.metricUnread')} value={tabCounts.unread} trend={tabCounts.unread > 0 ? { direction: 'up', value: t('portal.messages.trendNew') } : undefined} />
        <MetricCard icon={<MailOpen size={18} />} label={t('portal.messages.metricRead')} value={tabCounts.sent} />
        <MetricCard icon={<Paperclip size={18} />} label={t('portal.messages.metricWithAttachments')} value={messages.filter((m) => m.hasAttachments).length} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('portal.messages.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message list */}
        <div className="lg:col-span-1 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[600px] overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare size={32} className="mx-auto text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('portal.messages.noMessages')}</p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'p-4 cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800',
                    selectedMessage?.id === msg.id && 'bg-primary-50 dark:bg-primary-900/30 border-l-2 border-l-primary-500',
                    msg.status === 'SENT' && selectedMessage?.id !== msg.id && 'bg-primary-50/50 dark:bg-primary-900/20',
                  )}
                  onClick={() => setSelectedMessage(msg)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {msg.status === 'SENT' && <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                        <p className={cn('text-sm truncate', msg.status === 'SENT' ? 'font-semibold text-neutral-900 dark:text-neutral-100' : 'font-medium text-neutral-700 dark:text-neutral-300')}>
                          {msg.subject}
                        </p>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{msg.senderName}</p>
                      <p className="text-xs text-neutral-400 mt-0.5 truncate">{msg.content.slice(0, 60)}...</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[10px] text-neutral-400">{formatRelativeTime(msg.createdAt)}</span>
                      {msg.hasAttachments && <Paperclip size={12} className="text-neutral-400" />}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message detail */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          {selectedMessage ? (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{selectedMessage.subject}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  <span>{t('portal.messages.from')} <span className="font-medium text-neutral-700 dark:text-neutral-300">{selectedMessage.senderName}</span></span>
                  <span>{t('portal.messages.to')} <span className="font-medium text-neutral-700 dark:text-neutral-300">{selectedMessage.recipientName}</span></span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                  <Clock size={12} />
                  <span>{formatRelativeTime(selectedMessage.createdAt)}</span>
                  {selectedMessage.projectName && (
                    <>
                      <span>/</span>
                      <span>{selectedMessage.projectName}</span>
                    </>
                  )}
                  {selectedMessage.hasAttachments && (
                    <span className="flex items-center gap-1 text-primary-500">
                      <Paperclip size={12} /> {t('portal.messages.attachments')}
                    </span>
                  )}
                </div>
              </div>
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 mt-6">
                <Textarea
                  placeholder={t('portal.messages.replyPlaceholder')}
                  rows={3}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
                <div className="flex justify-end mt-3">
                  <Button
                    size="sm"
                    iconLeft={<Send size={14} />}
                    onClick={handleReply}
                    disabled={!replyContent.trim()}
                    loading={replyMutation.isPending}
                  >
                    {t('portal.messages.reply')}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-neutral-400">
              <MessageSquare size={48} className="mb-3 text-neutral-200" />
              <p className="text-sm">{t('portal.messages.selectMessage')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose modal */}
      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title={t('portal.messages.composeTitle')}
        description={t('portal.messages.composeDescription')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setComposeOpen(false)}>{t('portal.messages.composeCancel')}</Button>
            <Button onClick={handleSend} disabled={!newSubject || !newContent || !recipientId} loading={sendMutation.isPending}>{t('portal.messages.composeSend')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('portal.messages.composeRecipientLabel')} required>
            <Select
              options={userOptions}
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              placeholder={t('portal.messages.composeRecipientPlaceholder')}
            />
          </FormField>
          <FormField label={t('portal.messages.composeSubjectLabel')} required>
            <Input placeholder={t('portal.messages.composeSubjectPlaceholder')} value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
          </FormField>
          <FormField label={t('portal.messages.composeMessageLabel')} required>
            <Textarea placeholder={t('portal.messages.composeMessagePlaceholder')} value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={6} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default PortalMessageListPage;
