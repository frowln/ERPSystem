import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Download, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Storage key for dismissal
// ---------------------------------------------------------------------------

const DISMISSED_KEY = 'privod-install-prompt-dismissed';
const DISMISSAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (isNaN(ts)) return false;
    return Date.now() - ts < DISMISSAL_DURATION_MS;
  } catch {
    return false;
  }
}

function setDismissed(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  } catch {
    // Quota exceeded or private mode
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Install prompt banner displayed at the bottom of the screen when the
 * browser fires `beforeinstallprompt`. Dismissable; remembers dismissal
 * for 7 days via localStorage.
 */
export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // -------------------------------------------------------------------------
  // Intercept beforeinstallprompt
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isDismissed()) return;

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      promptRef.current = promptEvent;
      setDeferredPrompt(promptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Hide if installed via appinstalled event
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handler = () => {
      setVisible(false);
      setDeferredPrompt(null);
      promptRef.current = null;
    };

    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleInstall = useCallback(async () => {
    const prompt = promptRef.current;
    if (!prompt) return;

    setInstalling(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;

      if (choice.outcome === 'accepted') {
        setVisible(false);
      }
    } catch {
      // User dismissed or error
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
      promptRef.current = null;
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed();
    setVisible(false);
    setDeferredPrompt(null);
    promptRef.current = null;
  }, []);

  if (!visible || !deferredPrompt) return null;

  return (
    <div
      role="banner"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-toast',
        'animate-slide-up',
      )}
    >
      <div className={cn(
        'mx-4 mb-4 p-4 rounded-xl shadow-xl',
        'bg-white dark:bg-neutral-900',
        'border border-neutral-200 dark:border-neutral-700',
        'flex items-center gap-4',
        'sm:mx-auto sm:max-w-lg',
      )}>
        {/* App icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center">
          <span className="text-white text-lg font-bold">
            {t('common.appInitials')}
          </span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t('pwa.installTitle')}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {t('pwa.installDescription')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleInstall}
            disabled={installing}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium',
              'bg-primary-600 text-white',
              'hover:bg-primary-700 active:bg-primary-800',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors',
            )}
          >
            <Download className="h-4 w-4" />
            {t('pwa.installButton')}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={t('common.close')}
            className={cn(
              'p-1.5 rounded-md',
              'text-neutral-400 hover:text-neutral-600',
              'dark:text-neutral-500 dark:hover:text-neutral-300',
              'hover:bg-neutral-100 dark:hover:bg-neutral-800',
              'transition-colors',
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
