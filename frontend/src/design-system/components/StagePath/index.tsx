import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface Stage {
  key: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface StagePathProps {
  stages: Stage[];
  currentStage: string;
  onStageClick?: (key: string) => void;
  completedColor?: string;
  className?: string;
  size?: 'sm' | 'md';
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CHEVRON_W = 12; // px — width of the arrow "notch"

/* ------------------------------------------------------------------ */
/*  Tooltip                                                            */
/* ------------------------------------------------------------------ */

interface TooltipState {
  text: string;
  x: number;
  y: number;
}

const Tooltip: React.FC<{ state: TooltipState | null }> = ({ state }) => {
  if (!state) return null;
  return (
    <div
      role="tooltip"
      className="fixed z-50 max-w-xs rounded-lg bg-neutral-900 dark:bg-neutral-100 px-3 py-2 text-xs text-white dark:text-neutral-900 shadow-lg pointer-events-none animate-in fade-in duration-150"
      style={{ left: state.x, top: state.y }}
    >
      {state.text}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Single chevron segment                                             */
/* ------------------------------------------------------------------ */

type SegmentVariant = 'completed' | 'current' | 'future';

interface SegmentProps {
  stage: Stage;
  variant: SegmentVariant;
  isFirst: boolean;
  isLast: boolean;
  onClick?: () => void;
  completedColor: string;
  size: 'sm' | 'md';
  onShowTooltip: (text: string, rect: DOMRect) => void;
  onHideTooltip: () => void;
}

/**
 * Builds a clip-path polygon that forms a chevron / arrow shape.
 *
 *  ┌──────────▷
 *  │           ╲
 *  └──────────▷
 *
 * First segment has a flat left edge; last segment has a flat right edge.
 * Middle segments have both the notch on the left and the point on the right.
 */
function chevronClipPath(isFirst: boolean, isLast: boolean, w: number): string {
  // notch depth as a fraction of the element width
  const d = `${w}px`;

  if (isFirst && isLast) {
    return 'none';
  }
  if (isFirst) {
    // flat left, pointed right
    return `polygon(0 0, calc(100% - ${d}) 0, 100% 50%, calc(100% - ${d}) 100%, 0 100%)`;
  }
  if (isLast) {
    // notched left, flat right
    return `polygon(0 0, 100% 0, 100% 100%, 0 100%, ${d} 50%)`;
  }
  // notched left, pointed right
  return `polygon(0 0, calc(100% - ${d}) 0, 100% 50%, calc(100% - ${d}) 100%, 0 100%, ${d} 50%)`;
}

const Segment: React.FC<SegmentProps> = ({
  stage,
  variant,
  isFirst,
  isLast,
  onClick,
  completedColor,
  size,
  onShowTooltip,
  onHideTooltip,
}) => {
  const ref = useRef<HTMLButtonElement | HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (!stage.description || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    onShowTooltip(stage.description, rect);
  }, [stage.description, onShowTooltip]);

  const handleMouseLeave = useCallback(() => {
    onHideTooltip();
  }, [onHideTooltip]);

  const isSm = size === 'sm';

  // --- Styling by variant ---------------------------------------------------

  const baseClasses = cn(
    'relative flex items-center justify-center gap-1.5 transition-all duration-200 select-none',
    isSm ? 'h-8 text-xs px-4' : 'h-11 text-sm px-5',
    // Minimum touch target maintained via h-11 (44px) for md
    !isFirst && (isSm ? 'ml-[-4px]' : 'ml-[-6px]'),
  );

  const variantClasses = cn(
    variant === 'completed' && cn(completedColor, 'text-white'),
    variant === 'current' && 'bg-primary-600 text-white font-semibold shadow-sm',
    variant === 'future' && 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400',
  );

  const interactiveClasses = onClick
    ? cn(
        'cursor-pointer',
        variant === 'completed' && 'hover:brightness-110',
        variant === 'future' && 'hover:bg-neutral-200 dark:hover:bg-neutral-700',
        variant === 'current' && 'hover:bg-primary-700',
      )
    : '';

  const clipPath = chevronClipPath(isFirst, isLast, CHEVRON_W);

  // Extra padding to account for clip-path notch consuming visual space
  const paddingLeft = !isFirst ? `${CHEVRON_W + (isSm ? 8 : 12)}px` : undefined;
  const paddingRight = !isLast ? `${CHEVRON_W + (isSm ? 8 : 12)}px` : undefined;

  const style: React.CSSProperties = {
    clipPath,
    WebkitClipPath: clipPath,
    paddingLeft,
    paddingRight,
  };

  const content = (
    <>
      {variant === 'completed' ? (
        <Check size={isSm ? 12 : 14} className="flex-shrink-0" strokeWidth={3} />
      ) : stage.icon ? (
        <span className="flex-shrink-0">{stage.icon}</span>
      ) : null}
      <span className="truncate whitespace-nowrap">{stage.label}</span>
    </>
  );

  const sharedProps = {
    className: cn(baseClasses, variantClasses, interactiveClasses),
    style,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleMouseEnter,
    onBlur: handleMouseLeave,
  };

  if (onClick) {
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        aria-current={variant === 'current' ? 'step' : undefined}
        {...sharedProps}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      role="listitem"
      aria-current={variant === 'current' ? 'step' : undefined}
      {...sharedProps}
    >
      {content}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Mobile compact view                                                */
/* ------------------------------------------------------------------ */

interface MobileViewProps {
  stages: Stage[];
  currentIndex: number;
  onStageClick?: (key: string) => void;
  completedColor: string;
  size: 'sm' | 'md';
}

const MobileView: React.FC<MobileViewProps> = ({
  stages,
  currentIndex,
  onStageClick,
  completedColor,
  size,
}) => {
  const current = stages[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < stages.length - 1;
  const isSm = size === 'sm';

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={!hasPrev}
        onClick={() => hasPrev && onStageClick?.(stages[currentIndex - 1].key)}
        className={cn(
          'flex-shrink-0 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center transition-colors',
          isSm ? 'h-8 w-8' : 'h-11 w-11',
          hasPrev
            ? 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer'
            : 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed',
        )}
        aria-label="Previous stage"
      >
        <ChevronLeft size={isSm ? 14 : 18} />
      </button>

      <div
        className={cn(
          'flex-1 flex items-center justify-center gap-2 rounded-lg font-semibold text-white',
          isSm ? 'h-8 px-3 text-xs' : 'h-11 px-4 text-sm',
          completedColor,
        )}
      >
        {current.icon && <span className="flex-shrink-0">{current.icon}</span>}
        <span className="truncate">{current.label}</span>
        <span className="text-white/70 flex-shrink-0 text-[10px] font-normal">
          {currentIndex + 1}/{stages.length}
        </span>
      </div>

      <button
        type="button"
        disabled={!hasNext}
        onClick={() => hasNext && onStageClick?.(stages[currentIndex + 1].key)}
        className={cn(
          'flex-shrink-0 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center transition-colors',
          isSm ? 'h-8 w-8' : 'h-11 w-11',
          hasNext
            ? 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer'
            : 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed',
        )}
        aria-label="Next stage"
      >
        <ChevronRight size={isSm ? 14 : 18} />
      </button>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main StagePath component                                           */
/* ------------------------------------------------------------------ */

export const StagePath: React.FC<StagePathProps> = ({
  stages,
  currentStage,
  onStageClick,
  completedColor = 'bg-primary-500',
  className,
  size = 'md',
}) => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive check — switch to mobile view when container is narrow
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      // Below 480px treat as mobile
      setIsMobile(entry.contentRect.width < 480);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const currentIndex = stages.findIndex((s) => s.key === currentStage);

  const handleShowTooltip = useCallback((text: string, rect: DOMRect) => {
    setTooltip({
      text,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  }, []);

  const handleHideTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  const getVariant = (index: number): SegmentVariant => {
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'future';
  };

  return (
    <div ref={containerRef} className={cn('w-full', className)}>
      {/* Desktop — full chevron path */}
      {!isMobile && (
        <div role="list" aria-label="Stage progress" className="flex items-stretch">
          {stages.map((stage, i) => (
            <Segment
              key={stage.key}
              stage={stage}
              variant={getVariant(i)}
              isFirst={i === 0}
              isLast={i === stages.length - 1}
              onClick={onStageClick ? () => onStageClick(stage.key) : undefined}
              completedColor={completedColor}
              size={size}
              onShowTooltip={handleShowTooltip}
              onHideTooltip={handleHideTooltip}
            />
          ))}
        </div>
      )}

      {/* Mobile — compact with arrows */}
      {isMobile && (
        <MobileView
          stages={stages}
          currentIndex={currentIndex === -1 ? 0 : currentIndex}
          onStageClick={onStageClick}
          completedColor={completedColor}
          size={size}
        />
      )}

      {/* Description text for current stage */}
      {currentIndex >= 0 && stages[currentIndex].description && (
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 italic">
          {stages[currentIndex].description}
        </p>
      )}

      {/* Floating tooltip for hovered stages */}
      <Tooltip state={tooltip} />
    </div>
  );
};
