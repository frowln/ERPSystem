import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { t } from '@/i18n';
import type { EmailMessage } from '@/api/email';

export type ComposeMode = 'new' | 'reply' | 'replyAll' | 'forward';

interface ComposeModalProps {
  mode: ComposeMode;
  originalMessage?: EmailMessage | null;
  onSend: (data: {
    to: string[];
    cc: string[];
    subject: string;
    bodyHtml: string;
    mode: ComposeMode;
    replyAll?: boolean;
  }) => void;
  onClose: () => void;
  isSending: boolean;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  mode,
  originalMessage,
  onSend,
  onClose,
  isSending,
}) => {
  const getInitialTo = () => {
    if (mode === 'reply' || mode === 'replyAll') {
      return originalMessage?.fromAddress || '';
    }
    return '';
  };

  const getInitialCc = () => {
    if (mode === 'replyAll' && originalMessage) {
      const allTo = originalMessage.toAddresses || [];
      const allCc = originalMessage.ccAddresses || [];
      return [...allTo, ...allCc].filter(Boolean).join(', ');
    }
    return '';
  };

  const getInitialSubject = () => {
    if (!originalMessage?.subject) return '';
    if (mode === 'reply' || mode === 'replyAll') {
      return originalMessage.subject.startsWith('Re: ')
        ? originalMessage.subject
        : `Re: ${originalMessage.subject}`;
    }
    if (mode === 'forward') {
      return originalMessage.subject.startsWith('Fwd: ')
        ? originalMessage.subject
        : `Fwd: ${originalMessage.subject}`;
    }
    return '';
  };

  const [to, setTo] = useState(getInitialTo());
  const [cc, setCc] = useState(getInitialCc());
  const [subject, setSubject] = useState(getInitialSubject());
  const [body, setBody] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const toList = to.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    const ccList = cc.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    if (toList.length === 0) return;
    onSend({
      to: toList,
      cc: ccList,
      subject,
      bodyHtml: `<div>${body.replace(/\n/g, '<br />')}</div>`,
      mode,
      replyAll: mode === 'replyAll',
    });
  };

  const titleKey = mode === 'new' ? 'mail.composeTitle'
    : mode === 'forward' ? 'mail.forwardTitle'
    : 'mail.replyTitle';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
            {t(titleKey)}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* Fields */}
          <div className="px-4 py-2 space-y-2 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-neutral-500 w-14">{t('mail.to')}</label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-neutral-500 w-14">{t('mail.cc')}</label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-neutral-500 w-14">{t('mail.subject')}</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 p-4 overflow-y-auto">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('mail.body')}
              className="w-full h-full min-h-[200px] resize-none text-sm bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
            />
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700 flex justify-end">
            <button
              type="submit"
              disabled={isSending || !to.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              <Send size={16} />
              {isSending ? t('mail.sending') : t('mail.send')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
