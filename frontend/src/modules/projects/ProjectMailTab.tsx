import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Unlink, Link2, Paperclip } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { t } from '@/i18n';
import { Button } from '@/design-system/components/Button';
import { emailApi, type EmailMessage } from '@/api/email';
import toast from 'react-hot-toast';

interface ProjectMailTabProps {
  projectId: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ProjectMailTab: React.FC<ProjectMailTabProps> = ({ projectId }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showLinkModal, setShowLinkModal] = useState(false);

  const { data: messages = [] } = useQuery({
    queryKey: ['email-project-messages', projectId],
    queryFn: () => emailApi.getProjectMessages(projectId),
  });

  const unlinkMutation = useMutation({
    mutationFn: (emailId: string) => emailApi.unlinkProject(emailId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-project-messages', projectId] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  // For "Link email" we use a simplified approach: open mail page to pick and link
  // Here we show a search modal that searches all messages and links them

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {t('projects.mail.title')}
        </h3>
        <Button size="sm" onClick={() => setShowLinkModal(true)} iconLeft={<Link2 size={14} />}>
          {t('projects.mail.linkEmail')}
        </Button>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-12">
          <Mail size={48} className="mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {t('projects.mail.empty')}
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            {t('projects.mail.emptyDescription')}
          </p>
        </div>
      ) : (
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-neutral-500">{t('mail.from')}</th>
                <th className="text-left px-3 py-2 font-medium text-neutral-500">{t('mail.subject')}</th>
                <th className="text-left px-3 py-2 font-medium text-neutral-500">{t('mail.date')}</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {messages.map((msg: EmailMessage) => (
                <tr
                  key={msg.id}
                  className="border-t border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer"
                  onClick={() => navigate(`/mail?messageId=${msg.id}`)}
                >
                  <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">
                    {msg.fromName || msg.fromAddress}
                  </td>
                  <td className="px-3 py-2 text-neutral-900 dark:text-neutral-100">
                    <div className="flex items-center gap-1">
                      {msg.subject || t('mail.noSubject')}
                      {msg.hasAttachments && <Paperclip size={14} className="text-neutral-400" />}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-neutral-500 text-xs whitespace-nowrap">
                    {formatDate(msg.receivedAt)}
                  </td>
                  <td className="px-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        unlinkMutation.mutate(msg.id);
                      }}
                      className="p-1 text-neutral-400 hover:text-red-500 rounded"
                      title={t('mail.unlinkProject')}
                    >
                      <Unlink size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showLinkModal && (
        <LinkEmailToProjectModal
          projectId={projectId}
          onClose={() => setShowLinkModal(false)}
          onLinked={() => {
            queryClient.invalidateQueries({ queryKey: ['email-project-messages', projectId] });
            setShowLinkModal(false);
          }}
        />
      )}
    </div>
  );
};

// Simplified modal to search and link emails to this project
const LinkEmailToProjectModal: React.FC<{
  projectId: string;
  onClose: () => void;
  onLinked: () => void;
}> = ({ projectId, onClose, onLinked }) => {
  const [search, setSearch] = useState('');

  const { data: messagesData } = useQuery({
    queryKey: ['email-search-for-link', search],
    queryFn: () => emailApi.getMessages({ search: search || undefined, size: 20 }),
    enabled: search.length >= 2,
  });

  const messages = messagesData?.content || [];

  const linkMutation = useMutation({
    mutationFn: (emailId: string) => emailApi.linkProject(emailId, projectId),
    onSuccess: onLinked,
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
            {t('projects.mail.linkEmail')}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500">
            &times;
          </button>
        </div>
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('mail.searchPlaceholder')}
            className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {search.length < 2 ? (
            <div className="p-4 text-center text-sm text-neutral-400">{t('mail.searchPlaceholder')}</div>
          ) : messages.length === 0 ? (
            <div className="p-4 text-center text-sm text-neutral-400">{t('mail.noMessages')}</div>
          ) : (
            messages.map((msg: EmailMessage) => (
              <button
                key={msg.id}
                onClick={() => linkMutation.mutate(msg.id)}
                className="w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-800 transition-colors"
              >
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {msg.subject || t('mail.noSubject')}
                </div>
                <div className="text-xs text-neutral-500 truncate">
                  {msg.fromName || msg.fromAddress} — {new Date(msg.receivedAt).toLocaleDateString('ru-RU')}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
