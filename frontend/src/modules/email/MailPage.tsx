import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';
import { t } from '@/i18n';
import { emailApi, type EmailMessage } from '@/api/email';
import { MailSidebar } from './components/MailSidebar';
import { MailList } from './components/MailList';
import { MailDetail } from './components/MailDetail';
import { ComposeModal, type ComposeMode } from './components/ComposeModal';
import { LinkProjectModal } from './components/LinkProjectModal';

const MailPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [folder, setFolder] = useState('INBOX');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    searchParams.get('messageId')
  );
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>('new');
  const [linkProjectOpen, setLinkProjectOpen] = useState(false);

  // Auto-select message from URL query param
  useEffect(() => {
    const msgId = searchParams.get('messageId');
    if (msgId && msgId !== selectedMessageId) {
      setSelectedMessageId(msgId);
      // Clean up URL
      searchParams.delete('messageId');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, selectedMessageId, setSearchParams]);

  // List messages
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['email-messages', folder, search, page],
    queryFn: () => emailApi.getMessages({ folder, search: search || undefined, page, size: 20 }),
  });

  const messages = messagesData?.content || [];
  const totalPages = messagesData?.totalPages || 0;

  // Selected message detail
  const { data: selectedMessage } = useQuery({
    queryKey: ['email-message', selectedMessageId],
    queryFn: () => emailApi.getMessage(selectedMessageId!),
    enabled: !!selectedMessageId,
  });

  // Unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['email-unread-count'],
    queryFn: () => emailApi.getUnreadCount(),
    refetchInterval: 60000,
  });

  // Mutations
  const syncMutation = useMutation({
    mutationFn: () => emailApi.sync(),
    onSuccess: () => {
      toast.success(t('mail.syncSuccess'));
      queryClient.invalidateQueries({ queryKey: ['email-messages'] });
      queryClient.invalidateQueries({ queryKey: ['email-unread-count'] });
    },
    onError: () => toast.error(t('mail.syncError')),
  });

  const starMutation = useMutation({
    mutationFn: ({ id, starred }: { id: string; starred: boolean }) =>
      starred ? emailApi.unstar(id) : emailApi.star(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-messages'] });
      if (selectedMessageId) {
        queryClient.invalidateQueries({ queryKey: ['email-message', selectedMessageId] });
      }
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const sendMutation = useMutation({
    mutationFn: (data: {
      to: string[];
      cc: string[];
      subject: string;
      bodyHtml: string;
      mode: ComposeMode;
      replyAll?: boolean;
    }) => {
      if (data.mode === 'reply' || data.mode === 'replyAll') {
        if (!selectedMessageId) throw new Error('No message selected');
        return emailApi.reply(selectedMessageId, {
          bodyHtml: data.bodyHtml,
          replyAll: data.replyAll,
        });
      }
      if (data.mode === 'forward') {
        if (!selectedMessageId) throw new Error('No message selected');
        return emailApi.forward(selectedMessageId, {
          to: data.to,
          cc: data.cc,
          bodyHtml: data.bodyHtml,
        });
      }
      return emailApi.send({
        to: data.to,
        cc: data.cc,
        subject: data.subject,
        bodyHtml: data.bodyHtml,
      });
    },
    onSuccess: () => {
      toast.success(t('mail.sendSuccess'));
      setComposeOpen(false);
      queryClient.invalidateQueries({ queryKey: ['email-messages'] });
    },
    onError: () => toast.error(t('mail.sendError')),
  });

  const linkProjectMutation = useMutation({
    mutationFn: (projectId: string) => {
      if (!selectedMessageId) throw new Error('No message selected');
      return emailApi.linkProject(selectedMessageId, projectId);
    },
    onSuccess: () => {
      setLinkProjectOpen(false);
      queryClient.invalidateQueries({ queryKey: ['email-message', selectedMessageId] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const unlinkProjectMutation = useMutation({
    mutationFn: (projectId: string) => {
      if (!selectedMessageId) throw new Error('No message selected');
      return emailApi.unlinkProject(selectedMessageId, projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-message', selectedMessageId] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const handleFolderChange = useCallback((newFolder: string) => {
    setFolder(newFolder);
    setPage(0);
    setSearch('');
    setSelectedMessageId(null);
  }, []);

  const handleSelectMessage = useCallback((id: string) => {
    setSelectedMessageId(id);
  }, []);

  const handleCompose = useCallback((mode: ComposeMode = 'new') => {
    setComposeMode(mode);
    setComposeOpen(true);
  }, []);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      <MailSidebar
        activeFolder={folder}
        onFolderChange={handleFolderChange}
        onCompose={() => handleCompose('new')}
        unreadCount={unreadCount}
      />

      <MailList
        messages={messages}
        selectedId={selectedMessageId}
        onSelectMessage={handleSelectMessage}
        onStarMessage={(id, starred) => starMutation.mutate({ id, starred })}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        onSync={() => syncMutation.mutate()}
        isSyncing={syncMutation.isPending}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {selectedMessage ? (
        <MailDetail
          message={selectedMessage}
          onReply={() => handleCompose('reply')}
          onReplyAll={() => handleCompose('replyAll')}
          onForward={() => handleCompose('forward')}
          onLinkProject={() => setLinkProjectOpen(true)}
          onUnlinkProject={(pid) => unlinkProjectMutation.mutate(pid)}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900 text-neutral-400">
          <Mail size={48} className="mb-3" />
          <span className="text-sm">{t('mail.noMessageSelected')}</span>
        </div>
      )}

      {composeOpen && (
        <ComposeModal
          mode={composeMode}
          originalMessage={selectedMessage}
          onSend={(data) => sendMutation.mutate(data)}
          onClose={() => setComposeOpen(false)}
          isSending={sendMutation.isPending}
        />
      )}

      {linkProjectOpen && selectedMessage && (
        <LinkProjectModal
          onLink={(pid) => linkProjectMutation.mutate(pid)}
          onClose={() => setLinkProjectOpen(false)}
          excludeProjectIds={selectedMessage.linkedProjectIds || []}
        />
      )}
    </div>
  );
};

export default MailPage;
