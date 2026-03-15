import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { t } from '@/i18n';

const STORAGE_KEY = 'privod-last-seen-changelog';
const CURRENT_VERSION = '3.2.0';

export const WhatsNewBadge: React.FC = () => {
  const navigate = useNavigate();
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    try {
      const lastSeen = localStorage.getItem(STORAGE_KEY);
      setHasNew(lastSeen !== CURRENT_VERSION);
    } catch {
      setHasNew(true);
    }
  }, []);

  const handleClick = () => {
    try {
      localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    } catch {
      // ignore storage errors
    }
    setHasNew(false);
    navigate('/changelog');
  };

  return (
    <button
      onClick={handleClick}
      aria-label={t('whatsNew.tooltip')}
      title={t('whatsNew.tooltip')}
      className="relative p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
    >
      <Sparkles size={18} />
      {hasNew && (
        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500" />
        </span>
      )}
    </button>
  );
};
