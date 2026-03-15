import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface CalculationDisclaimerProps {
  type: 'estimate' | 'budget' | 'lsr-import' | 'pricing' | 'general';
}

const STORAGE_PREFIX = 'disclaimer-dismissed-';

const MAIN_TEXT = 'Расчёты носят справочный характер. Проверяйте результаты перед принятием финансовых решений.';
const LSR_EXTRA_TEXT = 'Импортированные данные могут содержать расхождения с оригиналом. Сверьте итоги с бумажным экземпляром.';

const CalculationDisclaimer: React.FC<CalculationDisclaimerProps> = ({ type }) => {
  const storageKey = `${STORAGE_PREFIX}${type}`;
  const [dismissed, setDismissed] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) === 'true') {
        setDismissed(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, [storageKey]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    if (dontShowAgain) {
      try {
        localStorage.setItem(storageKey, 'true');
      } catch {
        // localStorage unavailable
      }
    }
  }, [dontShowAgain, storageKey]);

  if (dismissed) return null;

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 rounded-lg border px-4 py-3 mb-4',
        'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20',
      )}
      role="alert"
    >
      <AlertTriangle
        size={20}
        className="mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400"
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm text-amber-800 dark:text-amber-200">{MAIN_TEXT}</p>
        {type === 'lsr-import' && (
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{LSR_EXTRA_TEXT}</p>
        )}

        <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="rounded border-amber-400 dark:border-amber-600 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
          />
          <span className="text-xs text-amber-600 dark:text-amber-400">
            Не показывать снова
          </span>
        </label>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded hover:bg-amber-200 dark:hover:bg-amber-800/40 text-amber-600 dark:text-amber-400 transition-colors"
        aria-label="Закрыть"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default CalculationDisclaimer;
