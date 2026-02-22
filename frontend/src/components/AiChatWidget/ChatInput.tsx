import React from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

interface ChatInputProps {
  input: string;
  thinking: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onInputChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSend: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  thinking,
  inputRef,
  onInputChange,
  onKeyDown,
  onSend,
}) => (
  <div className="border-t border-neutral-100 dark:border-neutral-800 px-3 py-2.5 flex-shrink-0">
    <div className="flex items-end gap-2">
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={t('aiChat.input.placeholder')}
        rows={1}
        disabled={thinking}
        className={cn(
          'flex-1 resize-none text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2.5',
          'bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400',
          'placeholder:text-neutral-400 max-h-24 leading-relaxed',
        )}
        style={{ minHeight: '38px' }}
      />
      <button
        onClick={onSend}
        disabled={!input.trim() || thinking}
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
          input.trim() && !thinking
            ? 'bg-primary-600 hover:bg-primary-700 text-white'
            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed',
        )}
      >
        <Send size={14} />
      </button>
    </div>
    <p className="text-[10px] text-neutral-400 mt-1.5 text-center">{t('aiChat.input.hint')}</p>
  </div>
);

export default React.memo(ChatInput);
