import React from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { useAiChat } from './useAiChat';
import ChatHeader from './ChatHeader';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';

// ---------------------------------------------------------------------------
// Main orchestrator component
// ---------------------------------------------------------------------------

const AiChatWidget: React.FC = () => {
  const {
    open,
    setOpen,
    messages,
    input,
    setInput,
    thinking,
    liveData,
    pageCtx,
    messagesEndRef,
    inputRef,
    sendMessage,
    handleKey,
    clearChat,
    suggestions,
  } = useAiChat();

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'fixed bottom-6 right-6 z-toast w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200',
          'bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800',
          'focus:outline-none focus:ring-4 focus:ring-primary-300',
          open ? 'scale-90 opacity-80' : 'scale-100 opacity-100',
        )}
        aria-label={open ? t('aiChat.fab.closeAssistant') : t('aiChat.fab.openAssistant')}
        title={open ? t('aiChat.fab.close') : t('aiChat.header.title')}
      >
        {open ? (
          <ChevronDown size={22} className="text-white" />
        ) : (
          <Sparkles size={22} className="text-white" />
        )}
        {/* Pulse animation when closed */}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-success-400 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Chat panel */}
      <div
        className={cn(
          'fixed bottom-24 right-6 z-[9998] w-[380px] max-w-[calc(100vw-2rem)]',
          'bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700',
          'flex flex-col overflow-hidden',
          'transition-all duration-300 origin-bottom-right',
          open
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none',
        )}
        style={{ height: '540px' }}
      >
        <ChatHeader
          pageCtx={pageCtx}
          liveData={liveData}
          onClear={clearChat}
          onClose={() => setOpen(false)}
        />

        <ChatMessageList
          messages={messages}
          thinking={thinking}
          pageCtx={pageCtx}
          suggestions={suggestions}
          onSuggestionClick={sendMessage}
          messagesEndRef={messagesEndRef}
        />

        <ChatInput
          input={input}
          thinking={thinking}
          inputRef={inputRef}
          onInputChange={setInput}
          onKeyDown={handleKey}
          onSend={() => sendMessage()}
        />
      </div>
    </>
  );
};

export default AiChatWidget;
