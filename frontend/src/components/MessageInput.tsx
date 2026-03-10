import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Paperclip, Smile, X, FileText, Image as ImageIcon, Film } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { EmojiPicker } from './EmojiPicker';
import { MentionPopup } from './MentionPopup';
import { VoiceRecorder } from './VoiceRecorder';
import type { ChannelMember } from '@/api/messaging';

interface MessageInputProps {
  onSend: (content: string) => void;
  onSendWithFile?: (content: string, file: File) => void;
  onSendVoice?: (blob: Blob, durationSec: number) => void;
  onTyping?: () => void;
  channelMembers?: ChannelMember[];
  placeholder?: string;
  disabled?: boolean;
  uploading?: boolean;
  className?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return ImageIcon;
  if (type.startsWith('video/')) return Film;
  return FileText;
};

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  onSendWithFile,
  onSendVoice,
  onTyping,
  channelMembers = [],
  placeholder = t('messageInput.defaultPlaceholder'),
  disabled = false,
  uploading = false,
  className,
}) => {
  const [content, setContent] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // @mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState(0);

  // Typing debounce
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSend = useCallback(() => {
    const trimmed = content.trim();
    if (selectedFile && onSendWithFile) {
      onSendWithFile(trimmed, selectedFile);
      setContent('');
      setSelectedFile(null);
      setFilePreviewUrl(null);
    } else if (trimmed) {
      onSend(trimmed);
      setContent('');
    }
    setMentionQuery(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'AUTO';
    }
  }, [content, selectedFile, onSend, onSendWithFile]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Handle mention popup navigation
      if (mentionQuery !== null) {
        const filtered = channelMembers.filter((m) =>
          m.name.toLowerCase().includes(mentionQuery.toLowerCase()),
        );
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setMentionIndex((prev) => Math.min(prev + 1, filtered.length - 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setMentionIndex((prev) => Math.max(prev - 1, 0));
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          if (filtered[mentionIndex]) {
            e.preventDefault();
            handleMentionSelect(filtered[mentionIndex]);
            return;
          }
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setMentionQuery(null);
          return;
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend, mentionQuery, mentionIndex, channelMembers],
  );

  const handleMentionSelect = useCallback(
    (member: ChannelMember) => {
      const before = content.slice(0, mentionStartPos);
      const after = content.slice(textareaRef.current?.selectionStart ?? content.length);
      const newContent = `${before}@${member.name} ${after}`;
      setContent(newContent);
      setMentionQuery(null);
      setMentionIndex(0);
      textareaRef.current?.focus();
    },
    [content, mentionStartPos],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setContent(val);

      // Check for @mention trigger
      const cursorPos = e.target.selectionStart ?? val.length;
      const textBeforeCursor = val.slice(0, cursorPos);
      const atMatch = textBeforeCursor.match(/@(\S*)$/);

      if (atMatch) {
        setMentionQuery(atMatch[1] ?? '');
        setMentionStartPos(cursorPos - (atMatch[0]?.length ?? 0));
        setMentionIndex(0);
      } else {
        setMentionQuery(null);
      }

      // Fire typing indicator (debounced)
      if (onTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        onTyping();
        typingTimeoutRef.current = setTimeout(() => {
          typingTimeoutRef.current = null;
        }, 2000);
      }
    },
    [onTyping],
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

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  }, []);

  const handleRemoveFile = useCallback(() => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setSelectedFile(null);
    setFilePreviewUrl(null);
  }, [filePreviewUrl]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const canSend = Boolean(content.trim()) || Boolean(selectedFile);
  const isDisabled = disabled || uploading;

  return (
    <div className={cn('border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900', className)}>
      {/* File preview */}
      {selectedFile && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-3 p-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            {filePreviewUrl ? (
              <img
                src={filePreviewUrl}
                alt={selectedFile.name}
                className="w-12 h-12 object-cover rounded-md flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-md flex items-center justify-center flex-shrink-0">
                {React.createElement(getFileIcon(selectedFile.type), {
                  size: 20,
                  className: 'text-primary-600 dark:text-primary-400',
                })}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-neutral-400">{formatFileSize(selectedFile.size)}</p>
            </div>
            {uploading ? (
              <div className="flex-shrink-0 w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
            ) : (
              <button
                onClick={handleRemoveFile}
                className="flex-shrink-0 p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                title={t('common.delete')}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 px-4 py-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="*/*"
        />

        {/* Attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
          className="flex-shrink-0 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
          title={t('messageInput.attachFile')}
        >
          <Paperclip size={18} />
        </button>

        {/* Text input with mention popup */}
        <div className="flex-1 relative">
          {/* @Mention popup */}
          {mentionQuery !== null && channelMembers.length > 0 && (
            <MentionPopup
              members={channelMembers}
              query={mentionQuery}
              selectedIndex={mentionIndex}
              onSelect={handleMentionSelect}
            />
          )}

          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={selectedFile ? t('messageInput.addCaption') : placeholder}
            disabled={isDisabled}
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
            disabled={isDisabled}
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

        {/* Voice recorder button */}
        {onSendVoice && (
          <VoiceRecorder
            onSend={onSendVoice}
            disabled={isDisabled}
          />
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={isDisabled || !canSend}
          className={cn(
            'flex-shrink-0 p-2 rounded-xl transition-all',
            canSend && !isDisabled
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
