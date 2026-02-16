import React, { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { EmojiPicker } from './EmojiPicker';

interface MessageInputProps {
  onSend: (content: string) => void;
  onAttach?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  onAttach,
  placeholder = t('messageInput.defaultPlaceholder'),
  disabled = false,
  className,
}) => {
  const [content, setContent] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'AUTO';
    }
  }, [content, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleInput = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'AUTO';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, []);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  }, []);

  return (
    <div className={cn('border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900', className)}>
      <div className="flex items-end gap-2 px-4 py-3">
        {/* Attach button */}
        {onAttach && (
          <button
            onClick={onAttach}
            disabled={disabled}
            className="flex-shrink-0 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
            title={t('messageInput.attachFile')}
          >
            <Paperclip size={18} />
          </button>
        )}

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'w-full px-4 py-2.5 text-sm bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-100 border-0 rounded-xl resize-none',
              'placeholder:text-neutral-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 focus:bg-white dark:focus:bg-neutral-700 transition-all',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
        </div>

        {/* Emoji button */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            disabled={disabled}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
            title={t('messageInput.emoji')}
          >
            <Smile size={18} />
          </button>
          {showEmoji && (
            <div className="absolute bottom-full right-0 mb-2 z-30">
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmoji(false)}
              />
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || !content.trim()}
          className={cn(
            'flex-shrink-0 p-2 rounded-xl transition-all',
            content.trim()
              ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-300 dark:text-neutral-600 cursor-not-allowed',
          )}
          title={t('messageInput.send')}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
