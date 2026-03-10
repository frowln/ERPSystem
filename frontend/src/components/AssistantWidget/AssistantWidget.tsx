import React, { useState, useCallback } from 'react';
import { Sparkles, LifeBuoy, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { useAiChat } from '../AiChatWidget/useAiChat';
import ChatHeader from '../AiChatWidget/ChatHeader';
import ChatMessageList from '../AiChatWidget/ChatMessageList';
import ChatInput from '../AiChatWidget/ChatInput';
import SupportPanel from './SupportPanel';

type ActiveTab = 'ai' | 'support';

const AssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('ai');

  const aiChat = useAiChat();

  const handleToggle = useCallback(() => {
    setIsOpen((v) => !v);
  }, []);

  // Sync open state with aiChat for keyboard shortcuts (Escape)
  React.useEffect(() => {
    if (aiChat.open && !isOpen) {
      setIsOpen(true);
    }
  }, [aiChat.open, isOpen]);

  React.useEffect(() => {
    aiChat.setOpen(isOpen && activeTab === 'ai');
  }, [isOpen, activeTab]);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleToggle}
        className={cn(
          'fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200',
          'bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800',
          'focus:outline-none focus:ring-4 focus:ring-primary-300',
          isOpen ? 'scale-90 opacity-80' : 'scale-100 opacity-100',
        )}
        aria-label={isOpen ? t('assistantWidget.close') : t('assistantWidget.open')}
      >
        {isOpen ? (
          <ChevronDown size={22} className="text-white" />
        ) : (
          <Sparkles size={22} className="text-white" />
        )}
        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-success-400 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Panel */}
      <div
        className={cn(
          'fixed bottom-24 right-6 z-[9998] w-[400px] max-w-[calc(100vw-2rem)]',
          'bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700',
          'flex flex-col overflow-hidden',
          'transition-all duration-300 origin-bottom-right',
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none',
        )}
        style={{ height: '560px' }}
      >
        {/* Tab switcher */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 shrink-0">
          <button
            onClick={() => setActiveTab('ai')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-colors',
              activeTab === 'ai'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500 bg-white dark:bg-neutral-900'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
            )}
          >
            <Sparkles size={14} />
            {t('assistantWidget.tabAi')}
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-colors',
              activeTab === 'support'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 bg-white dark:bg-neutral-900'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
            )}
          >
            <LifeBuoy size={14} />
            {t('assistantWidget.tabSupport')}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'ai' ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <ChatHeader
              pageCtx={aiChat.pageCtx}
              liveData={aiChat.liveData}
              onClear={aiChat.clearChat}
              onClose={() => setIsOpen(false)}
            />
            <ChatMessageList
              messages={aiChat.messages}
              thinking={aiChat.thinking}
              pageCtx={aiChat.pageCtx}
              suggestions={aiChat.suggestions}
              onSuggestionClick={aiChat.sendMessage}
              messagesEndRef={aiChat.messagesEndRef}
            />
            <ChatInput
              input={aiChat.input}
              thinking={aiChat.thinking}
              inputRef={aiChat.inputRef}
              onInputChange={aiChat.setInput}
              onKeyDown={aiChat.handleKey}
              onSend={() => aiChat.sendMessage()}
            />
          </div>
        ) : (
          <SupportPanel onClose={() => setIsOpen(false)} />
        )}
      </div>
    </>
  );
};

export default AssistantWidget;
