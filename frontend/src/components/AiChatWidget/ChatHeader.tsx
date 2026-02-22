import React from 'react';
import { Minimize2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { PageContext, LiveData } from './types';

interface ChatHeaderProps {
  pageCtx: PageContext;
  liveData: LiveData;
  onClear: () => void;
  onClose: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ pageCtx, liveData, onClear, onClose }) => (
  <>
    {/* Header */}
    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 rounded-t-2xl flex-shrink-0">
      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
        <Sparkles size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight">{t('aiChat.header.title')}</p>
        <p className="text-xs text-primary-200 truncate">{pageCtx.section}</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onClear}
          className="p-1.5 rounded-lg hover:bg-white/20 text-primary-200 hover:text-white transition-colors"
          title={t('aiChat.header.clearChat')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l16 16M4 20L20 4" />
          </svg>
        </button>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/20 text-primary-200 hover:text-white transition-colors"
          title={t('aiChat.header.minimize')}
        >
          <Minimize2 size={15} />
        </button>
      </div>
    </div>

    {/* Context chip */}
    <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 flex-shrink-0">
      <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
        <span className={cn('w-1.5 h-1.5 rounded-full', liveData ? 'bg-success-400' : 'bg-amber-400 animate-pulse')} />
        {pageCtx.section}
        {liveData && <span className="text-neutral-400">· {t('aiChat.header.dataLoaded')}</span>}
      </span>
    </div>
  </>
);

export default React.memo(ChatHeader);
