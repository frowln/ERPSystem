import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  className?: string;
}

const getEmojiGroups = () => [
  {
    name: t('emoji.frequentlyUsed'),
    emojis: ['👍', '👎', '❤️', '😂', '🎉', '🔥', '👀', '💯', '✅', '❌'],
  },
  {
    name: t('emoji.emotions'),
    emojis: ['😀', '😃', '😄', '😁', '😅', '🤣', '😊', '😇', '🙂', '😉', '😍', '🤩', '😘', '😗', '😜', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😬', '😌', '😢', '😭', '😤', '😡', '🤯', '😱'],
  },
  {
    name: t('emoji.gestures'),
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '✌️', '🤞', '🤙', '🤘', '👈', '👉', '👆', '👇', '☝️', '🙏', '🤝', '💪', '👏'],
  },
  {
    name: t('emoji.objects'),
    emojis: ['📎', '📁', '📋', '📊', '📈', '📉', '🔧', '🔨', '⚙️', '🏗️', '🏠', '🏢', '🚧', '📐', '📏', '🗓️', '⏰', '💡', '🎯', '⭐'],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onSelect,
  onClose,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={cn(
        'w-[280px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden',
        className,
      )}
    >
      <div className="max-h-[300px] overflow-y-auto p-2">
        {getEmojiGroups().map((group) => (
          <div key={group.name} className="mb-2">
            <p className="px-1 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
              {group.name}
            </p>
            <div className="grid grid-cols-8 gap-0.5">
              {group.emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onSelect(emoji)}
                  className="w-8 h-8 flex items-center justify-center text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
