import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

export interface HoverCardField {
  label: string;
  value: React.ReactNode;
}

export interface HoverCardProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  status?: React.ReactNode;
  fields: HoverCardField[];
  href?: string;
  loading?: boolean;
  className?: string;
  side?: 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
}

const SHOW_DELAY = 300;
const HIDE_DELAY = 150;

export const HoverCard: React.FC<HoverCardProps> = ({
  children,
  title,
  subtitle,
  status,
  fields,
  href,
  loading = false,
  className,
  side = 'bottom',
  align = 'start',
}) => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (showTimer.current) {
      clearTimeout(showTimer.current);
      showTimer.current = null;
    }
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const cardHeight = 220;
    const cardWidth = 280;
    const gap = 8;

    // Determine vertical position
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    let resolvedSide = side;
    if (resolvedSide === 'bottom' && spaceBelow < cardHeight + gap && spaceAbove > cardHeight + gap) {
      resolvedSide = 'top';
    } else if (resolvedSide === 'top' && spaceAbove < cardHeight + gap && spaceBelow > cardHeight + gap) {
      resolvedSide = 'bottom';
    }

    const top = resolvedSide === 'bottom' ? rect.bottom + gap : rect.top - gap;

    // Determine horizontal position
    let left: number;
    if (align === 'start') {
      left = rect.left;
    } else if (align === 'end') {
      left = rect.right - cardWidth;
    } else {
      left = rect.left + rect.width / 2 - cardWidth / 2;
    }

    // Clamp to viewport
    left = Math.max(8, Math.min(left, window.innerWidth - cardWidth - 8));

    setPos({ top, left });
  }, [side, align]);

  const handleShow = useCallback(() => {
    clearTimers();
    showTimer.current = setTimeout(() => {
      updatePosition();
      setVisible(true);
    }, SHOW_DELAY);
  }, [clearTimers, updatePosition]);

  const handleHide = useCallback(() => {
    clearTimers();
    hideTimer.current = setTimeout(() => {
      setVisible(false);
    }, HIDE_DELAY);
  }, [clearTimers]);

  const handleCardEnter = useCallback(() => {
    clearTimers();
  }, [clearTimers]);

  const handleCardLeave = useCallback(() => {
    handleHide();
  }, [handleHide]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  // Close on scroll/resize
  useEffect(() => {
    if (!visible) return;

    const handleDismiss = () => setVisible(false);
    window.addEventListener('scroll', handleDismiss, true);
    window.addEventListener('resize', handleDismiss);
    return () => {
      window.removeEventListener('scroll', handleDismiss, true);
      window.removeEventListener('resize', handleDismiss);
    };
  }, [visible]);

  const card =
    visible && pos
      ? createPortal(
          <div
            ref={cardRef}
            role="tooltip"
            onMouseEnter={handleCardEnter}
            onMouseLeave={handleCardLeave}
            className={cn(
              'fixed z-[9999] w-[280px] bg-white dark:bg-neutral-900',
              'border border-neutral-200 dark:border-neutral-700',
              'rounded-xl shadow-xl',
              'animate-fade-in',
              className,
            )}
            style={{
              top: side === 'top' ? undefined : pos.top,
              bottom: side === 'top' ? window.innerHeight - pos.top : undefined,
              left: pos.left,
            }}
          >
            {loading ? (
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                <div className="space-y-2 mt-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-3 w-16 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 pt-1">
                  {t('hoverCard.loading')}
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-4 pt-3 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {title}
                      </p>
                      {subtitle && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                          {subtitle}
                        </p>
                      )}
                    </div>
                    {status && <div className="flex-shrink-0">{status}</div>}
                  </div>
                </div>

                {/* Fields */}
                <div className="px-4 py-2.5 space-y-1.5">
                  {fields.map((field, idx) => (
                    <div key={idx} className="flex items-baseline justify-between gap-2">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 flex-shrink-0">
                        {field.label}
                      </span>
                      <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 text-right truncate">
                        {field.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                {href && (
                  <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800">
                    <a
                      href={href}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t('hoverCard.open')}
                      <ArrowRight size={12} />
                    </a>
                  </div>
                )}
              </>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleShow}
      onMouseLeave={handleHide}
      className="inline-block"
    >
      {children}
      {card}
    </div>
  );
};
