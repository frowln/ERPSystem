import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/cn';

export type PinStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

export interface PinMarkerProps {
  id: string;
  x: number;
  y: number;
  status: PinStatus;
  label: string;
  number?: number;
  selected?: boolean;
  highlighted?: boolean;
  onClick?: (id: string) => void;
  readOnly?: boolean;
}

const STATUS_STYLES: Record<PinStatus, { bg: string; ring: string; pulse: boolean; icon: React.ElementType }> = {
  OPEN: {
    bg: 'bg-red-500',
    ring: 'ring-red-400/50',
    pulse: true,
    icon: AlertTriangle,
  },
  IN_PROGRESS: {
    bg: 'bg-amber-500',
    ring: 'ring-amber-400/50',
    pulse: false,
    icon: Clock,
  },
  CLOSED: {
    bg: 'bg-emerald-500',
    ring: 'ring-emerald-400/50',
    pulse: false,
    icon: CheckCircle,
  },
};

export const PinMarker: React.FC<PinMarkerProps> = ({
  id,
  x,
  y,
  status,
  label,
  number,
  selected = false,
  highlighted = false,
  onClick,
  readOnly = false,
}) => {
  const [hovered, setHovered] = useState(false);
  const style = STATUS_STYLES[status];
  const Icon = style.icon;

  return (
    <div
      className="absolute z-10"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      {/* Tooltip */}
      {(hovered || selected) && (
        <div
          className={cn(
            'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg shadow-lg',
            'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900',
            'text-xs font-medium whitespace-nowrap pointer-events-none',
            'animate-fade-in',
          )}
        >
          {number != null && (
            <span className="font-bold mr-1">#{number}</span>
          )}
          {label}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-neutral-900 dark:border-t-neutral-100" />
        </div>
      )}

      {/* Pin body */}
      <button
        type="button"
        onClick={() => onClick?.(id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={readOnly}
        className={cn(
          'relative flex items-center justify-center rounded-full transition-transform duration-200',
          'w-8 h-8 shadow-md border-2 border-white dark:border-neutral-800',
          style.bg,
          !readOnly && 'cursor-pointer hover:scale-110 active:scale-95',
          readOnly && 'cursor-default',
          selected && 'scale-125 ring-4',
          selected && style.ring,
          highlighted && 'scale-125 ring-4 ring-primary-400/60',
        )}
        aria-label={`${label} (${status})`}
      >
        {/* Pulse animation for OPEN defects */}
        {style.pulse && !selected && (
          <span
            className={cn(
              'absolute inset-0 rounded-full animate-ping opacity-30',
              style.bg,
            )}
          />
        )}

        {number != null ? (
          <span className="relative text-xs font-bold text-white tabular-nums">
            {number}
          </span>
        ) : (
          <Icon size={14} className="relative text-white" />
        )}
      </button>

      {/* Pin tail / drop shadow */}
      <div
        className={cn(
          'w-2 h-2 mx-auto -mt-1 rotate-45 border-b-2 border-r-2 border-white dark:border-neutral-800',
          style.bg,
        )}
      />
    </div>
  );
};
