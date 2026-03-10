import React, { useCallback } from 'react';
import { Reply, ReplyAll, Forward, Download, Link2, X } from 'lucide-react';
import { t } from '@/i18n';
import { formatDateTime } from '@/lib/format';
import { emailApi, type EmailMessage } from '@/api/email';
import { apiClient } from '@/api/client';

interface MailDetailProps {
  message: EmailMessage;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  onLinkProject: () => void;
  onUnlinkProject: (projectId: string) => void;
  projectNames?: Record<string, string>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const MailDetail: React.FC<MailDetailProps> = ({
  message,
  onReply,
  onReplyAll,
  onForward,
  onLinkProject,
  onUnlinkProject,
  projectNames,
}) => {
  const handleDownload = useCallback(async (emailId: string, attId: string, fileName: string) => {
    try {
      const response = await apiClient.get(
        `/v1/email/messages/${emailId}/attachments/${attId}/download`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // silently fail
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {message.subject || t('mail.noSubject')}
        </h2>
        <div className="flex items-start justify-between gap-4">
          <div className="text-sm text-neutral-600 dark:text-neutral-400 space-y-0.5">
            <div>
              <span className="font-medium">{t('mail.from')}:</span>{' '}
              {message.fromName ? `${message.fromName} <${message.fromAddress}>` : message.fromAddress}
            </div>
            <div>
              <span className="font-medium">{t('mail.to')}:</span>{' '}
              {message.toAddresses?.join(', ')}
            </div>
            {message.ccAddresses && message.ccAddresses.length > 0 && (
              <div>
                <span className="font-medium">{t('mail.cc')}:</span>{' '}
                {message.ccAddresses.join(', ')}
              </div>
            )}
          </div>
          <span className="text-xs text-neutral-400 dark:text-neutral-500 flex-shrink-0">
            {formatDateTime(message.receivedAt)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 mt-3">
          <button
            onClick={onReply}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
          >
            <Reply size={16} />
            {t('mail.reply')}
          </button>
          <button
            onClick={onReplyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
          >
            <ReplyAll size={16} />
            {t('mail.replyAll')}
          </button>
          <button
            onClick={onForward}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
          >
            <Forward size={16} />
            {t('mail.forward')}
          </button>
          <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1" />
          <button
            onClick={onLinkProject}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
          >
            <Link2 size={16} />
            {t('mail.linkProject')}
          </button>
        </div>

        {/* Linked projects */}
        {message.linkedProjectIds && message.linkedProjectIds.length > 0 && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs text-neutral-500">{t('mail.linkedProjects')}:</span>
            {message.linkedProjectIds.map((pid) => (
              <span
                key={pid}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full"
              >
                {projectNames?.[pid] || pid.slice(0, 8)}
                <button
                  onClick={() => onUnlinkProject(pid)}
                  className="hover:text-red-500"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Attachments */}
      {message.attachments && message.attachments.length > 0 && (
        <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-neutral-500">{t('mail.attachments')}:</span>
          {message.attachments.map((att) => (
            <button
              key={att.id}
              onClick={() => handleDownload(message.id, att.id, att.fileName)}
              className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
            >
              <Download size={12} />
              {att.fileName}
              <span className="text-neutral-400">({formatBytes(att.sizeBytes)})</span>
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {message.bodyHtml ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-none email-body"
            dangerouslySetInnerHTML={{ __html: message.bodyHtml }}
            style={{
              overflow: 'hidden',
              wordBreak: 'break-word',
            }}
          />
        ) : (
          <pre className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap font-sans">
            {message.bodyText || ''}
          </pre>
        )}
      </div>
    </div>
  );
};
