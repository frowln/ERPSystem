import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { ChatMessage, PageContext } from './types';

// ---------------------------------------------------------------------------
// Markdown renderer
// ---------------------------------------------------------------------------

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const renderMd = (text: string): string => {
  const escaped = escapeHtml(text);
  const html = escaped
    .replace(/^### (.+)$/gm, '<h4 class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mt-2 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-3 mb-1">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-3 text-xs leading-relaxed">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-3 text-xs leading-relaxed list-decimal">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-xs text-neutral-700 dark:text-neutral-300 mt-1.5">')
    .replace(/\n/g, '<br/>');
  return `<p class="text-xs text-neutral-700 dark:text-neutral-300">${html}</p>`;
};

// ---------------------------------------------------------------------------
// Single message bubble (memoized)
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
  msg: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ msg }) => (
  <div
    className={cn(
      'flex gap-2',
      msg.role === 'user' ? 'justify-end' : 'justify-start',
    )}
  >
    {msg.role === 'assistant' && (
      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles size={12} className="text-white" />
      </div>
    )}
    <div
      className={cn(
        'max-w-[85%] rounded-2xl px-3 py-2',
        msg.role === 'user'
          ? 'bg-primary-600 text-white rounded-tr-sm'
          : 'bg-neutral-100 dark:bg-neutral-800 rounded-tl-sm',
      )}
    >
      {msg.role === 'user' ? (
        <p className="text-xs whitespace-pre-wrap text-white">{msg.content}</p>
      ) : (
        <div
          className="text-xs [&_li]:py-0.5 [&_strong]:font-semibold [&_strong]:text-neutral-900 dark:[&_strong]:text-neutral-100"
          dangerouslySetInnerHTML={{
            __html: renderMd(msg.content || '\u2026'),
          }}
        />
      )}
      <p className={cn(
        'text-[10px] mt-1',
        msg.role === 'user' ? 'text-primary-200' : 'text-neutral-400',
      )}>
        {new Date(msg.ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  </div>
));

MessageBubble.displayName = 'MessageBubble';

// ---------------------------------------------------------------------------
// Thinking indicator
// ---------------------------------------------------------------------------

const ThinkingIndicator: React.FC = () => (
  <div className="flex gap-2 items-start">
    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Sparkles size={12} className="text-white" />
    </div>
    <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl rounded-tl-sm px-3 py-2.5">
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Empty state with suggestions
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  pageCtx: PageContext;
  suggestions: string[];
  onSuggestionClick: (s: string) => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ pageCtx, suggestions, onSuggestionClick }) => (
  <div className="flex flex-col items-center justify-center h-full text-center px-4">
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 flex items-center justify-center mb-3">
      <Sparkles size={20} className="text-primary-600" />
    </div>
    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('aiChat.emptyState.title')}</p>
    <p className="text-xs text-neutral-400 mb-4">{pageCtx.hint}</p>
    <div className="flex flex-col gap-2 w-full">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onSuggestionClick(s)}
          className="text-xs text-left px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-neutral-600 dark:text-neutral-400 hover:text-primary-700"
        >
          {s}
        </button>
      ))}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Message list
// ---------------------------------------------------------------------------

interface ChatMessageListProps {
  messages: ChatMessage[];
  thinking: boolean;
  pageCtx: PageContext;
  suggestions: string[];
  onSuggestionClick: (s: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  thinking,
  pageCtx,
  suggestions,
  onSuggestionClick,
  messagesEndRef,
}) => (
  <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
    {messages.length === 0 && !thinking && (
      <EmptyState pageCtx={pageCtx} suggestions={suggestions} onSuggestionClick={onSuggestionClick} />
    )}

    {messages.map((msg) => (
      <MessageBubble key={msg.id} msg={msg} />
    ))}

    {thinking && <ThinkingIndicator />}

    <div ref={messagesEndRef} />
  </div>
);

export default React.memo(ChatMessageList);
