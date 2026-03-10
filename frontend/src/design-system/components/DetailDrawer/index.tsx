import React, { useEffect, useRef, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

type DrawerWidth = 'sm' | 'md' | 'lg';

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  status?: React.ReactNode;
  children: React.ReactNode;
  width?: DrawerWidth;
  footer?: React.ReactNode;
  onNavigate?: () => void;
}

const widthStyles: Record<DrawerWidth, string> = {
  sm: 'md:w-[360px]',
  md: 'md:w-[480px]',
  lg: 'md:w-[640px]',
};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  open,
  onClose,
  title,
  subtitle,
  status,
  children,
  width = 'md',
  footer,
  onNavigate,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const getFocusableElements = useCallback(() => {
    if (!panelRef.current) return [];
    return Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((el) => {
      if (el.hasAttribute('disabled')) return false;
      if (el.getAttribute('aria-hidden') === 'true') return false;
      return true;
    });
  }, []);

  // Keyboard: Escape to close + Tab trap
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        e.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (
          activeElement === firstElement ||
          !panelRef.current?.contains(activeElement)
        ) {
          e.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    },
    [getFocusableElements, onClose, open],
  );

  useEffect(() => {
    if (!open) return undefined;
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleKeyDown]);

  // Focus trap guard: return focus to panel if it escapes
  useEffect(() => {
    if (!open) return undefined;
    const handleFocusIn = (e: FocusEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        const focusable = getFocusableElements();
        (focusable[0] ?? panelRef.current)?.focus();
      }
    };
    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, [open, getFocusableElements]);

  // Save / restore focus + lock body scroll
  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    const focusableElements = getFocusableElements();
    (focusableElements[0] ?? panelRef.current)?.focus();

    return () => {
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [getFocusableElements, open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-modal">
      {/* Overlay backdrop */}
      <div
        className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'absolute top-0 right-0 h-full bg-white dark:bg-neutral-900',
          'shadow-xl outline-none flex flex-col',
          'animate-[slideInRight_0.2s_ease-out]',
          // Mobile: full width; Desktop: fixed width by size
          'w-full',
          widthStyles[width],
        )}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-neutral-200 dark:border-neutral-700 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <h2
                  id={titleId}
                  className="text-base font-semibold text-neutral-900 dark:text-neutral-100 truncate"
                >
                  {title}
                </h2>
                {status}
              </div>
              {subtitle && (
                <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400 truncate">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label={t('detailDrawer.close')}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors -mr-1 -mt-0.5 flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {onNavigate && (
            <button
              onClick={onNavigate}
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              {t('detailDrawer.openFull')}
              <ExternalLink size={14} />
            </button>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 border-t border-neutral-200 dark:border-neutral-700 px-5 py-3 bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
