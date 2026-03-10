import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { t } from '@/i18n';

interface Props {
  callerName: string;
  isVideo: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<Props> = ({ callerName, isVideo, onAccept, onDecline }) => {
  return (
    <div className="fixed top-4 right-4 z-[101] w-80 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden animate-in slide-in-from-top">
      <div className="p-5 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
          {isVideo ? <Video className="h-8 w-8 text-green-600 dark:text-green-400 animate-pulse" /> : <Phone className="h-8 w-8 text-green-600 dark:text-green-400 animate-pulse" />}
        </div>
        <p className="font-semibold text-neutral-900 dark:text-neutral-100">{callerName}</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          {isVideo ? t('calls.newVideoCall') : t('calls.newAudioCall')}
        </p>
      </div>
      <div className="flex border-t border-neutral-200 dark:border-neutral-700">
        <button
          onClick={onDecline}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <PhoneOff className="h-5 w-5" />
          <span className="text-sm font-medium">{t('calls.statusCancelled')}</span>
        </button>
        <div className="w-px bg-neutral-200 dark:bg-neutral-700" />
        <button
          onClick={onAccept}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
        >
          <Phone className="h-5 w-5" />
          <span className="text-sm font-medium">{t('calls.statusActive')}</span>
        </button>
      </div>
    </div>
  );
};
